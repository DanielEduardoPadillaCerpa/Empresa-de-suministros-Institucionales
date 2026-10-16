const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { pool } = require('../db');
const { descifrar } = require('../crypto');
const { requiereAutenticacion, requiereAdmin } = require('./auth');
const { requierePermiso } = require('../autorizacion');
const { registrarAuditoria } = require('../auditoria');
const { enviarCorreoEnSegundoPlano } = require('../seguridad/correo');

// Todo este módulo es del panel administrativo: los indicadores y los reportes
// que envían los clientes contienen texto libre y datos de la entidad, así que
// exigen sesión con MFA, rol admin leído de la base y el permiso
// clientes.gestionar (el mismo que da acceso a las fichas de clientes).
const soloAdmin = [requiereAutenticacion, requiereAdmin, requierePermiso('clientes.gestionar')];

const ESTADOS_REPORTE = ['nuevo', 'en_revision', 'atendido'];
const idValido = valor => /^\d{1,15}$/.test(String(valor));

function descifrarSeguro(valor) {
  try {
    return descifrar(valor) || '';
  } catch {
    return '';
  }
}

// GET /api/reportes/mensual -> indicadores de atención, pedidos y reportes.
router.get('/mensual', ...soloAdmin, async (req, res) => {
  try {
    const [
      [[{ total }]],
      [[{ escalados }]],
      [[{ promedio }]],
      [sugerencias],
      [pedidosPorEstado],
      [productosMasVendidos],
      [[reportes]]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM atenciones'),
      pool.query('SELECT COUNT(*) AS escalados FROM atenciones WHERE escalado_a_humano = TRUE'),
      pool.query('SELECT AVG(calificacion) AS promedio FROM atenciones'),
      pool.query('SELECT id, calificacion, comentario, fecha FROM atenciones WHERE calificacion <= 3 ORDER BY fecha DESC LIMIT 20'),
      pool.query('SELECT estado, COUNT(*) AS cantidad FROM pedidos GROUP BY estado'),
      pool.query(`
        SELECT p.id, p.nombre, SUM(dp.cantidad) AS total_vendidos
        FROM detalle_pedido dp
        JOIN productos p ON dp.producto_id = p.id
        GROUP BY p.id, p.nombre
        ORDER BY total_vendidos DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT COUNT(*) AS total,
               COALESCE(SUM(estado = 'nuevo'), 0) AS nuevos,
               AVG(calificacion) AS promedio
        FROM reportes_cliente
      `)
    ]);

    res.set('Cache-Control', 'no-store');
    res.json({
      clientesAtendidos: total,
      escaladosAHumano: escalados,
      calificacionPromedio: promedio ? Math.round(promedio * 10) / 10 : 0,
      sugerencias,
      pedidosPorEstado,
      productosMasVendidos,
      reportesClientes: {
        total: Number(reportes.total) || 0,
        nuevos: Number(reportes.nuevos) || 0,
        calificacionPromedio: reportes.promedio ? Math.round(reportes.promedio * 10) / 10 : 0
      }
    });
  } catch (err) {
    console.error('[reportes] Error generando el reporte mensual:', err.code || 'REPORT_FAILED');
    res.status(500).json({ error: 'Error generando el reporte' });
  }
});

// GET /api/reportes/clientes/contador -> { nuevos } para el aviso del menú.
router.get('/clientes/contador', ...soloAdmin, async (req, res) => {
  try {
    const [[fila]] = await pool.query("SELECT COUNT(*) AS nuevos FROM reportes_cliente WHERE estado = 'nuevo'");
    res.set('Cache-Control', 'no-store');
    res.json({ nuevos: Number(fila.nuevos) || 0 });
  } catch (err) {
    console.error('[reportes] Error contando reportes:', err.code || 'COUNT_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

// GET /api/reportes/clientes?estado=nuevo&clienteId=7&limite=100&antesDeId=500
// Reportes y sugerencias que enviaron los clientes, con la entidad y la
// persona que los envió. Página por id descendente (antesDeId).
router.get('/clientes', ...soloAdmin, async (req, res) => {
  const condiciones = [];
  const valores = [];
  const estado = String(req.query.estado || 'todos');
  if (ESTADOS_REPORTE.includes(estado)) {
    condiciones.push('r.estado = ?');
    valores.push(estado);
  } else if (estado !== 'todos') {
    return res.status(400).json({ error: 'Estado de reporte inválido.' });
  }
  if (req.query.clienteId !== undefined) {
    if (!idValido(req.query.clienteId)) return res.status(400).json({ error: 'Cliente inválido.' });
    condiciones.push('r.cliente_id = ?');
    valores.push(Number(req.query.clienteId));
  }
  if (req.query.antesDeId !== undefined) {
    if (!idValido(req.query.antesDeId)) return res.status(400).json({ error: 'Página inválida.' });
    condiciones.push('r.id < ?');
    valores.push(Number(req.query.antesDeId));
  }
  const limite = Math.min(Math.max(Number(req.query.limite) || 100, 1), 200);
  try {
    const [filas] = await pool.query(
      `SELECT r.id, r.cliente_id, r.comentario, r.calificacion, r.fecha, r.fecha_actualizacion,
              r.estado, r.respuesta_admin, r.atendido_en,
              c.nombre_unidad, c.nombre_funcionario, c.tipo_institucion,
              (SELECT u.correo FROM usuarios u WHERE u.cliente_id = c.id ORDER BY u.id LIMIT 1) AS correo,
              a.correo AS atendido_por_correo
       FROM reportes_cliente r
       JOIN clientes c ON c.id = r.cliente_id
       LEFT JOIN usuarios a ON a.id = r.atendido_por
       ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
       ORDER BY r.id DESC
       LIMIT ?`,
      [...valores, limite]
    );
    res.set('Cache-Control', 'no-store');
    res.json({
      reportes: filas.map(f => ({
        id: Number(f.id),
        clienteId: Number(f.cliente_id),
        comentario: f.comentario,
        calificacion: Number(f.calificacion),
        fecha: f.fecha,
        fechaActualizacion: f.fecha_actualizacion,
        estado: f.estado,
        respuestaAdmin: f.respuesta_admin,
        atendidoEn: f.atendido_en,
        atendidoPor: f.atendido_por_correo || null,
        cliente: {
          entidad: f.nombre_unidad || '',
          funcionario: descifrarSeguro(f.nombre_funcionario),
          correo: f.correo || '',
          tipoInstitucion: f.tipo_institucion || null
        }
      })),
      hayMas: filas.length === limite
    });
  } catch (err) {
    console.error('[reportes] Error listando reportes de clientes:', err.code || 'LIST_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

const esquemaGestion = z.object({
  estado: z.enum(ESTADOS_REPORTE),
  respuesta: z.string().trim().min(1).max(1000).optional()
}).strict();

// PATCH /api/reportes/clientes/:id { estado, respuesta? }
// Cambia el estado y, si hay respuesta, la guarda para que el cliente la vea
// en "Mis reportes". El aviso por correo no incluye el texto.
router.patch('/clientes/:id', ...soloAdmin, async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'Reporte inválido.' });
  const resultado = esquemaGestion.safeParse(req.body || {});
  if (!resultado.success) {
    return res.status(400).json({ error: 'Indica un estado válido y, si respondes, un texto de hasta 1000 caracteres.' });
  }
  const { estado, respuesta } = resultado.data;
  try {
    const [actualizacion] = await pool.query(
      `UPDATE reportes_cliente
       SET estado = ?, respuesta_admin = COALESCE(?, respuesta_admin), atendido_por = ?, atendido_en = NOW()
       WHERE id = ?`,
      [estado, respuesta ?? null, req.usuario.uid, Number(req.params.id)]
    );
    if (actualizacion.affectedRows !== 1) return res.status(404).json({ error: 'Reporte no encontrado.' });

    res.json({ ok: true, id: Number(req.params.id), estado });
    registrarAuditoria({
      usuario: req.usuario,
      accion: 'gestionar_reporte_cliente',
      entidad: 'reporte_cliente',
      entidadId: req.params.id,
      detalle: { estado, respondido: Boolean(respuesta) }
    });
    if (respuesta) {
      const [destino] = await pool.query(
        `SELECT u.correo FROM reportes_cliente r
         JOIN usuarios u ON u.cliente_id = r.cliente_id
         WHERE r.id = ? ORDER BY u.id LIMIT 1`,
        [Number(req.params.id)]
      );
      if (destino[0]?.correo) {
        enviarCorreoEnSegundoPlano({
          to: destino[0].correo,
          subject: 'Tu reporte recibió una respuesta',
          text: `Tu reporte #${req.params.id} recibió una respuesta del equipo de Suministros Institucionales.\n\nInicia sesión y abre "Mis reportes" para leerla.`
        });
      }
    }
  } catch (err) {
    console.error('[reportes] Error gestionando el reporte:', err.code || 'UPDATE_FAILED');
    if (!res.headersSent) res.status(503).json({ error: 'No fue posible guardar el cambio.' });
  }
});

module.exports = router;
