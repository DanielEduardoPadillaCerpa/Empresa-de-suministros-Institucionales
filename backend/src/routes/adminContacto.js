const express = require('express');
const { z } = require('zod');
const { pool } = require('../db');
const { descifrar } = require('../crypto');
const { requiereAutenticacion, requiereAdmin } = require('./auth');
const { requierePermiso } = require('../autorizacion');
const { registrarAuditoria } = require('../auditoria');
const { enviarCorreoEnSegundoPlano } = require('../seguridad/correo');

// Panel de solicitudes de contacto institucional (PQRS, soporte y cotización)
// que llegan desde contacto.html. El NIT y el correo del remitente están
// cifrados en la base y solo se descifran aquí, con sesión de administrador y
// el permiso clientes.gestionar.
const router = express.Router();
router.use(requiereAutenticacion, requiereAdmin, requierePermiso('clientes.gestionar'));

const ESTADOS = ['recibida', 'en_gestion', 'cerrada'];
const TIPOS = ['pqrs', 'soporte', 'cotizacion'];
const idValido = valor => /^\d{1,15}$/.test(String(valor));

function descifrarSeguro(valor) {
  try {
    return descifrar(valor) || '';
  } catch {
    return '';
  }
}

// GET /api/admin/contacto/contador -> { recibidas }
router.get('/contador', async (req, res) => {
  try {
    const [[fila]] = await pool.query("SELECT COUNT(*) AS recibidas FROM solicitudes_contacto WHERE estado = 'recibida'");
    res.set('Cache-Control', 'no-store');
    res.json({ recibidas: Number(fila.recibidas) || 0 });
  } catch (err) {
    console.error('[contacto] Error contando:', err.code || 'COUNT_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

// GET /api/admin/contacto?estado=recibida&tipo=pqrs&limite=100&antesDeId=900
router.get('/', async (req, res) => {
  const condiciones = [];
  const valores = [];
  const estado = String(req.query.estado || 'todas');
  if (ESTADOS.includes(estado)) {
    condiciones.push('s.estado = ?');
    valores.push(estado);
  } else if (estado !== 'todas') {
    return res.status(400).json({ error: 'Estado inválido.' });
  }
  if (req.query.tipo !== undefined && req.query.tipo !== '') {
    if (!TIPOS.includes(String(req.query.tipo))) return res.status(400).json({ error: 'Tipo inválido.' });
    condiciones.push('s.tipo_solicitud = ?');
    valores.push(String(req.query.tipo));
  }
  if (req.query.antesDeId !== undefined) {
    if (!idValido(req.query.antesDeId)) return res.status(400).json({ error: 'Página inválida.' });
    condiciones.push('s.id < ?');
    valores.push(Number(req.query.antesDeId));
  }
  const limite = Math.min(Math.max(Number(req.query.limite) || 100, 1), 200);
  try {
    const [filas] = await pool.query(
      `SELECT s.id, s.tipo_solicitud, s.tipo_entidad, s.entidad, s.nit_cifrado, s.correo_cifrado,
              s.criticidad, s.mensaje, s.estado, s.fecha_creacion, s.respuesta_admin, s.actualizado_en,
              a.correo AS gestionada_por_correo
       FROM solicitudes_contacto s
       LEFT JOIN usuarios a ON a.id = s.gestionada_por
       ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
       ORDER BY s.id DESC
       LIMIT ?`,
      [...valores, limite]
    );
    res.set('Cache-Control', 'no-store');
    res.json({
      solicitudes: filas.map(f => ({
        id: Number(f.id),
        radicado: `SI-${String(f.id).padStart(8, '0')}`,
        tipoSolicitud: f.tipo_solicitud,
        tipoEntidad: f.tipo_entidad,
        entidad: f.entidad,
        nit: descifrarSeguro(f.nit_cifrado),
        correo: descifrarSeguro(f.correo_cifrado),
        criticidad: f.criticidad,
        mensaje: f.mensaje,
        estado: f.estado,
        creadaEn: f.fecha_creacion,
        respuestaAdmin: f.respuesta_admin,
        actualizadaEn: f.actualizado_en,
        gestionadaPor: f.gestionada_por_correo || null
      })),
      hayMas: filas.length === limite
    });
    registrarAuditoria({ usuario: req.usuario, accion: 'ver_solicitudes_contacto', entidad: 'solicitud_contacto', detalle: { estado, cantidad: filas.length } });
  } catch (err) {
    console.error('[contacto] Error listando:', err.code || 'LIST_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

const esquemaGestion = z.object({
  estado: z.enum(ESTADOS),
  respuesta: z.string().trim().min(1).max(1000).optional(),
  notificar: z.boolean().optional()
}).strict();

// PATCH /api/admin/contacto/:id { estado, respuesta?, notificar? }
// Con notificar: true la respuesta se envía al correo del remitente.
router.patch('/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'Solicitud inválida.' });
  const resultado = esquemaGestion.safeParse(req.body || {});
  if (!resultado.success) {
    return res.status(400).json({ error: 'Indica un estado válido y, si respondes, un texto de hasta 1000 caracteres.' });
  }
  const { estado, respuesta, notificar } = resultado.data;
  if (notificar && !respuesta) {
    return res.status(400).json({ error: 'Escribe la respuesta que se enviará al remitente.' });
  }
  const id = Number(req.params.id);
  try {
    const [actualizacion] = await pool.query(
      `UPDATE solicitudes_contacto
       SET estado = ?, respuesta_admin = COALESCE(?, respuesta_admin), gestionada_por = ?, actualizado_en = NOW()
       WHERE id = ?`,
      [estado, respuesta ?? null, req.usuario.uid, id]
    );
    if (actualizacion.affectedRows !== 1) return res.status(404).json({ error: 'Solicitud no encontrada.' });

    let notificada = false;
    if (notificar) {
      const [filas] = await pool.query('SELECT correo_cifrado FROM solicitudes_contacto WHERE id = ?', [id]);
      const correo = descifrarSeguro(filas[0]?.correo_cifrado);
      if (correo) {
        const radicado = `SI-${String(id).padStart(8, '0')}`;
        enviarCorreoEnSegundoPlano({
          to: correo,
          subject: `Respuesta a tu solicitud ${radicado}`,
          text: `Respuesta de Suministros Institucionales a la solicitud ${radicado}:\n\n${respuesta}`
        });
        notificada = true;
      }
    }
    res.json({ ok: true, id, estado, notificada });
    // La respuesta no va a la auditoría: puede contener datos personales.
    registrarAuditoria({
      usuario: req.usuario,
      accion: 'gestionar_solicitud_contacto',
      entidad: 'solicitud_contacto',
      entidadId: id,
      detalle: { estado, respondida: Boolean(respuesta), notificada }
    });
  } catch (err) {
    console.error('[contacto] Error gestionando:', err.code || 'UPDATE_FAILED');
    if (!res.headersSent) res.status(503).json({ error: 'No fue posible guardar el cambio.' });
  }
});

module.exports = router;
