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

async function api(ruta, token, opciones = {}) {
  const r = await fetch(BASE + ruta, { ...opciones, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opciones.headers || {}) } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

// Personal con contraseña inicial: la cambia por API y vuelve a iniciar sesión.
async function loginStaff(correo, password) {
  let sesion = await login(correo, password);
  if (sesion.debeCambiarPassword) {
    const nueva = password + '-Nueva';
    await api('/api/mi-cuenta/password', sesion.token, { method: 'POST', body: JSON.stringify({ passwordActual: password, passwordNueva: nueva }) });
    sesion = await login(correo, nueva);
  }
  return sesion;
}

(async () => {
  const correo = `seguridad${Date.now()}@vigilancia-prueba.test`;

  // ---------- 1. Registro mínimo ----------
  const reg = await abrir('registro.html');
  const { d } = reg;
  await hasta(() => d.querySelectorAll('#vf-tipos input').length > 0);
  check('el asistente carga los tipos desde la API', d.querySelectorAll('#vf-tipos input').length === 6, d.querySelectorAll('#vf-tipos input').length + ' tipos');
  check('el formulario anterior queda oculto en modo público', d.getElementById('form-registro').hidden === true);
  check('el asistente tiene 3 pasos', d.querySelectorAll('#vf-progreso li').length === 3);
  d.getElementById('vf-siguiente').click();
  check('no avanza sin elegir tipo', d.getElementById('vf-error-tipo').textContent.length > 0);
  const radio = d.querySelector('#vf-tipos input[value="corporativo"]');
  radio.checked = true;
  radio.dispatchEvent(new reg.w.Event('change', { bubbles: true }));
  d.getElementById('vf-siguiente').click();
  check('paso 2 pide solo nombre, correo y contraseña', d.querySelector('[data-paso="1"]').hidden === false && !d.getElementById('vf-nit') && !d.getElementById('vf-telefono'));
  check('el campo específico "Sector" es opcional', Boolean(d.getElementById('vf-sector')) && !d.getElementById('vf-sector').required);
  escribir(d, 'vf-nombreCompleto', 'Laura Prueba Gómez');
  escribir(d, 'vf-correo', correo);
  escribir(d, 'vf-sector', 'seguridad_privada');
  escribir(d, 'vf-password', 'ClaveSegura2026!');
  escribir(d, 'vf-passwordConfirmacion', 'OtraClave2026!!');
  d.getElementById('vf-siguiente').click();
  check('contraseñas distintas se detectan', d.querySelector('[data-error="passwordConfirmacion"]').textContent.length > 0);
  escribir(d, 'vf-passwordConfirmacion', 'ClaveSegura2026!');
  d.getElementById('vf-siguiente').click();
  check('resumen muestra el sector elegido', d.getElementById('vf-resumen').textContent.includes('Vigilancia y seguridad privada'));
  check('la contraseña no queda en el borrador local', !(reg.w.sessionStorage.getItem('si_registro_borrador') || '').includes('ClaveSegura'));
  d.getElementById('vf-enviar').click();
  check('sin aceptar términos no se envía', d.querySelector('[data-error="aceptaTerminos"]').textContent.length > 0);
  d.getElementById('vf-terminos').checked = true;
  d.getElementById('vf-acepta').checked = true;
  d.getElementById('vf-enviar').click();
  await hasta(() => d.querySelector('[data-paso="3"]').hidden === false);
  check('confirmación de cuenta creada', d.querySelector('[data-paso="3"]').hidden === false);
  check('la confirmación explica uso general y verificación posterior', d.querySelector('[data-paso="3"]').textContent.includes('uso general'));
  check('sin errores de JavaScript en registro', reg.errores.length === 0, reg.errores.join(' | '));
  reg.w.close();

  // ---------- 2. Mi verificación (solo cuando se necesita) ----------
  const sesion = await login(correo, 'ClaveSegura2026!');
  check('login informa estado borrador', sesion.estadoVerificacion === 'borrador');
  const mi = await abrir('mi-verificacion.html', sesion);
  await hasta(() => !mi.d.getElementById('vf-contenido').hidden);
  check('Mi verificación muestra "Verificación no iniciada"', mi.d.getElementById('vf-estado').textContent === 'Verificación no iniciada');
  check('explica que la cuenta ya compra uso general', mi.d.getElementById('vf-explicacion').textContent.includes('uso general'));
  const botonEnviar = [...mi.d.querySelectorAll('#vf-acciones-estado button')].find(b => b.textContent.includes('Enviar'));
  check('"Enviar a revisión" deshabilitado sin requisitos', botonEnviar && botonEnviar.disabled);
  check('la página ofrece registrar el documento de identidad', mi.d.getElementById('vf-form-identificador').hidden === false);
  escribir(mi.d, 'vf-id-numero', '1.098.765.432');
  mi.d.getElementById('vf-id-guardar').click();
  await hasta(() => mi.d.getElementById('vf-id-mensaje').textContent.length > 0);
  check('sin autorización no se registra el documento', mi.d.getElementById('vf-id-mensaje').textContent.includes('autorizar'));
  escribir(mi.d, 'vf-id-numero', '1.098.765.432');
  mi.d.getElementById('vf-id-autoriza').checked = true;
  mi.d.getElementById('vf-id-guardar').click();
  await hasta(() => (mi.d.getElementById('vf-id-actual')?.textContent || '').includes('432'));
  check('documento registrado y mostrado enmascarado', mi.d.getElementById('vf-id-actual').textContent.includes('•••••432') && !mi.d.body.innerHTML.includes('1098765432'));
  check('sin errores de JavaScript en Mi verificación', mi.errores.length === 0, mi.errores.join(' | '));
  mi.w.close();
  const org = await api('/api/verificacion/mi-solicitud/clasificacion', sesion.token, { method: 'POST', body: JSON.stringify({
    tipoInstitucion: 'corporativo', sector: 'seguridad_privada', nombreEntidad: 'Vigilancia Prueba S.A.S.', nit: '800197268-4',
    dependencia: 'Gerencia de compras', cargo: 'Coordinadora de compras', departamento: 'Antioquia', municipio: 'Medellín', direccionInstalacion: 'Carrera 43A # 1-50'
  }) });
  check('datos de la entidad guardados', org.status === 200);
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
  check('con requisitos completos, "Enviar a revisión" se habilita', enviar2 && !enviar2.disabled);
  enviar2.click();
  await hasta(() => mi2.d.getElementById('vf-estado').textContent === 'En verificación');
  check('tras enviar, el estado pasa a "En verificación"', mi2.d.getElementById('vf-estado').textContent === 'En verificación');
  await hasta(() => !mi2.d.getElementById('vf-seccion-comprobaciones').hidden);
  check('se muestran las tres comprobaciones', mi2.d.querySelectorAll('#vf-comprobaciones li').length === 3);
  mi2.w.close();

  // ---------- 3. Panel de revisión con doble comprobación ----------
  const admin = await loginStaff('admin@prueba.test', 'AdminPrueba2026!');
  const correoConfirmador = `confirma${Date.now()}@prueba.test`;
  await api('/api/verificacion/admin/personal', admin.token, { method: 'POST', body: JSON.stringify({ correo: correoConfirmador, password: 'ConfirmaPrueba2026!', permisos: ['verificacion.ver', 'verificacion.confirmar_institucion'] }) });
  const confirmador = await loginStaff(correoConfirmador, 'ConfirmaPrueba2026!');
  const panel = await abrir('admin-verificaciones.html', admin);
  await hasta(() => panel.d.querySelector('#lista tr[data-id]'));
  const fila = [...panel.d.querySelectorAll('#lista tr[data-id]')].find(tr => tr.textContent.includes('Vigilancia Prueba'));
  check('la solicitud aparece en la cola de pendientes', Boolean(fila));
  fila.click();
  await hasta(() => panel.d.querySelector('[data-decision="aprobar"]'));
  check('el detalle muestra la doble comprobación', panel.d.getElementById('detalle').textContent.includes('Doble comprobación'));
  check('el documento aparece enmascarado', panel.d.getElementById('detalle').textContent.includes('•••••432'));
  check('"Aprobar" está deshabilitado sin comprobaciones', panel.d.querySelector('[data-decision="aprobar"]').disabled);
  panel.d.querySelector('[data-comp="vinculo_documental"]').click();
  const vinculoConfirmado = () => (panel.d.querySelector('[data-form-comp="vinculo_documental"]')?.closest('li')?.textContent || '').includes('Confirmado');
  await hasta(vinculoConfirmado);
  check('el revisor registra la revisión documental', vinculoConfirmado());
  const clienteId = Number(fila.dataset.id);
  const canal = await api(`/api/verificacion/admin/solicitudes/${clienteId}/comprobaciones/canal_independiente`, confirmador.token, { method: 'POST', body: JSON.stringify({ resultado: 'confirmado', referencia: 'Correo desde dominio oficial, radicado 991' }) });
  check('otra persona registra la confirmación institucional', canal.status === 200);
  panel.d.querySelector('#lista tr[data-id="' + clienteId + '"]').click();
  await hasta(() => panel.d.querySelector('[data-comp="entidad"]'));
  panel.d.querySelector('[data-form-comp="entidad"] [data-c="referencia"]').value = 'Certificado RUES cotejado';
  panel.d.querySelector('[data-comp="entidad"]').click();
  await hasta(() => panel.d.querySelector('[data-decision="aprobar"]') && !panel.d.querySelector('[data-decision="aprobar"]').disabled);
  check('con las tres comprobaciones, "Aprobar" se habilita', !panel.d.querySelector('[data-decision="aprobar"]').disabled);
  panel.d.querySelector('[data-decision="rechazar"]').click();
  await hasta(() => panel.d.getElementById('detalle-mensaje')?.textContent.length > 0);
  check('rechazar sin motivo muestra error', (panel.d.getElementById('detalle-mensaje')?.textContent || '').includes('motivo'));
  panel.d.querySelector('[data-decision="aprobar"]').click();
  await hasta(() => panel.d.querySelector('[data-confirmar]'));
  panel.d.querySelector('[data-confirmar]').click();
  await hasta(() => panel.d.querySelector('#detalle .vf-estado')?.textContent === 'Aprobada');
  check('aprobar desde el panel cambia el estado a "Aprobada"', panel.d.querySelector('#detalle .vf-estado')?.textContent === 'Aprobada');
  check('el administrador sembrado (no superadmin) no ve la pestaña de diagnóstico', panel.d.getElementById('tab-diagnostico-li').hidden === true);
  check('sin errores de JavaScript en el panel', panel.errores.length === 0, panel.errores.join(' | '));
  panel.w.close();

  // ---------- 4. Catálogo y cambio de contraseña ----------
  const sesionAprobada = await login(correo, 'ClaveSegura2026!');
  const cat = await abrir('index.html', sesionAprobada);
  await hasta(() => cat.d.querySelectorAll('.card-producto').length > 0, 15000);
  const tarjetas = cat.d.querySelectorAll('.card-producto').length;
  check('catálogo carga productos para la cuenta verificada', tarjetas > 0, tarjetas + ' tarjetas');
  check('ninguna tarjeta queda bloqueada por cuenta inactiva', cat.d.querySelectorAll('a.pc-btn[href="login.html"]').length === 0 && cat.d.querySelectorAll('.card-producto .precio').length > 0);
  cat.w.close();
  const cambio = await abrir('cambiar-password.html', { ...sesionAprobada, debeCambiarPassword: true });
  check('la página de cambio de contraseña avisa del cambio obligatorio', cambio.d.getElementById('cp-obligatorio').hidden === false);
  check('sin errores de JavaScript en cambio de contraseña', cambio.errores.length === 0, cambio.errores.join(' | '));
  cambio.w.close();

  const fallas = resultados.filter(r => !r.ok).length;
  console.log(`\n${resultados.length - fallas}/${resultados.length} verificaciones de interfaz correctas`);
  process.exit(fallas ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(1); });
