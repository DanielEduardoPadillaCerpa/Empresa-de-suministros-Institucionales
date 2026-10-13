// Genera n8n/workflows/W11-verificacion-compra.json a partir de este archivo
// (el código de los nodos es más fácil de revisar aquí que dentro del JSON).
//   node n8n/generar-w11.js
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. Verifica la firma del backend y reparte el evento en tareas
// ---------------------------------------------------------------------------
const codigoVerificar = String.raw`const crypto = require('crypto');
const item = $input.first();
const headers = item.json.headers || {};
const ENV = typeof $env !== 'undefined' && $env ? $env : process.env;
const rawBody = typeof item.json.body === 'string' ? item.json.body
  : (item.json.body && typeof item.json.body === 'object' ? JSON.stringify(item.json.body) : null);
if (typeof rawBody !== 'string') throw new Error('Webhook body is missing');
const timestamp = String(headers['x-automation-timestamp'] || '');
const received = String(headers['x-automation-signature'] || '');
const secret = ENV.N8N_W11_SECRET || '';
if (secret.length < 32 || !/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(received)) throw new Error('Invalid webhook configuration');
if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) throw new Error('Expired webhook signature');
const expected = crypto.createHmac('sha256', secret).update(timestamp + '.' + rawBody).digest('hex');
const a = Buffer.from(received, 'hex');
const b = Buffer.from(expected, 'hex');
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid webhook signature');
const p = JSON.parse(rawBody);
const keys = Object.keys(p).sort().join(',');
const ref = value => /^[a-f0-9]{32}$/.test(String(value || ''));
const fecha = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const TIPOS = ['policia', 'defensa', 'bomberos', 'socorro', 'penitenciario', 'corporativo'];
const salida = [];
if (p.evento === 'verificacion.solicitada') {
  const esperadas = p.consultarEntidad === true ? 'consultarEntidad,evento,nit,ref,timestamp,tipoInstitucion' : 'consultarEntidad,evento,ref,timestamp,tipoInstitucion';
  if (keys !== esperadas || !ref(p.ref) || !TIPOS.includes(p.tipoInstitucion) || !fecha(p.timestamp)) throw new Error('Invalid verification event');
  if (p.consultarEntidad === true) {
    // Solo NIT de persona jurídica (9 dígitos que empiezan por 8 o 9): nunca una cédula.
    if (!/^[89]\d{8}$/.test(String(p.nit))) throw new Error('Invalid NIT');
    salida.push({ json: { ruta: 'entidad', ref: p.ref, tipoInstitucion: p.tipoInstitucion, nit: String(p.nit) } });
  }
  salida.push({ json: { ruta: 'aviso_staff', ref: p.ref, motivo: 'nueva_solicitud' } });
} else if (p.evento === 'verificacion.requiere_revision') {
  if (keys !== 'evento,motivo,ref,timestamp' || !ref(p.ref) || !/^[a-z_]{3,60}$/.test(String(p.motivo)) || !fecha(p.timestamp)) throw new Error('Invalid review event');
  salida.push({ json: { ruta: 'aviso_staff', ref: p.ref, motivo: p.motivo } });
} else if (p.evento === 'verificacion.actualizada') {
  const ESTADOS = ['aprobado', 'rechazado', 'requiere_informacion'];
  if (keys !== 'email,estado,evento,timestamp' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email)) || !ESTADOS.includes(p.estado) || !fecha(p.timestamp)) throw new Error('Invalid status event');
  salida.push({ json: { ruta: 'aviso_titular', email: p.email, estado: p.estado } });
} else {
  throw new Error('Event not allowed');
}
return salida;`;

// ---------------------------------------------------------------------------
// 2. Clasifica las respuestas de datos.gov.co y firma el resultado
// ---------------------------------------------------------------------------
// Distingue: confirmado / no_coincide / datos_insuficientes (no encontrado:
// la ausencia NO es fraude) / fuente_no_disponible / respuesta_invalida / ambiguo.
const codigoClasificar = String.raw`const crypto = require('crypto');
const ENV = typeof $env !== 'undefined' && $env ? $env : process.env;
const base = $('Verificar firma y repartir').all().find(i => i.json.ruta === 'entidad').json;
const chip = $('Consultar CHIP (5c7g-ptic)').first().json;
const rues = $('Consultar RUES (c82u-588k)').first().json;
const anio = new Date().getUTCFullYear();
function filas(r) {
  if (!r || r.error) return { estado: 'caida' };
  const code = Number(r.statusCode || 0);
  if (code === 429 || code >= 500 || code === 0) return { estado: 'caida' };
  if (code !== 200 || !Array.isArray(r.body)) return { estado: 'invalida' };
  return { estado: 'ok', filas: r.body };
}
const c = filas(chip);
const r = filas(rues);
let resultado = 'datos_insuficientes';
let fuente = null;
const publico = base.tipoInstitucion !== 'corporativo';
const chipVigente = c.estado === 'ok' && c.filas.some(f => String(f.nit || '').split(':')[0] === base.nit && Number(f.a_o) >= anio - 1);
const ruesFilas = r.estado === 'ok' ? r.filas.filter(f => String(f.nit || '') === base.nit) : [];
const ruesActiva = ruesFilas.some(f => String(f.estado_matricula || '').toUpperCase() === 'ACTIVA' && Number(f.ultimo_ano_renovado) >= anio - 1);
const ruesInactiva = ruesFilas.length > 0 && ruesFilas.every(f => String(f.estado_matricula || '').toUpperCase() !== 'ACTIVA');
if (publico && chipVigente) { resultado = 'confirmado'; fuente = 'datos.gov.co/5c7g-ptic'; }
else if (ruesActiva) { resultado = 'confirmado'; fuente = 'datos.gov.co/c82u-588k'; }
else if (ruesFilas.length > 0 && !ruesActiva && !ruesInactiva) { resultado = 'ambiguo'; fuente = 'datos.gov.co/c82u-588k'; }
else if (ruesInactiva && !chipVigente) { resultado = 'no_coincide'; fuente = 'datos.gov.co/c82u-588k'; }
else if (c.estado === 'caida' && r.estado === 'caida') resultado = 'fuente_no_disponible';
else if (c.estado === 'invalida' && r.estado === 'invalida') resultado = 'respuesta_invalida';
else if (c.estado === 'caida' || r.estado === 'caida') resultado = 'fuente_no_disponible';
const payload = { ref: base.ref, componente: 'entidad', metodo: 'registro_publico', resultado, fuente, consultadoEn: new Date().toISOString(), nonce: crypto.randomBytes(24).toString('hex') };
const secret = ENV.N8N_W11_CALLBACK_SECRET || '';
if (secret.length < 32) throw new Error('Callback secret not configured');
const timestamp = String(Math.floor(Date.now() / 1000));
const cuerpo = JSON.stringify(payload);
const firma = crypto.createHmac('sha256', secret).update(timestamp + '.' + cuerpo).digest('hex');
return [{ json: { cuerpo, timestamp, firma } }];`;

const codigoAvisoStaff = String.raw`const ENV = typeof $env !== 'undefined' && $env ? $env : process.env;
const valid = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
const from = ENV.ADMIN_ALERT_FROM || '';
const to = ENV.ADMIN_ALERT_TO || '';
if (!valid(from) || !valid(to)) throw new Error('Admin email configuration is invalid');
const MOTIVOS = { nueva_solicitud: 'Hay una nueva solicitud de verificación.', no_coincidencia: 'Una comprobación no coincide.', resultado_no_concluyente: 'Una comprobación no fue concluyente.', misma_persona_en_ambas_comprobaciones: 'La segunda comprobación debe registrarla otra persona.' };
return $input.all().map(i => {
  const ref = String(i.json.ref).slice(0, 8);
  const texto = MOTIVOS[i.json.motivo] || 'Una solicitud de verificación requiere revisión.';
  return { json: { from, to, subject: 'Verificación de comprador: revisión pendiente', html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px"><h2 style="color:#0f172a">Revisión pendiente</h2><p style="color:#475569">' + texto + '</p><p style="color:#475569">Referencia: <code>' + ref + '…</code></p><p style="color:#64748b;font-size:13px">Ingresa al panel de verificaciones para revisarla. Este correo no contiene datos personales.</p></div>' } };
});`;

const codigoAvisoTitular = String.raw`const ENV = typeof $env !== 'undefined' && $env ? $env : process.env;
const from = ENV.VERIFICATION_FROM_EMAIL || ENV.MFA_FROM_EMAIL || '';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) throw new Error('Sender email configuration is invalid');
const TEXTOS = { aprobado: 'Tu verificación fue aprobada.', rechazado: 'Revisamos tu solicitud de verificación.', requiere_informacion: 'Necesitamos información adicional para tu verificación.' };
return $input.all().map(i => ({ json: { from, to: i.json.email, subject: 'Novedades sobre tu verificación', html: '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px"><h2 style="color:#0f172a">' + TEXTOS[i.json.estado] + '</h2><p style="color:#475569">Ingresa a la plataforma, sección <strong>Mi verificación</strong>, para ver el detalle.</p><p style="color:#64748b;font-size:13px">Por tu seguridad, este correo no incluye detalles de la solicitud.</p></div>' } }));`;

const consultaSoda = (nombre, recurso, id, x, query) => ({
  id, name: nombre, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [x, 160], onError: 'continueRegularOutput',
  parameters: {
    method: 'GET',
    url: `https://www.datos.gov.co/resource/${recurso}.json`,
    sendQuery: true,
    queryParameters: { parameters: query },
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'X-App-Token', value: '={{$env.DATOS_GOV_APP_TOKEN || ""}}' }] },
    options: { timeout: 10000, response: { response: { fullResponse: true, neverError: true } } }
  }
});

const workflow = {
  name: 'W11 - Verificación de comprador (orquestación)',
  active: false,
  settings: { executionOrder: 'v1', saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false, saveExecutionProgress: false },
  nodes: [
    { id: 'w11-webhook', name: 'Webhook W11 firmado', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [0, 300], webhookId: 'w11-verification-events',
      parameters: { httpMethod: 'POST', path: 'verification-events', authentication: 'none', responseMode: 'responseNode', options: { rawBody: true } } },
    { id: 'w11-verificar', name: 'Verificar firma y repartir', type: 'n8n-nodes-base.code', typeVersion: 2, position: [220, 300],
      parameters: { mode: 'runOnceForAllItems', jsCode: codigoVerificar } },
    { id: 'w11-responder', name: 'Confirmar recepción', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.1, position: [440, 300],
      parameters: { respondWith: 'json', responseBody: '={"ok":true}', options: { responseCode: 202 } } },
    { id: 'w11-switch', name: 'Según tarea', type: 'n8n-nodes-base.switch', typeVersion: 3, position: [660, 300],
      parameters: {
        rules: { values: ['entidad', 'aviso_staff', 'aviso_titular'].map(ruta => ({
          conditions: { options: { caseSensitive: true, typeValidation: 'strict' }, combinator: 'and',
            conditions: [{ leftValue: '={{$json.ruta}}', rightValue: ruta, operator: { type: 'string', operation: 'equals' } }] },
          renameOutput: true, outputKey: ruta })) },
        options: {}
      } },
    consultaSoda('Consultar CHIP (5c7g-ptic)', '5c7g-ptic', 'w11-chip', 880, [
      { name: '$select', value: 'nit,razon_social,a_o' },
      { name: '$where', value: "={{\"starts_with(nit, '\" + $json.nit + \":')\"}}" },
      { name: '$order', value: 'a_o DESC' },
      { name: '$limit', value: '5' }
    ]),
    consultaSoda('Consultar RUES (c82u-588k)', 'c82u-588k', 'w11-rues', 1100, [
      // Solo columnas de la entidad: el dataset también contiene datos personales.
      { name: '$select', value: 'razon_social,nit,estado_matricula,ultimo_ano_renovado' },
      { name: 'nit', value: "={{$('Verificar firma y repartir').all().find(i => i.json.ruta === 'entidad').json.nit}}" },
      { name: '$limit', value: '5' }
    ]),
    { id: 'w11-clasificar', name: 'Clasificar y firmar resultado', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1320, 160],
      parameters: { mode: 'runOnceForAllItems', jsCode: codigoClasificar } },
    { id: 'w11-callback', name: 'Informar al backend', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [1540, 160],
      parameters: {
        method: 'POST',
        url: '={{$env.BACKEND_BASE_URL}}/api/automatizaciones/verificaciones/resultado',
        sendHeaders: true,
        headerParameters: { parameters: [
          { name: 'x-automation-timestamp', value: '={{$json.timestamp}}' },
          { name: 'x-automation-signature', value: '={{$json.firma}}' }
        ] },
        sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: '={{$json.cuerpo}}',
        options: { timeout: 10000 }
      } },
    { id: 'w11-aviso-staff', name: 'Preparar aviso al equipo', type: 'n8n-nodes-base.code', typeVersion: 2, position: [880, 340],
      parameters: { mode: 'runOnceForAllItems', jsCode: codigoAvisoStaff } },
    { id: 'w11-aviso-titular', name: 'Preparar aviso al titular', type: 'n8n-nodes-base.code', typeVersion: 2, position: [880, 520],
      parameters: { mode: 'runOnceForAllItems', jsCode: codigoAvisoTitular } },
    { id: 'w11-correo', name: 'Enviar correo', type: 'n8n-nodes-base.emailSend', typeVersion: 2.1, position: [1100, 430],
      parameters: { fromEmail: '={{$json.from}}', toEmail: '={{$json.to}}', subject: '={{$json.subject}}', emailFormat: 'html', html: '={{$json.html}}', options: {} },
      credentials: { smtp: { id: '', name: 'SMTP para cuenta' } } },
    { id: 'w11-programado', name: 'Cada 15 minutos', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [0, 700],
      parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } } },
    { id: 'w11-mantenimiento', name: 'Mantenimiento de verificaciones', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [220, 700],
      parameters: {
        method: 'POST',
        url: '={{$env.BACKEND_BASE_URL}}/api/automatizaciones/verificaciones/mantenimiento',
        sendHeaders: true,
        headerParameters: { parameters: [{ name: 'x-automation-token', value: '={{$env.N8N_W11_MAINTENANCE_TOKEN}}' }] },
        options: { timeout: 15000 }
      } }
  ],
  connections: {
    'Webhook W11 firmado': { main: [[{ node: 'Verificar firma y repartir', type: 'main', index: 0 }]] },
    'Verificar firma y repartir': { main: [[{ node: 'Confirmar recepción', type: 'main', index: 0 }]] },
    'Confirmar recepción': { main: [[{ node: 'Según tarea', type: 'main', index: 0 }]] },
    'Según tarea': { main: [
      [{ node: 'Consultar CHIP (5c7g-ptic)', type: 'main', index: 0 }],
      [{ node: 'Preparar aviso al equipo', type: 'main', index: 0 }],
      [{ node: 'Preparar aviso al titular', type: 'main', index: 0 }]
    ] },
    'Consultar CHIP (5c7g-ptic)': { main: [[{ node: 'Consultar RUES (c82u-588k)', type: 'main', index: 0 }]] },
    'Consultar RUES (c82u-588k)': { main: [[{ node: 'Clasificar y firmar resultado', type: 'main', index: 0 }]] },
    'Clasificar y firmar resultado': { main: [[{ node: 'Informar al backend', type: 'main', index: 0 }]] },
    'Preparar aviso al equipo': { main: [[{ node: 'Enviar correo', type: 'main', index: 0 }]] },
    'Preparar aviso al titular': { main: [[{ node: 'Enviar correo', type: 'main', index: 0 }]] },
    'Cada 15 minutos': { main: [[{ node: 'Mantenimiento de verificaciones', type: 'main', index: 0 }]] }
  }
};

if (require.main === module) {
  const destino = path.join(__dirname, 'workflows', 'W11-verificacion-compra.json');
  fs.writeFileSync(destino, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(`Generado ${path.relative(process.cwd(), destino)}`);
}

module.exports = { codigoVerificar, codigoClasificar };
