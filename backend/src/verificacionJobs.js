const { pool } = require('./db');
const { procesarMantenimiento } = require('./verificacionCompra');

// Respaldo local del mantenimiento que dispara n8n (W11 programado): si n8n
// no está activo, las solicitudes y autorizaciones igual expiran y las
// consultas de entidad se reintentan. Ambos caminos son idempotentes.
const INTERVALO_MS = 5 * 60 * 1000;
let timer;

function iniciarJobVerificaciones() {
  if (timer || process.env.NODE_ENV === 'test') return;
  timer = setInterval(async () => {
    try {
      await procesarMantenimiento(pool);
    } catch (err) {
      console.error('[verificacion-jobs] Falló el mantenimiento:', err.code || 'VERIFICATION_JOB_FAILED');
    }
  }, INTERVALO_MS);
  timer.unref();
}

module.exports = { iniciarJobVerificaciones };
