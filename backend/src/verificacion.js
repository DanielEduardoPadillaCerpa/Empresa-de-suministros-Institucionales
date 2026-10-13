const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cifrarBuffer, descifrarBuffer } = require('./crypto');

// ---------------------------------------------------------------------------
// Máquina de estados de la verificación institucional
// ---------------------------------------------------------------------------
// actor 'cliente' = titular de la cuenta; 'staff' = personal con el permiso.
const TRANSICIONES = Object.freeze({
  enviar: { desde: ['borrador', 'requiere_informacion', 'rechazado'], hacia: 'pendiente', actor: 'cliente' },
  aprobar: { desde: ['pendiente'], hacia: 'aprobado', actor: 'staff', permiso: 'verificacion.decidir' },
  rechazar: { desde: ['pendiente'], hacia: 'rechazado', actor: 'staff', permiso: 'verificacion.decidir', motivoObligatorio: true },
  solicitar_informacion: { desde: ['pendiente'], hacia: 'requiere_informacion', actor: 'staff', permiso: 'verificacion.decidir', motivoObligatorio: true },
  suspender: {
    desde: ['borrador', 'pendiente', 'requiere_informacion', 'aprobado', 'rechazado'],
    hacia: 'suspendido', actor: 'staff', permiso: 'cuentas.suspender', motivoObligatorio: true
  },
  // Vuelve a 'aprobado' solo si ya tenía una institución aprobada.
  reactivar: { desde: ['suspendido'], hacia: null, actor: 'staff', permiso: 'cuentas.suspender', motivoObligatorio: true }
});

const MAX_REINTENTOS_TRAS_RECHAZO = 3;

function validarTransicion(evento, estadoActual) {
  const regla = TRANSICIONES[evento];
  if (!regla) return { ok: false, error: 'Acción desconocida.' };
  if (!regla.desde.includes(estadoActual)) {
    return { ok: false, error: `No es posible "${evento.replace('_', ' ')}" una solicitud en estado "${estadoActual}".` };
  }
  return { ok: true, regla };
}

async function registrarHistorial(db, { clienteId, anterior, nuevo, evento, actorUsuarioId = null, actorTipo, motivo = null }) {
  await db.query(
    `INSERT INTO verificacion_historial
       (cliente_id, estado_anterior, estado_nuevo, evento, actor_usuario_id, actor_tipo, motivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [clienteId, anterior, nuevo, evento, actorUsuarioId, actorTipo, motivo ? String(motivo).slice(0, 500) : null]
  );
}

// Revoca todas las sesiones de las cuentas de un cliente: los JWT vigentes
// fallan en la siguiente petición (session_version) y los refresh tokens dejan
// de canjearse.
async function revocarSesionesCliente(db, clienteId) {
  await db.query('UPDATE usuarios SET session_version = session_version + 1 WHERE cliente_id = ?', [clienteId]);
  await db.query(
    `UPDATE refresh_tokens rt JOIN usuarios u ON u.id = rt.usuario_id
     SET rt.revocado = TRUE WHERE u.cliente_id = ? AND rt.revocado = FALSE`,
    [clienteId]
  );
}

// ---------------------------------------------------------------------------
// Documentos: validación por contenido y almacenamiento privado cifrado
// ---------------------------------------------------------------------------
const MAX_BYTES_DOCUMENTO = 5 * 1024 * 1024;
const MAX_DOCUMENTOS_VIGENTES = 10;

const FIRMAS = [
  { mime: 'application/pdf', extension: '.pdf', firma: Buffer.from('%PDF-') },
  { mime: 'image/png', extension: '.png', firma: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { mime: 'image/jpeg', extension: '.jpg', firma: Buffer.from([0xff, 0xd8, 0xff]) }
];

// Marcadores de contenido activo en PDF. No sustituye un antivirus (no hay uno
// disponible en este despliegue): rechaza los vectores más comunes.
const PDF_CONTENIDO_ACTIVO = /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|XFA|SubmitForm|ImportData)\b/;

function detectarTipoArchivo(contenido) {
  if (!Buffer.isBuffer(contenido) || contenido.length < 8) return null;
  return FIRMAS.find(({ firma }) => contenido.subarray(0, firma.length).equals(firma)) || null;
}

function validarDocumento(contenido) {
  if (!contenido || contenido.length === 0) return { ok: false, error: 'El archivo está vacío.' };
  if (contenido.length > MAX_BYTES_DOCUMENTO) return { ok: false, error: 'El archivo supera el máximo de 5 MB.' };
  const tipo = detectarTipoArchivo(contenido);
  if (!tipo) return { ok: false, error: 'Formato no admitido. Usa PDF, JPG o PNG (se valida el contenido, no solo la extensión).' };
  if (tipo.mime === 'application/pdf' && PDF_CONTENIDO_ACTIVO.test(contenido.toString('latin1'))) {
    return { ok: false, error: 'El PDF contiene contenido activo (scripts, adjuntos o formularios) y no puede aceptarse. Imprímelo a PDF y vuelve a intentarlo.' };
  }
  return { ok: true, tipo };
}

function directorioDocumentos() {
  return process.env.DOCUMENTOS_DIR || path.join(__dirname, '..', 'storage', 'documentos');
}

function rutaSegura(archivo) {
  if (!/^[a-f0-9]{48}\.bin$/.test(archivo)) throw new Error('DOCUMENT_PATH_INVALID');
  return path.join(directorioDocumentos(), archivo);
}

async function guardarDocumentoCifrado(contenido) {
  await fs.promises.mkdir(directorioDocumentos(), { recursive: true });
  const archivo = `${crypto.randomBytes(24).toString('hex')}.bin`;
  await fs.promises.writeFile(rutaSegura(archivo), cifrarBuffer(contenido), { flag: 'wx', mode: 0o600 });
  return archivo;
}

async function leerDocumentoCifrado(archivo) {
  return descifrarBuffer(await fs.promises.readFile(rutaSegura(archivo)));
}

async function eliminarArchivoDocumento(archivo) {
  try {
    await fs.promises.unlink(rutaSegura(archivo));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[verificacion] No se pudo borrar un documento:', err.code || 'DOCUMENT_UNLINK_FAILED');
  }
}

// Lee un multipart/form-data en memoria con límite de tamaño. Devuelve los
// campos de texto y como máximo un archivo.
async function leerMultipartDocumento(req, maxBytes = MAX_BYTES_DOCUMENTO + 64 * 1024) {
  const tipoContenido = String(req.headers['content-type'] || '');
  const coincidencia = /^multipart\/form-data;.*boundary=(?:"([^"]+)"|([^;]+))/i.exec(tipoContenido);
  if (!coincidencia) throw Object.assign(new Error('Envía el documento como multipart/form-data.'), { status: 400 });
  const declarado = Number(req.headers['content-length'] || 0);
  if (declarado > maxBytes) throw Object.assign(new Error('El archivo supera el máximo de 5 MB.'), { status: 413 });

  const partes = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('El archivo supera el máximo de 5 MB.'), { status: 413 });
    partes.push(chunk);
  }
  const cuerpo = Buffer.concat(partes);
  const separador = Buffer.from(`--${coincidencia[1] || coincidencia[2]}`);
  const campos = {};
  let archivo = null;
  let inicio = cuerpo.indexOf(separador);
  while (inicio !== -1) {
    const siguiente = cuerpo.indexOf(separador, inicio + separador.length);
    if (siguiente === -1) break;
    const parte = cuerpo.subarray(inicio + separador.length + 2, siguiente - 2);
    inicio = siguiente;
    const finCabeceras = parte.indexOf('\r\n\r\n');
    if (finCabeceras < 0) continue;
    const cabeceras = parte.subarray(0, finCabeceras).toString('utf8');
    const contenido = parte.subarray(finCabeceras + 4);
    const nombre = (/name="([^"]+)"/.exec(cabeceras) || [])[1];
    if (!nombre) continue;
    const nombreArchivo = (/filename="([^"]*)"/.exec(cabeceras) || [])[1];
    if (nombreArchivo === undefined) {
      campos[nombre] = contenido.toString('utf8').slice(0, 500);
    } else if (!archivo) {
      archivo = { nombre: nombreArchivo.replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 150) || 'documento', contenido };
    }
  }
  return { campos, archivo };
}

module.exports = {
  TRANSICIONES,
  MAX_REINTENTOS_TRAS_RECHAZO,
  MAX_BYTES_DOCUMENTO,
  MAX_DOCUMENTOS_VIGENTES,
  validarTransicion,
  registrarHistorial,
  revocarSesionesCliente,
  detectarTipoArchivo,
  validarDocumento,
  guardarDocumentoCifrado,
  leerDocumentoCifrado,
  eliminarArchivoDocumento,
  leerMultipartDocumento
};
