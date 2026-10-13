const express = require('express');
const { pool } = require('../db');
const { requiereTokenAutomatizacion } = require('../automationAuth');
const { expirarPedidosPendientes } = require('../paymentJobs');
const { rateLimit } = require('express-rate-limit');
const { aplicarResultadoN8n, procesarMantenimiento } = require('../verificacionCompra');

const router = express.Router();

router.get(
  '/resumen-diario',
  requiereTokenAutomatizacion('N8N_W2_DAILY_SUMMARY_TOKEN'),
  async (req, res) => {
    try {
      const [filas] = await pool.query(
        `SELECT COALESCE(SUM(monto_centavos), 0) AS total
         FROM pagos
         WHERE estado = 'aprobado' AND actualizado_en >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
      );
      res.set('Cache-Control', 'no-store');
      res.json({
        evento: 'resumen_diario',
        total: String(filas[0].total),
        moneda: 'COP',
        fecha: new Date().toISOString()
      });
    } catch (err) {
      console.error('[automatizaciones] No se pudo generar el resumen diario:', err.code || 'DAILY_SUMMARY_ERROR');
      res.status(500).json({ error: 'No fue posible generar el resumen diario.' });
    }
  }
);

router.post(
  '/pedidos/expirar',
  requiereTokenAutomatizacion('N8N_W4_EXPIRY_TOKEN'),
  async (req, res) => {
    try {
      await expirarPedidosPendientes();
      res.json({ ok: true });
    } catch (err) {
      console.error('[automatizaciones] No se pudieron expirar pedidos:', err.code || 'ORDER_EXPIRATION_ERROR');
      res.status(500).json({ error: 'No fue posible procesar la expiración de pedidos.' });
    }
  }
);

// W11: n8n informa el resultado de la consulta de la entidad en datos.gov.co.
// Canal autenticado con HMAC propio (N8N_W11_CALLBACK_SECRET), ventana de
// 5 minutos, nonce de un solo uso y esquema estricto. Solo puede escribir el
// componente 'entidad'; la aprobación siempre la decide una persona.
const limitarResultados = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'Demasiadas solicitudes.' })
});

router.post('/verificaciones/resultado', limitarResultados, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const salida = await aplicarResultadoN8n(connection, { payload: req.body, headers: req.headers });
    if (salida.status === 200 || salida.status === 409) await connection.commit();
    else await connection.rollback();
    if (salida.status !== 200) return res.status(salida.status).json({ error: salida.error });
    res.json(salida.cuerpo);
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[automatizaciones] No se pudo aplicar el resultado de verificación:', err.code || 'VERIFICATION_RESULT_ERROR');
    res.status(500).json({ error: 'No fue posible registrar el resultado.' });
  } finally {
    if (connection) connection.release();
  }
});

// W11 programado: reintentos de consultas de entidad, expiración de
// solicitudes y de autorizaciones de compra. Idempotente.
router.post(
  '/verificaciones/mantenimiento',
  requiereTokenAutomatizacion('N8N_W11_MAINTENANCE_TOKEN'),
  async (req, res) => {
    try {
      res.json({ ok: true, ...(await procesarMantenimiento(pool)) });
    } catch (err) {
      console.error('[automatizaciones] No se pudo ejecutar el mantenimiento de verificaciones:', err.code || 'VERIFICATION_MAINTENANCE_ERROR');
      res.status(500).json({ error: 'No fue posible ejecutar el mantenimiento.' });
    }
  }
);

module.exports = router;
