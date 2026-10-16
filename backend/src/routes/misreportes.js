const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const { pool } = require('../db');
const { requiereAutenticacion } = require('./auth');
const { avisarAdministrador } = require('../avisosAdmin');

// Todas las rutas de este módulo exigen sesión de cliente y solo permiten
// ver/editar/eliminar los reportes del PROPIO cliente (nunca de otro).
// El administrador los gestiona desde /api/reportes/clientes; una vez que
// los toma (en revisión o atendido) el cliente ya no puede editarlos ni
// borrarlos, para que la respuesta corresponda a lo que escribió.

const COMENTARIO_MAXIMO = 2000;

const limitarNuevos = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMITS !== '1',
  handler: (req, res) => res.status(429).json({ error: 'Enviaste muchos reportes en poco tiempo. Inténtalo más tarde.' })
});

function validarCuerpo(body) {
  const comentario = typeof body?.comentario === 'string' ? body.comentario.trim() : '';
  if (!comentario) return { error: 'El comentario es obligatorio' };
  if (comentario.length > COMENTARIO_MAXIMO) return { error: `El comentario no puede superar ${COMENTARIO_MAXIMO} caracteres.` };
  const calif = Number(body?.calificacion);
  if (!Number.isInteger(calif) || calif < 1 || calif > 5) return { error: 'La calificación debe estar entre 1 y 5' };
  return { comentario, calif };
}

// Reporte propio y todavía editable. Devuelve null si ya respondió el error.
async function reportePropioEditable(req, res, accion) {
  const [filas] = await pool.query('SELECT cliente_id, estado FROM reportes_cliente WHERE id = ?', [req.params.id]);
  if (!filas.length) {
    res.status(404).json({ error: 'Reporte no encontrado' });
    return null;
  }
  if (filas[0].cliente_id !== req.usuario.clienteId) {
    res.status(403).json({ error: `No puedes ${accion} un reporte que no es tuyo` });
    return null;
  }
  if (filas[0].estado && filas[0].estado !== 'nuevo') {
    res.status(409).json({ code: 'REPORTE_EN_GESTION', error: `El equipo ya está atendiendo este reporte; no se puede ${accion}. Si necesitas agregar algo, envía un reporte nuevo.` });
    return null;
  }
  return filas[0];
}

// GET /api/mis-reportes -> lista los reportes del cliente autenticado
router.get('/', requiereAutenticacion, async (req, res) => {
  try {
    const clienteId = req.usuario.clienteId;
    if (!clienteId) return res.json([]);

    const [filas] = await pool.query(
      `SELECT id, comentario, calificacion, fecha, fecha_actualizacion, estado, respuesta_admin, atendido_en
       FROM reportes_cliente WHERE cliente_id = ? ORDER BY fecha DESC`,
      [clienteId]
    );
    res.set('Cache-Control', 'no-store');
    res.json(filas);
  } catch (err) {
    console.error('[mis-reportes] Error consultando:', err.code || 'LIST_FAILED');
    res.status(500).json({ error: 'Error consultando tus reportes' });
  }
});

// POST /api/mis-reportes -> crear un reporte/sugerencia nuevo
router.post('/', requiereAutenticacion, limitarNuevos, async (req, res) => {
  try {
    const clienteId = req.usuario.clienteId;
    if (!clienteId) {
      return res.status(400).json({ error: 'Tu cuenta todavía no está vinculada a un cliente registrado.' });
    }
    const datos = validarCuerpo(req.body);
    if (datos.error) return res.status(400).json({ error: datos.error });

    const [resultado] = await pool.query(
      'INSERT INTO reportes_cliente (cliente_id, comentario, calificacion) VALUES (?, ?, ?)',
      [clienteId, datos.comentario, datos.calif]
    );

    res.status(201).json({ id: resultado.insertId });
    avisarAdministrador({
      asunto: `Nuevo reporte de cliente #${resultado.insertId}`,
      texto: `Un cliente envió el reporte #${resultado.insertId} (calificación ${datos.calif}/5).\n\nRevísalo en el panel administrativo: Reportes de clientes.`
    });
  } catch (err) {
    console.error('[mis-reportes] Error creando:', err.code || 'CREATE_FAILED');
    res.status(500).json({ error: 'Error creando el reporte' });
  }
});

// PUT /api/mis-reportes/:id -> editar un reporte propio que aún no se gestiona
router.put('/:id', requiereAutenticacion, async (req, res) => {
  try {
    if (!await reportePropioEditable(req, res, 'editar')) return;
    const datos = validarCuerpo(req.body);
    if (datos.error) return res.status(400).json({ error: datos.error });

    await pool.query(
      "UPDATE reportes_cliente SET comentario = ?, calificacion = ? WHERE id = ? AND estado = 'nuevo'",
      [datos.comentario, datos.calif, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[mis-reportes] Error actualizando:', err.code || 'UPDATE_FAILED');
    res.status(500).json({ error: 'Error actualizando el reporte' });
  }
});

// DELETE /api/mis-reportes/:id -> eliminar un reporte propio que aún no se gestiona
router.delete('/:id', requiereAutenticacion, async (req, res) => {
  try {
    if (!await reportePropioEditable(req, res, 'eliminar')) return;
    await pool.query("DELETE FROM reportes_cliente WHERE id = ? AND estado = 'nuevo'", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[mis-reportes] Error eliminando:', err.code || 'DELETE_FAILED');
    res.status(500).json({ error: 'Error eliminando el reporte' });
  }
});

module.exports = router;
