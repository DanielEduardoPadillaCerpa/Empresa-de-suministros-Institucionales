const TIMEOUT_MS = 15000;

function errorConfiguracion(codigo) {
  const error = new Error(codigo);
  error.code = codigo;
  return error;
}

function esLocalhost(hostname) {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
}

function obtenerConfiguracionWebhook() {
  const urlConfigurada = process.env.N8N_RECEIPT_WEBHOOK_URL || process.env.N8N_MFA_WEBHOOK_URL;
  const secreto = process.env.N8N_RECEIPT_WEBHOOK_SECRET || process.env.N8N_MFA_WEBHOOK_SECRET;
  if (!urlConfigurada || !secreto || secreto.length < 32) {
    throw errorConfiguracion('N8N_RECEIPT_CONFIGURATION_REQUIRED');
  }

  let url;
  try {
    url = new URL(urlConfigurada);
  } catch {
    throw errorConfiguracion('N8N_RECEIPT_WEBHOOK_URL_INVALID');
  }
  if (!process.env.N8N_RECEIPT_WEBHOOK_URL) {
    if (!url.pathname.endsWith('/mfa-login-code')) {
      throw errorConfiguracion('N8N_RECEIPT_WEBHOOK_URL_INVALID');
    }
    url.pathname = `${url.pathname.slice(0, -'mfa-login-code'.length)}receipt-email`;
  }

  const localhost = esLocalhost(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(localhost && url.protocol === 'http:'))) {
    throw errorConfiguracion('N8N_RECEIPT_WEBHOOK_HTTPS_REQUIRED');
  }
  return { url: url.toString(), secreto };
}

async function enviarMensaje({ to, subject, text, html }) {
  const configuracion = obtenerConfiguracionWebhook();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(configuracion.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${configuracion.secreto}`
      },
      body: JSON.stringify({
        event: 'receipt.email',
        to,
        subject,
        text,
        html
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      let remoteCode;
      try {
        const result = await response.json();
        if (typeof result?.code === 'string' && /^[A-Z0-9_]{1,40}$/.test(result.code)) {
          remoteCode = result.code;
        }
      } catch {
        remoteCode = null;
      }
      throw errorConfiguracion(remoteCode
        ? `N8N_RECEIPT_SMTP_${remoteCode}`
        : `N8N_RECEIPT_HTTP_${response.status}`);
    }
    let resultado;
    try {
      resultado = await response.json();
    } catch {
      throw errorConfiguracion('N8N_RECEIPT_RESPONSE_INVALID');
    }
    if (resultado?.ok !== true) {
      throw errorConfiguracion('N8N_RECEIPT_RESPONSE_INVALID');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw errorConfiguracion('N8N_RECEIPT_DELIVERY_TIMEOUT');
    }
    if (err.code) throw err;
    throw errorConfiguracion('N8N_RECEIPT_DELIVERY_FAILED');
  } finally {
    clearTimeout(timeout);
  }
}

function obtenerBaseUrlComprobante() {
  const baseUrl = process.env.RECEIPT_LINK_BASE_URL;
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw errorConfiguracion('RECEIPT_LINK_BASE_URL_INVALID');
  }
  const localhost = esLocalhost(url.hostname);
  if ((url.protocol !== 'https:' && !(localhost && url.protocol === 'http:')) ||
      url.username || url.password) {
    throw errorConfiguracion('RECEIPT_LINK_BASE_URL_INVALID');
  }
  return url.toString().replace(/\/+$/, '');
}

async function enviarEnlaceComprobanteCliente({ correo, pedidoId, numero, token }) {
  const enlace = `${obtenerBaseUrlComprobante()}/api/comprobantes/${encodeURIComponent(pedidoId)}?token=${encodeURIComponent(token)}`;
  const enlaceHtml = enlace.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  await enviarMensaje({
    to: correo,
    subject: `Comprobante de compra ${numero}`,
    text: `Tu comprobante está disponible en este enlace seguro, válido por 24 horas:\n${enlace}\n\nEste documento es un comprobante de compra y no una factura electrónica DIAN.`,
    html: `<p>Tu comprobante de compra <strong>${numero}</strong> está disponible en este <a href="${enlaceHtml}">enlace seguro</a>, válido por 24 horas.</p><p>Este documento es un comprobante de compra y no una factura electrónica DIAN.</p>`
  });
}

async function enviarAvisoComprobanteAdmin({ pedidoId, numero, totalCentavos, moneda, fecha }) {
  const destinatario = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!destinatario) {
    throw errorConfiguracion('ADMIN_NOTIFICATION_EMAIL_NOT_CONFIGURED');
  }
  const monto = BigInt(totalCentavos);
  const total = `${(monto / 100n).toString()}.${String(monto % 100n).padStart(2, '0')}`;
  await enviarMensaje({
    to: destinatario,
    subject: `Pago aprobado · Pedido #${pedidoId}`,
    text: [
      `Pedido: #${pedidoId}`,
      `Comprobante: ${numero}`,
      'Estado: aprobado',
      `Total: ${total} ${moneda}`,
      `Fecha: ${fecha}`
    ].join('\n'),
    html: `<p>Pago aprobado</p><ul><li>Pedido: #${Number(pedidoId)}</li><li>Comprobante: ${numero}</li><li>Total: ${total} ${moneda}</li><li>Fecha: ${fecha}</li></ul>`
  });
}

module.exports = {
  enviarEnlaceComprobanteCliente,
  enviarAvisoComprobanteAdmin,
  obtenerConfiguracionWebhook
};
