// Uso (desde backend/): node test/ui/servidor-prueba.js  (en otra terminal)  y luego  node test/ui/ui-e2e.js
// Requiere la base suministros_ui_test en el MySQL de pruebas (ver docs/PLAN_PRUEBAS.md).
// Prueba de interfaz (jsdom) del registro, Mi verificación y panel de revisión.
// Todo lo que apunte a localhost:8081 se redirige al servidor de prueba 8091.
const path = require('path');
const fs = require('fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');

const BASE = 'http://localhost:8091';
const CODIGOS = path.join(require('os').tmpdir(), 'suministros-codigos-mfa.json');
const espera = ms => new Promise(r => setTimeout(r, ms));
const resultados = [];
function check(nombre, condicion, detalle = '') {
  resultados.push({ nombre, ok: Boolean(condicion) });
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
}

class Cargador extends ResourceLoader {
  fetch(url, opciones) {
    const destino = url.replace('http://localhost:8081', BASE);
    const promesa = super.fetch(destino, opciones);
    if (!/\.js(\?|$)/.test(destino) || !destino.startsWith(BASE)) return promesa;
    return promesa.then(buf => Buffer.from(buf.toString('utf8').split('http://localhost:8081').join(BASE)));
  }
}

async function abrir(pagina, sesion) {
  const errores = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errores.push(e.message));
  const dom = await JSDOM.fromURL(`${BASE}/${pagina}`, {
    runScripts: 'dangerously', resources: new Cargador(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      window.fetch = (url, op) => fetch(String(url).replace('http://localhost:8081', BASE), op);
      window.confirm = () => true;
      window.scrollTo = () => {};
      window.Element.prototype.scrollIntoView = () => {};
      if (sesion) window.localStorage.setItem('si_auth', JSON.stringify(sesion));
    }
  });
  await new Promise(r => dom.window.addEventListener('load', r));
  await espera(1500);
  return { dom, w: dom.window, d: dom.window.document, errores };
}

async function hasta(cond, ms = 8000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) { if (cond()) return true; await espera(150); }
  return false;
}

async function login(correo, password) {
  const r1 = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, password }) });
  const reto = await r1.json();
  await espera(300);
  const codigo = JSON.parse(fs.readFileSync(CODIGOS, 'utf8'))[correo];
  const r2 = await fetch(`${BASE}/api/auth/mfa/verificar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: reto.challengeId, code: codigo }) });
  return r2.json();
}

function escribir(d, id, valor) {
  const el = d.getElementById(id);
  el.value = valor;
  el.dispatchEvent(new d.defaultView.Event('change', { bubbles: true }));
}

(async () => {
  const correo = `seguridad${Date.now()}@vigilancia-prueba.test`;

  // ---------- 1. Registro por pasos ----------
  const reg = await abrir('registro.html');
  const { d } = reg;
  await hasta(() => d.querySelectorAll('#vf-tipos input').length > 0);
  check('el asistente carga los tipos desde la API', d.querySelectorAll('#vf-tipos input').length === 6, d.querySelectorAll('#vf-tipos input').length + ' tipos');
  check('el formulario anterior queda oculto en modo público', d.getElementById('form-registro').hidden === true);
  d.getElementById('vf-siguiente').click();
  check('no avanza sin elegir tipo', d.getElementById('vf-error-tipo').textContent.length > 0);
  const radio = d.querySelector('#vf-tipos input[value="corporativo"]');
  radio.checked = true;
  radio.dispatchEvent(new reg.w.Event('change', { bubbles: true }));
  d.getElementById('vf-siguiente').click();
  check('paso 2 muestra los requisitos del tipo', d.querySelector('[data-paso="1"]').hidden === false && d.querySelectorAll('#vf-requisitos-lista li').length === 4);
  d.getElementById('vf-siguiente').click();
  check('paso 3 muestra el campo específico "Sector"', Boolean(d.getElementById('vf-sector')));
  escribir(d, 'vf-nombreEntidad', 'Vigilancia Prueba S.A.S.');
  escribir(d, 'vf-nit', '800197268-5');
  escribir(d, 'vf-dependencia', 'Gerencia de compras');
  escribir(d, 'vf-departamento', 'Antioquia');
  escribir(d, 'vf-municipio', 'Medellín');
  escribir(d, 'vf-direccionInstalacion', 'Carrera 43A # 1-50');
  escribir(d, 'vf-sector', 'seguridad_privada');
  d.getElementById('vf-siguiente').click();
  check('NIT con dígito incorrecto se detecta en el navegador', d.querySelector('[data-error="nit"]').textContent.includes('dígito'));
  escribir(d, 'vf-nit', '800.197.268-4');
  d.getElementById('vf-siguiente').click();
  check('con NIT válido avanza a "Tus datos"', d.querySelector('[data-paso="3"]').hidden === false);
  escribir(d, 'vf-nombreFuncionario', 'Laura Prueba Gómez');
  escribir(d, 'vf-cargo', 'Coordinadora de compras');
  escribir(d, 'vf-correo', correo);
  escribir(d, 'vf-telefono', '6041234567');
  escribir(d, 'vf-password', 'ClaveSegura2026!');
  escribir(d, 'vf-passwordConfirmacion', 'OtraClave2026!!');
  d.getElementById('vf-siguiente').click();
  check('contraseñas distintas se detectan', d.querySelector('[data-error="passwordConfirmacion"]').textContent.length > 0);
  escribir(d, 'vf-passwordConfirmacion', 'ClaveSegura2026!');
  d.getElementById('vf-siguiente').click();
  check('resumen muestra el sector elegido', d.getElementById('vf-resumen').textContent.includes('Vigilancia y seguridad privada'));
  check('la contraseña no queda en el borrador local', !(reg.w.sessionStorage.getItem('si_registro_borrador') || '').includes('ClaveSegura'));
  d.getElementById('vf-enviar').click();
  check('sin autorización de datos no se envía', d.querySelector('[data-error="aceptaTratamiento"]').textContent.length > 0);
  d.getElementById('vf-acepta').checked = true;
  d.getElementById('vf-enviar').click();
  await hasta(() => d.querySelector('[data-paso="5"]').hidden === false);
  check('confirmación de solicitud registrada', d.querySelector('[data-paso="5"]').hidden === false);
  check('confirmación lista 3 documentos obligatorios (incl. licencia Supervigilancia)', d.querySelectorAll('#vf-confirmacion-docs li').length === 3 && d.getElementById('vf-confirmacion-docs').textContent.includes('Superintendencia de Vigilancia'), d.getElementById('vf-confirmacion-docs').children.length + ' li: ' + d.getElementById('vf-confirmacion-docs').innerHTML.slice(0, 300));
  check('sin errores de JavaScript en registro', reg.errores.length === 0, reg.errores.join(' | '));
  reg.w.close();

  // ---------- 2. Mi verificación ----------
  const sesion = await login(correo, 'ClaveSegura2026!');
  check('login informa estado borrador', sesion.estadoVerificacion === 'borrador');
  const mi = await abrir('mi-verificacion.html', sesion);
  await hasta(() => !mi.d.getElementById('vf-contenido').hidden);
  check('Mi verificación muestra el estado "Borrador"', mi.d.getElementById('vf-estado').textContent === 'Borrador');
  const botonEnviar = [...mi.d.querySelectorAll('#vf-acciones-estado button')].find(b => b.textContent.includes('Enviar'));
  check('"Enviar a revisión" deshabilitado sin documentos', botonEnviar && botonEnviar.disabled);
  check('la página ofrece adjuntar documentos', mi.d.getElementById('vf-form-documento').hidden === false);
  check('sin errores de JavaScript en Mi verificación', mi.errores.length === 0, mi.errores.join(' | '));
  mi.w.close();
  for (const tipo of ['certificado_existencia', 'licencia_supervigilancia', 'acreditacion_vinculacion']) {
    const fd = new FormData();
    fd.append('tipoDocumento', tipo);
    fd.append('archivo', new Blob([Buffer.from('%PDF-1.4\n%%EOF\n')], { type: 'application/pdf' }), `${tipo}.pdf`);
    const r = await fetch(`${BASE}/api/verificacion/mi-solicitud/documentos`, { method: 'POST', headers: { Authorization: 'Bearer ' + sesion.token }, body: fd });
    check(`documento ${tipo} adjuntado`, r.status === 201);
  }
  const mi2 = await abrir('mi-verificacion.html', sesion);
  await hasta(() => !mi2.d.getElementById('vf-contenido').hidden);
  const enviar2 = [...mi2.d.querySelectorAll('#vf-acciones-estado button')].find(b => b.textContent.includes('Enviar'));
  check('con documentos, "Enviar a revisión" se habilita', enviar2 && !enviar2.disabled);
  enviar2.click();
  await hasta(() => mi2.d.getElementById('vf-estado').textContent === 'Pendiente de verificación');
  check('tras enviar, el estado pasa a "Pendiente de verificación"', mi2.d.getElementById('vf-estado').textContent === 'Pendiente de verificación');
  mi2.w.close();

  // ---------- 3. Panel de revisión ----------
  const admin = await login('admin@prueba.test', 'AdminPrueba2026!');
  const panel = await abrir('admin-verificaciones.html', admin);
  await hasta(() => panel.d.querySelector('#lista tr[data-id]'));
  const fila = [...panel.d.querySelectorAll('#lista tr[data-id]')].find(tr => tr.textContent.includes('Vigilancia Prueba'));
  check('la solicitud aparece en la cola de pendientes', Boolean(fila));
  fila.click();
  await hasta(() => panel.d.querySelector('[data-decision="aprobar"]'));
  check('el detalle muestra requisitos completos', panel.d.getElementById('detalle').textContent.includes('Correo verificado'));
  const rechazar = panel.d.querySelector('[data-decision="rechazar"]');
  rechazar.click();
  await hasta(() => panel.d.getElementById('detalle-mensaje')?.textContent.length > 0);
  check('rechazar sin motivo muestra error', (panel.d.getElementById('detalle-mensaje')?.textContent || '').includes('motivo'));
  panel.d.querySelector('[data-decision="aprobar"]').click();
  await hasta(() => panel.d.querySelector('[data-confirmar]'));
  panel.d.querySelector('[data-confirmar]').click();
  await hasta(() => panel.d.querySelector('#detalle .vf-estado')?.textContent === 'Aprobada');
  check('aprobar desde el panel cambia el estado a "Aprobada"', panel.d.querySelector('#detalle .vf-estado')?.textContent === 'Aprobada');
  check('las pestañas de productos y personal están disponibles para el superadmin', !panel.d.querySelector('[data-requiere="productos.cumplimiento"]').closest('li').hidden);
  check('sin errores de JavaScript en el panel', panel.errores.length === 0, panel.errores.join(' | '));
  panel.w.close();

  // ---------- 4. Catálogo con cuenta aprobada ----------
  const sesionAprobada = await login(correo, 'ClaveSegura2026!');
  const cat = await abrir('index.html', sesionAprobada);
  await hasta(() => cat.d.querySelectorAll('.card-producto').length > 0, 15000);
  const tarjetas = cat.d.querySelectorAll('.card-producto').length;
  check('catálogo carga productos para la cuenta aprobada', tarjetas > 0, tarjetas + ' tarjetas');
  check('ninguna tarjeta pide "Completa tu verificación"', cat.d.querySelectorAll('a.pc-btn[href="mi-verificacion.html"]').length === 0 && cat.d.querySelectorAll('.card-producto .precio').length > 0);
  cat.w.close();

  const fallas = resultados.filter(r => !r.ok).length;
  console.log(`\n${resultados.length - fallas}/${resultados.length} verificaciones de interfaz correctas`);
  process.exit(fallas ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
