const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requiereAutenticacion, requiereAdmin } = require('./auth');
const { requierePermiso } = require('../autorizacion');

const soloAuditor = [requiereAutenticacion, requiereAdmin, requierePermiso('auditoria.ver')];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const IDENTIFICADOR = /^[a-z0-9_.-]{1,50}$/i;

// GET /api/auditoria -> historial de acciones administrativas (auditoria.ver).
// Filtros opcionales: entidad, accion, correo (prefijo), desde y hasta
// (AAAA-MM-DD, inclusivos), limite (máx. 500) y antesDeId para paginar.
// Responde un arreglo, como antes, para no romper a quien ya lo consume.
router.get('/', ...soloAuditor, async (req, res) => {
  const condiciones = [];
  const valores = [];
  const { entidad, accion, correo, desde, hasta, antesDeId } = req.query;

  for (const [columna, valor] of [['entidad', entidad], ['accion', accion]]) {
    if (valor === undefined || valor === '') continue;
    if (!IDENTIFICADOR.test(String(valor))) return res.status(400).json({ error: `Filtro de ${columna} inválido.` });
    condiciones.push(`${columna} = ?`);
    valores.push(String(valor));
  }
  if (correo) {
    const texto = String(correo).trim().toLowerCase();
    if (texto.length > 255) return res.status(400).json({ error: 'Filtro de correo inválido.' });
    // Los comodines escritos por el usuario se buscan como texto literal.
    condiciones.push("correo LIKE ? ESCAPE '\\\\'");
    valores.push(`${texto.replace(/[\\%_]/g, '\\$&')}%`);
  }
  if (desde) {
    if (!FECHA.test(String(desde))) return res.status(400).json({ error: 'La fecha "desde" debe tener el formato AAAA-MM-DD.' });
    condiciones.push('fecha >= ?');
    valores.push(`${desde} 00:00:00`);
  }
  if (hasta) {
    if (!FECHA.test(String(hasta))) return res.status(400).json({ error: 'La fecha "hasta" debe tener el formato AAAA-MM-DD.' });
    condiciones.push('fecha < DATE_ADD(?, INTERVAL 1 DAY)');
    valores.push(`${hasta} 00:00:00`);
  }
  if (antesDeId !== undefined) {
    if (!/^\d{1,15}$/.test(String(antesDeId))) return res.status(400).json({ error: 'Página inválida.' });
    condiciones.push('id < ?');
    valores.push(Number(antesDeId));
  }
  const limite = Math.min(Math.max(Number(req.query.limite) || 100, 1), 500);

  try {
    const [filas] = await pool.query(
      `SELECT id, usuario_id, correo, accion, entidad, entidad_id, detalle, fecha
       FROM auditoria
       ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
       ORDER BY id DESC
       LIMIT ?`,
      [...valores, limite]
    );
    res.set('Cache-Control', 'no-store');
    res.json(filas);
  } catch (err) {
    console.error('[auditoria] Error consultando:', err.code || 'AUDIT_LIST_FAILED');
    res.status(500).json({ error: 'Error consultando la auditoría' });
  }
});

// GET /api/auditoria/filtros -> entidades y acciones registradas, para los
// selectores del panel.
router.get('/filtros', ...soloAuditor, async (req, res) => {
  try {
    const [[entidades], [acciones]] = await Promise.all([
      pool.query('SELECT DISTINCT entidad FROM auditoria ORDER BY entidad LIMIT 200'),
      pool.query('SELECT DISTINCT accion FROM auditoria ORDER BY accion LIMIT 200')
    ]);
    res.set('Cache-Control', 'no-store');
    res.json({ entidades: entidades.map(f => f.entidad), acciones: acciones.map(f => f.accion) });
  } catch (err) {
    console.error('[auditoria] Error consultando filtros:', err.code || 'AUDIT_FILTERS_FAILED');
    res.status(500).json({ error: 'Error consultando la auditoría' });
  }
});

module.exports = router;
