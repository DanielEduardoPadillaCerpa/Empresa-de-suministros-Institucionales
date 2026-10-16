// Convierte la documentación Markdown del proyecto a Word (.docx), un archivo
// por documento y junto a su .md. Los diagramas Mermaid se dibujan con Chrome
// y se insertan como imagen; los enlaces a otros .md apuntan al .docx.
//
// Uso (desde esta carpeta): npm install  y luego  node md2docx.mjs ../../.. [archivo.md ...]
// Requiere Google Chrome instalado (CHROME_PATH para otra ruta).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { renderMermaid } from '@mermaid-js/mermaid-cli';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, AlignmentType, ExternalHyperlink, ImageRun, Header, Footer, PageNumber,
  LevelFormat, TableLayoutType, VerticalAlign, PageOrientation, NoBreakHyphen
} from 'docx';

const RAIZ = path.resolve(process.argv[2] || '.');
const CARPETAS = ['00_GESTION_DEL_PROYECTO', '01_INGENIERIA_DE_REQUERIMIENTOS', '02_ANALISIS', '03_DISENO',
  '04_DESARROLLO', '05_PRUEBAS', '06_IMPLEMENTACION', '07_MANTENIMIENTO_Y_SOPORTE'];
const CACHE = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'cache-diagramas');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const AZUL = '0B2D4A';
const GRIS = '64748B';
const ANCHO_VERTICAL = 9360; // carta (12240) menos márgenes de 1" (2 × 1440)
const ANCHO_HORIZONTAL = 12960; // carta horizontal (15840) menos márgenes
let ANCHO = ANCHO_VERTICAL;
const FUENTE = 'Calibri';
const MONO = 'Consolas';

// ---------------------------------------------------------------- utilidades
function listarMarkdown(dir) {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'cache-diagramas') salida.push(...listarMarkdown(p)); }
    else if (e.name.endsWith('.md')) salida.push(p);
  }
  return salida;
}

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
// Identificadores como REQ-F-001 o TC-104.a no deben partirse en el guion:
// se usa el guion no separable (U+2011).
const ID_DOC = /\b(?:REQ-(?:F|NF)|TC|UC|DIS|BUG|RSK|RN|ADR|CA|HU|DOC|INC|LIM|REL|MOD|ACT|DEC-P|RT|EJ)-[0-9A-Z][0-9A-Za-z.-]*/g;
const noPartir = t => t.replace(ID_DOC, m => m.replace(/-/g, '‑'));
const decodificar = t => noPartir(String(t ?? '').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, m => ENTIDADES[m]));
const sha = t => crypto.createHash('sha1').update(t).digest('hex').slice(0, 16);

function tamanoPng(buffer) {
  return { ancho: buffer.readUInt32BE(16), alto: buffer.readUInt32BE(20) };
}

// ------------------------------------------------------------ diagramas
async function dibujarDiagramas(archivos) {
  fs.mkdirSync(CACHE, { recursive: true });
  const pendientes = new Map();
  for (const archivo of archivos) {
    const texto = fs.readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n');
    for (const m of texto.matchAll(/```mermaid\n([\s\S]*?)```/g)) {
      const codigo = m[1].trim();
      const destino = path.join(CACHE, sha(codigo) + '.png');
      if (!fs.existsSync(destino)) pendientes.set(destino, { codigo, archivo });
    }
  }
  if (!pendientes.size) return [];
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const fallidos = [];
  try {
    for (const [destino, { codigo, archivo }] of pendientes) {
      try {
        const { data } = await renderMermaid(navegador, codigo, 'png', {
          backgroundColor: 'white',
          viewport: { width: 2400, height: 1200, deviceScaleFactor: 2 },
          mermaidConfig: {
            theme: 'default', fontFamily: 'Arial',
            flowchart: { htmlLabels: true, useMaxWidth: false },
            sequence: { useMaxWidth: false }, er: { useMaxWidth: false },
            state: { useMaxWidth: false }, class: { useMaxWidth: false }
          }
        });
        fs.writeFileSync(destino, data);
        process.stdout.write('.');
      } catch (err) {
        fallidos.push(`${path.relative(RAIZ, archivo)}: ${String(err.message).split('\n')[0]}`);
      }
    }
  } finally {
    await navegador.close();
  }
  process.stdout.write('\n');
  return fallidos;
}

// ------------------------------------------------------------ texto en línea
function enlaceDestino(href, archivoMd) {
  if (/^(https?:|mailto:)/i.test(href)) return href;
  if (href.startsWith('#')) return null;
  const [ruta, ancla] = href.split('#');
  let nueva = ruta;
  if (/\.md$/i.test(ruta)) {
    const absoluta = path.resolve(path.dirname(archivoMd), decodeURIComponent(ruta));
    // Solo se cambia a .docx si ese documento también se convierte.
    if (CARPETAS.some(c => absoluta.startsWith(path.join(RAIZ, c) + path.sep))) nueva = ruta.replace(/\.md$/i, '.docx');
  }
  return nueva + (ancla && !/\.docx$/.test(nueva) ? '#' + ancla : '');
}

function inline(tokens, archivoMd, estilo = {}) {
  const runs = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case 'strong': runs.push(...inline(t.tokens, archivoMd, { ...estilo, bold: true })); break;
      case 'em': runs.push(...inline(t.tokens, archivoMd, { ...estilo, italics: true })); break;
      case 'del': runs.push(...inline(t.tokens, archivoMd, { ...estilo, strike: true })); break;
      case 'codespan':
        runs.push(textoRun({ ...estilo, text: decodificar(t.text), font: MONO, size: estilo.size ? estilo.size - 1 : 19, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F5F9' } }));
        break;
      case 'br': runs.push(textoRun({ break: 1 })); break;
      case 'link': {
        const destino = enlaceDestino(t.href, archivoMd);
        let tokensTexto = t.tokens;
        // Si el texto visible es la ruta del .md, se muestra la del .docx.
        if (destino && /\.docx$/.test(destino) && tokensTexto?.length === 1 && /\.md$/.test(tokensTexto[0].text || '')) {
          tokensTexto = [{ ...tokensTexto[0], text: tokensTexto[0].text.replace(/\.md$/, '.docx'), tokens: undefined }];
        }
        const hijos = inline(tokensTexto, archivoMd, { ...estilo, color: '1D4ED8', underline: {} });
        if (destino) runs.push(new ExternalHyperlink({ link: destino, children: hijos }));
        else runs.push(...hijos);
        break;
      }
      case 'image': runs.push(textoRun({ ...estilo, text: `[Imagen: ${decodificar(t.text || t.href)}]`, italics: true })); break;
      case 'html': {
        const limpio = decodificar(t.text.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''));
        if (limpio) runs.push(textoRun({ ...estilo, text: limpio }));
        break;
      }
      case 'escape': runs.push(textoRun({ ...estilo, text: decodificar(t.text) })); break;
      case 'text':
        if (t.tokens && t.tokens.length) runs.push(...inline(t.tokens, archivoMd, estilo));
        else runs.push(textoRun({ ...estilo, text: decodificar(t.text) }));
        break;
      default:
        if (t.raw) runs.push(textoRun({ ...estilo, text: decodificar(t.raw) }));
    }
  }
  return runs;
}

// ------------------------------------------------------------ bloques
function textoRun(opciones) {
  const o = typeof opciones === 'string' ? { text: opciones } : opciones;
  if (typeof o.text !== 'string' || !o.text.includes('‑')) return new TextRun(o);
  const partes = o.text.split('‑');
  const hijos = [];
  partes.forEach((parte, i) => { if (i) hijos.push(new NoBreakHyphen()); if (parte) hijos.push(parte); });
  const { text, ...resto } = o;
  return new TextRun({ ...resto, children: hijos });
}

let instanciaLista = 0;
// Títulos generados, para llevarlos junto con un diagrama que pasa a su propia página.
const TITULOS = new WeakSet();

function bloques(tokens, archivoMd, ctx = { nivelLista: -1 }) {
  const salida = [];
  for (const t of tokens) {
    switch (t.type) {
      case 'heading': {
        const niveles = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
        const titulo = new Paragraph({ heading: t.depth === 1 ? HeadingLevel.TITLE : niveles[t.depth], children: inline(t.tokens, archivoMd), keepNext: true });
        TITULOS.add(titulo);
        salida.push(titulo);
        break;
      }
      case 'paragraph':
        salida.push(new Paragraph({ children: inline(t.tokens, archivoMd), spacing: { after: 120 } }));
        break;
      case 'text':
        salida.push(new Paragraph({ children: inline(t.tokens || [t], archivoMd), spacing: { after: 60 } }));
        break;
      case 'list': {
        const nivel = Math.min(ctx.nivelLista + 1, 4);
        const instancia = ++instanciaLista;
        for (const item of t.items) {
          const [primero, ...resto] = item.tokens;
          const marca = item.task ? (item.checked ? '☑ ' : '☐ ') : '';
          const contenido = primero && (primero.type === 'text' || primero.type === 'paragraph')
            ? inline(primero.tokens || [primero], archivoMd) : [];
          if (marca) contenido.unshift(textoRun({ text: marca.trim(), font: 'Segoe UI Symbol' }), textoRun({ text: ' ' }));
          salida.push(new Paragraph({
            numbering: t.ordered
              ? { reference: 'numerada', level: nivel, instance: instancia }
              : { reference: 'viñetas', level: nivel },
            children: contenido,
            spacing: { after: 40 }
          }));
          const otros = primero && (primero.type === 'text' || primero.type === 'paragraph') ? resto : item.tokens;
          salida.push(...bloques(otros, archivoMd, { nivelLista: nivel }));
        }
        break;
      }
      case 'table':
        salida.push(tabla(t, archivoMd));
        salida.push(new Paragraph({ children: [], spacing: { after: 80 } }));
        break;
      case 'code':
        if ((t.lang || '').trim() === 'mermaid') salida.push(...diagrama(t.text.trim(), archivoMd));
        else salida.push(...codigo(t.text));
        break;
      case 'blockquote':
        for (const p of bloques(t.tokens, archivoMd, ctx)) salida.push(p);
        break;
      case 'hr':
        salida.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 1 } }, spacing: { after: 160 } }));
        break;
      case 'html': {
        const limpio = decodificar(t.text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
        for (const linea of limpio.split('\n').filter(Boolean)) salida.push(new Paragraph({ children: [textoRun(linea)] }));
        break;
      }
      case 'space': break;
      default:
        if (t.raw && t.raw.trim()) salida.push(new Paragraph({ children: [textoRun(decodificar(t.raw.trim()))] }));
    }
  }
  return salida;
}

function codigo(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n');
  return lineas.map((linea, i) => new Paragraph({
    children: [textoRun({ text: linea || ' ', font: MONO, size: 17 })],
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F5F9' },
    spacing: { after: i === lineas.length - 1 ? 160 : 0, line: 240 },
    indent: { left: 120, right: 120 }
  }));
}

function diagrama(codigoMermaid, archivoMd) {
  const png = path.join(CACHE, sha(codigoMermaid) + '.png');
  if (!fs.existsSync(png)) {
    return [new Paragraph({ children: [textoRun({ text: 'Diagrama (no se pudo dibujar; código Mermaid):', italics: true, color: GRIS })] }), ...codigo(codigoMermaid)];
  }
  const datos = fs.readFileSync(png);
  const { ancho, alto } = tamanoPng(datos);
  // La imagen se tomó con escala 2: a tamaño real mide la mitad en píxeles.
  // Área útil en píxeles (96 ppp): vertical 6.5"×8.6", horizontal 9"×6".
  const w0 = ancho / 2;
  const h0 = alto / 2;
  const escalaVertical = Math.min(1, 620 / w0, 820 / h0);
  const escalaHorizontal = Math.min(1, 860 / w0, 560 / h0);
  const docHorizontal = ANCHO === ANCHO_HORIZONTAL;
  // Página carta: en un documento vertical, el diagrama va en su propia página
  // horizontal si así se ve al menos un 25 % más grande.
  let pagina = null;
  let escala = docHorizontal ? escalaHorizontal : escalaVertical;
  // En una página propia se reservan ~1.3" (carta) o ~2" (doble carta) para el
  // título y la frase que acompañan al diagrama.
  const horizontalPropia = Math.min(1, 860 / w0, 430 / h0);
  if (!docHorizontal && horizontalPropia > escalaVertical * 1.25) {
    pagina = { tamano: 'carta', apaisada: true };
    escala = horizontalPropia;
  }
  // Si en carta queda por debajo del 50 %, se usa una página doble carta
  // (11 × 17", área útil 9.5 × 15.5") en la orientación que más lo agrande.
  if (escala < 0.5) {
    const dobleVertical = Math.min(1, 900 / w0, 1240 / h0);
    const dobleHorizontal = Math.min(1, 1460 / w0, 700 / h0);
    const apaisada = dobleHorizontal > dobleVertical;
    pagina = { tamano: 'doble_carta', apaisada };
    escala = Math.max(dobleVertical, dobleHorizontal);
  }
  const w = Math.round(w0 * escala);
  const h = Math.round(h0 * escala);
  const parrafo = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type: 'png', data: datos, transformation: { width: w, height: h }, altText: { title: 'Diagrama', description: 'Diagrama generado a partir de Mermaid', name: 'diagrama' } })],
    spacing: { before: 80, after: 160, line: 240 }
  });
  return pagina ? [{ paginaPropia: { parrafo, ...pagina } }] : [parrafo];
}

function textoPlano(tokens) {
  return (tokens || []).map(t => (t.tokens ? textoPlano(t.tokens) : decodificar(t.text ?? t.raw ?? ''))).join('');
}

// Ancho mínimo de cada columna: su palabra más larga (sin pasar de 2600 twips,
// para que una ruta de archivo larga no se coma la tabla). Twips por carácter
// ≈ tamaño en medios puntos × 5.5.
function minimosColumna(t, tamanoLetra) {
  return t.header.map((h, i) => {
    const palabras = [h, ...t.rows.map(r => r[i])].flatMap(c => textoPlano(c?.tokens).split(/\s+/));
    const mayor = Math.max(3, ...palabras.map(p => p.length));
    return Math.min(2600, Math.round(mayor * tamanoLetra * 6) + 220);
  });
}

function necesitaHorizontal(tokens) {
  const tablas = [];
  const recorrer = lista => { for (const x of lista || []) { if (x.type === 'table') tablas.push(x); if (x.tokens) recorrer(x.tokens); if (x.items) x.items.forEach(it => recorrer(it.tokens)); } };
  recorrer(tokens);
  return tablas.some(tb => {
    const tam = tb.header.length >= 6 ? 15 : 17;
    return minimosColumna(tb, tam).reduce((a, b) => a + b, 0) > ANCHO_VERTICAL;
  });
}

function tabla(t, archivoMd) {
  const columnas = t.header.length;
  // Ancho proporcional al contenido (con mínimo y máximo por columna).
  const largos = t.header.map((h, i) => {
    const celdas = [h, ...t.rows.map(r => r[i])].map(c => textoPlano(c?.tokens).length);
    const promedio = celdas.reduce((a, b) => a + b, 0) / celdas.length;
    return Math.max(4, Math.min(60, Math.max(promedio, textoPlano(h.tokens).length * 0.8)));
  });
  const tamanoLetra = columnas >= 6 ? 15 : 17;
  const minimos = minimosColumna(t, tamanoLetra);
  const suma = largos.reduce((a, b) => a + b, 0);
  const libre = Math.max(0, ANCHO - minimos.reduce((a, b) => a + b, 0));
  let anchos = largos.map((l, i) => minimos[i] + Math.round((l / suma) * libre));
  // Si aun así no cabe, se reduce todo en proporción (mínimo 500 twips) y la
  // diferencia de redondeo se descuenta de la columna más ancha.
  const total = anchos.reduce((a, b) => a + b, 0);
  if (total > ANCHO) anchos = anchos.map(a => Math.max(500, Math.floor(a * ANCHO / total)));
  const diferencia = anchos.reduce((a, b) => a + b, 0) - ANCHO;
  if (diferencia) anchos[anchos.indexOf(Math.max(...anchos))] -= diferencia;
  const tamano = tamanoLetra;
  const borde = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  const bordes = { top: borde, bottom: borde, left: borde, right: borde };
  const celda = (contenido, i, encabezado) => new TableCell({
    width: { size: anchos[i], type: WidthType.DXA },
    borders: bordes,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    shading: encabezado ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E2E8F0' } : undefined,
    children: [new Paragraph({ children: inline(contenido?.tokens, archivoMd, { size: tamano, bold: encabezado || undefined }) })]
  });
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: anchos,
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ tableHeader: true, children: t.header.map((h, i) => celda(h, i, true)) }),
      ...t.rows.map(fila => new TableRow({ children: fila.map((c, i) => celda(c, i, false)) }))
    ]
  });
}

// ------------------------------------------------------------ documento
function niveles(formato, textoNivel) {
  return [0, 1, 2, 3, 4].map(n => ({
    level: n,
    format: formato,
    text: textoNivel(n),
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360 + n * 360, hanging: 260 } } }
  }));
}

function secciones(cuerpo, horizontal) {
  const lista = [{ hijos: [], apaisada: horizontal }];
  for (const elemento of cuerpo) {
    if (elemento && elemento.paginaPropia) {
      const { parrafo, tamano, apaisada } = elemento.paginaPropia;
      // Los títulos que preceden al diagrama pasan con él a su página.
      const actual = lista[lista.length - 1].hijos;
      const titulos = [];
      let inicio = -1;
      for (let i = actual.length - 1, vistos = 0; i >= 0 && vistos < 4; i--, vistos++) {
        if (!(actual[i] instanceof Paragraph)) break;
        if (TITULOS.has(actual[i])) { inicio = i; break; }
      }
      if (inicio >= 0) titulos.push(...actual.splice(inicio));
      lista.push({ hijos: [...titulos, parrafo], apaisada, tamano });
      lista.push({ hijos: [], apaisada: horizontal });
    } else {
      lista[lista.length - 1].hijos.push(elemento);
    }
  }
  return lista.filter(s => s.hijos.length);
}

async function convertir(archivoMd) {
  const md = fs.readFileSync(archivoMd, 'utf8').replace(/\r\n/g, '\n');
  const tokens = marked.lexer(md, { gfm: true });
  const titulo = decodificar((tokens.find(t => t.type === 'heading' && t.depth === 1)?.text) || path.basename(archivoMd, '.md'))
    .replace(/[*`_]/g, '');
  instanciaLista = 0;
  const horizontal = necesitaHorizontal(tokens);
  ANCHO = horizontal ? ANCHO_HORIZONTAL : ANCHO_VERTICAL;
  const cuerpo = bloques(tokens, archivoMd);
  const doc = new Document({
    creator: 'Suministros Institucionales — documentación del proyecto',
    title: titulo,
    description: 'Generado a partir de ' + path.relative(RAIZ, archivoMd).replace(/\\/g, '/'),
    styles: {
      default: { document: { run: { font: FUENTE, size: 21 }, paragraph: { spacing: { line: 264 } } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font: FUENTE, size: 36, bold: true, color: AZUL }, paragraph: { spacing: { after: 200 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 30, bold: true, color: AZUL }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 26, bold: true, color: AZUL }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 23, bold: true, color: '1E3A5F' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FUENTE, size: 21, bold: true, color: '1E3A5F' }, paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 3 } }
      ]
    },
    numbering: {
      config: [
        { reference: 'viñetas', levels: niveles(LevelFormat.BULLET, n => ['•', '◦', '▪', '•', '◦'][n]) },
        { reference: 'numerada', levels: niveles(LevelFormat.DECIMAL, n => `%${n + 1}.`) }
      ]
    },
    sections: secciones(cuerpo, horizontal).map(({ hijos, apaisada, tamano }) => ({
      properties: { page: { size: { ...(tamano === 'doble_carta' ? { width: 15840, height: 24480 } : { width: 12240, height: 15840 }), orientation: apaisada ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440, header: 600, footer: 600 } } },
      headers: {
        default: new Header({ children: [new Paragraph({
          children: [textoRun({ text: 'Suministros Institucionales  ·  ' + titulo, size: 16, color: GRIS })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 4 } }
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [textoRun({ size: 16, color: GRIS, children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES] })]
        })] })
      },
      children: hijos
    }))
  });
  const destino = archivoMd.replace(/\.md$/i, '.docx');
  fs.writeFileSync(destino, await Packer.toBuffer(doc));
  return destino;
}

// ------------------------------------------------------------ principal
const solicitados = process.argv.slice(3).map(a => path.resolve(RAIZ, a));
const archivos = solicitados.length ? solicitados : CARPETAS.flatMap(c => listarMarkdown(path.join(RAIZ, c)));
console.log(`Documentos: ${archivos.length}`);
const fallidosDiagramas = await dibujarDiagramas(archivos);
let convertidos = 0;
const errores = [];
for (const archivo of archivos) {
  try {
    await convertir(archivo);
    convertidos++;
  } catch (err) {
    errores.push(`${path.relative(RAIZ, archivo)}: ${err.message}`);
  }
}
console.log(JSON.stringify({ convertidos, errores, diagramasFallidos: fallidosDiagramas }, null, 2));
