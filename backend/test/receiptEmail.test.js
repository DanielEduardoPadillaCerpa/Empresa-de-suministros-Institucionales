const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { enviarEnlaceComprobanteCliente, obtenerConfiguracionWebhook } = require('../src/email');

const variables = [
  'N8N_RECEIPT_WEBHOOK_URL',
  'N8N_RECEIPT_WEBHOOK_SECRET',
  'N8N_MFA_WEBHOOK_URL',
  'N8N_MFA_WEBHOOK_SECRET',
  'RECEIPT_LINK_BASE_URL'
];

function guardarEntorno(t) {
  const anteriores = Object.fromEntries(variables.map(nombre => [nombre, process.env[nombre]]));
  t.after(() => {
    for (const [nombre, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[nombre];
      else process.env[nombre] = valor;
    }
  });
}

test('receipt webhook derives its production path from the MFA endpoint', t => {
  guardarEntorno(t);
  delete process.env.N8N_RECEIPT_WEBHOOK_URL;
  delete process.env.N8N_RECEIPT_WEBHOOK_SECRET;
  process.env.N8N_MFA_WEBHOOK_URL = 'http://localhost:5678/webhook/mfa-login-code';
  process.env.N8N_MFA_WEBHOOK_SECRET = 'test-only-secret-which-is-longer-than-32-chars';

  assert.deepEqual(obtenerConfiguracionWebhook(), {
    url: 'http://localhost:5678/webhook/receipt-email',
    secreto: process.env.N8N_MFA_WEBHOOK_SECRET
  });
});

test('receipt courier posts the secure PDF link to n8n without exposing it in errors', async t => {
  guardarEntorno(t);
  process.env.N8N_RECEIPT_WEBHOOK_URL = 'http://localhost:5678/webhook/receipt-email';
  process.env.N8N_RECEIPT_WEBHOOK_SECRET = 'test-only-secret-which-is-longer-than-32-chars';
  process.env.RECEIPT_LINK_BASE_URL = 'http://localhost:8081';
  const fetchAnterior = global.fetch;
  let solicitud;
  global.fetch = async (url, options) => {
    solicitud = { url, options };
    return { ok: true, async json() { return { ok: true }; } };
  };
  t.after(() => { global.fetch = fetchAnterior; });

  await enviarEnlaceComprobanteCliente({
    correo: 'cliente@example.test',
    pedidoId: 42,
    numero: 'CP-0000000042',
    token: 'signed-token'
  });

  assert.equal(solicitud.url, process.env.N8N_RECEIPT_WEBHOOK_URL);
  assert.equal(solicitud.options.headers.Authorization, `Bearer ${process.env.N8N_RECEIPT_WEBHOOK_SECRET}`);
  const payload = JSON.parse(solicitud.options.body);
  assert.equal(payload.event, 'receipt.email');
  assert.equal(payload.to, 'cliente@example.test');
  assert.match(payload.html, /http:\/\/localhost:8081\/api\/comprobantes\/42\?token=signed-token/);
});

test('receipt courier reports only a sanitized SMTP error code from n8n', async t => {
  guardarEntorno(t);
  process.env.N8N_RECEIPT_WEBHOOK_URL = 'http://localhost:5678/webhook/receipt-email';
  process.env.N8N_RECEIPT_WEBHOOK_SECRET = 'test-only-secret-which-is-longer-than-32-chars';
  process.env.RECEIPT_LINK_BASE_URL = 'http://localhost:8081';
  const fetchAnterior = global.fetch;
  global.fetch = async () => ({ ok: false, status: 502, async json() { return { ok: false, code: 'EAUTH' }; } });
  t.after(() => { global.fetch = fetchAnterior; });

  await assert.rejects(
    enviarEnlaceComprobanteCliente({
      correo: 'cliente@example.test',
      pedidoId: 42,
      numero: 'CP-0000000042',
      token: 'signed-token'
    }),
    error => error.code === 'N8N_RECEIPT_SMTP_EAUTH'
  );
});

test('receipt workflow validates payload, uses no saved executions, and sends through SMTP', () => {
  const workflowPath = path.join(__dirname, '..', '..', 'n8n', 'workflows', 'W9-comprobantes-email.json');
  const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  assert.equal(workflow.settings.saveDataSuccessExecution, 'none');
  assert.equal(workflow.settings.saveDataErrorExecution, 'none');
  assert.equal(workflow.settings.saveManualExecutions, false);

  const source = workflow.nodes.find(node => node.name === 'Validar correo de comprobante').parameters.jsCode;
  const validar = new Function('$input', source);
  const body = {
    event: 'receipt.email',
    to: 'cliente@example.test',
    subject: 'Comprobante CP-0000000042',
    text: 'Enlace seguro',
    html: '<p>Descarga tu comprobante</p>'
  };
  assert.deepEqual(validar({ first: () => ({ json: { body } }) })[0].json, {
    to: body.to,
    subject: body.subject,
    text: body.text,
    html: body.html
  });
  assert.throws(() => validar({
    first: () => ({ json: { body: { ...body, token_mfa: '123456' } } })
  }), /Campos de comprobante no permitidos/);

  const smtp = workflow.nodes.find(node => node.name === 'Enviar comprobante por SMTP');
  assert.equal(smtp.parameters.toEmail, '={{$json.to}}');
  assert.equal(smtp.parameters.subject, '={{$json.subject}}');
  assert.equal(smtp.parameters.emailFormat, 'html');
  assert.equal(smtp.parameters.html, '={{$json.html}}');
});
