const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { secretoJwt } = require('../configSegura');
const { descifrarCampo } = require('../seguridad/cifradoCampos');
const { verificarEnPadron } = require('../seguridad/padron');
const { registrarAuditoria } = require('../auditoria');
const { enviarCorreoEnSegundoPlano, escaparHtml } = require('../seguridad/correo');
const { avisarN8n } = require('../seguridad/avisosN8n');

const router = express.Router();
const PERMISO = 'clientes.gestionar';

// Autenticación y autorización del panel en UNA consulta: sesión vigente
// (session_version), cuenta activa, rol admin leído de la base, sesión con MFA
// y permiso de gestión de clientes (o superadministrador). Así aprobar o
// rechazar cuesta dos viajes a MySQL: este y el UPDATE.
async function requiereAdminSolicitudes(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  let datos;
  try {
    datos = jwt.verify(token, secretoJwt(), { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
  const uid = Number(datos.uid);
  if (datos.mfa !== true || !Number.isSafeInteger(uid) || uid < 1) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
  try {
    const [filas] = await pool.query(
      `SELECT u.session_version, u.debe_cambiar_password, u.estado_cuenta, u.rol, u.es_superadmin, u.correo,
              EXISTS (SELECT 1 FROM staff_permisos p WHERE p.usuario_id = u.id AND p.permiso = ?) AS tiene_permiso
       FROM usuarios u WHERE u.id = ?`,
      [PERMISO, uid]
    );
    const fila = filas[0];
    if (!fila || Number(fila.session_version || 0) !== Number(datos.sv || 0)) {
      return res.status(401).json({ error: 'La sesión fue revocada. Inicia sesión nuevamente.' });
    }
    if (fila.estado_cuenta !== 'activa' || fila.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido: solo administradores.' });
    }
    if (fila.debe_cambiar_password) {
      return res.status(403).json({ code: 'PASSWORD_CHANGE_REQUIRED', error: 'Debes cambiar tu contraseña inicial antes de continuar.' });
    }
    if (!fila.es_superadmin && !Number(fila.tiene_permiso)) {
      return res.status(403).json({ error: 'Tu rol administrativo no tiene permiso para esta acción.', permisoRequerido: PERMISO });
    }
    req.usuario = { uid, correo: fila.correo, rol: 'admin' };
    return next();
  } catch (err) {
    console.error('[solicitudes] No se pudo validar la sesión:', err.code || 'SESSION_CHECK_FAILED');
    return res.status(503).json({ error: 'No fue posible validar la sesión temporalmente.' });
  }
}

router.use(requiereAdminSolicitudes);

const ESTADOS = new Set(['pendiente', 'aprobada', 'rechazada']);
const idValido = valor => /^\d{1,15}$/.test(String(valor));

// GET /api/admin/solicitudes/contador -> { pendientes }. COUNT sobre el índice
// (estado, creado_en, id); el panel lo consulta cada pocos segundos.
router.get('/contador', async (req, res) => {
  try {
    const [[fila]] = await pool.query("SELECT COUNT(*) AS pendientes FROM solicitudes_registro WHERE estado = 'pendiente'");
    res.set('Cache-Control', 'no-store');
    res.json({ pendientes: Number(fila.pendientes) });
  } catch (err) {
    console.error('[solicitudes] Error contando:', err.code || 'COUNT_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

// GET /api/admin/solicitudes?estado=pendiente -> lista SIN NIT ni nombre:
// correo, institución, estado, bandera de verificación y fecha. No descifra nada.
router.get('/', async (req, res) => {
  const estado = ESTADOS.has(req.query.estado) ? req.query.estado : 'pendiente';
  const limite = Math.min(Math.max(Number(req.query.limite) || 100, 1), 200);
  try {
    const [filas] = await pool.query(
      `SELECT s.id, u.correo, s.tipo_institucion, s.estado, s.resultado_verificacion, s.creado_en, s.decidida_en
       FROM solicitudes_registro s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.estado = ?
       ORDER BY s.creado_en DESC, s.id DESC
       LIMIT ?`,
      [estado, limite]
    );
    res.set('Cache-Control', 'no-store');
    res.json({
      solicitudes: filas.map(f => ({
        id: Number(f.id),
        correo: f.correo,
        tipoInstitucion: f.tipo_institucion,
        estado: f.estado,
        resultado: f.resultado_verificacion,
        creadoEn: f.creado_en,
        decididaEn: f.decidida_en
      }))
    });
  } catch (err) {
    console.error('[solicitudes] Error listando:', err.code || 'LIST_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

// GET /api/admin/solicitudes/:id -> detalle descifrado en el servidor, con el
// nombre del padrón al lado y la verificación repetida en este momento.
router.get('/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'Solicitud inválida.' });
  try {
    const [filas] = await pool.query(
      `SELECT s.id, s.nit_cifrado, s.nombre_cifrado, s.tipo_institucion, s.estado, s.resultado_verificacion,
              s.motivo_rechazo, s.creado_en, s.decidida_en, u.correo, a.correo AS decidida_por_correo
       FROM solicitudes_registro s
       JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN usuarios a ON a.id = s.decidida_por
       WHERE s.id = ?`,
      [req.params.id]
    );
    const fila = filas[0];
    if (!fila) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    const nit = descifrarCampo('solicitud.nit', fila.nit_cifrado);
    const nombre = descifrarCampo('solicitud.nombre', fila.nombre_cifrado);
    const actual = await verificarEnPadron(pool, { nit, nombre, tipoInstitucion: fila.tipo_institucion }, { incluirDetalle: true });
    res.set('Cache-Control', 'no-store');
    res.json({
      id: Number(fila.id),
      correo: fila.correo,
      declarado: { nombre, nit, tipoInstitucion: fila.tipo_institucion },
      padron: actual.coincidencia,
      resultadoAlRegistrar: fila.resultado_verificacion,
      resultadoAhora: actual.resultado,
      estado: fila.estado,
      motivoRechazo: fila.motivo_rechazo,
      creadoEn: fila.creado_en,
      decididaEn: fila.decidida_en,
      decididaPor: fila.decidida_por_correo || null
    });
    registrarAuditoria({ usuario: req.usuario, accion: 'ver_solicitud_registro', entidad: 'solicitud_registro', entidadId: fila.id });
  } catch (err) {
    console.error('[solicitudes] Error en detalle:', err.code || 'DETAIL_FAILED');
    res.status(503).json({ error: 'No disponible temporalmente.' });
  }
});

// Correo del solicitante para avisarle la decisión (fuera de la respuesta).
async function avisarSolicitante(id, aprobada, motivo) {
  try {
    const [filas] = await pool.query(
      'SELECT u.correo FROM solicitudes_registro s JOIN usuarios u ON u.id = s.usuario_id WHERE s.id = ?',
      [id]
    );
    if (!filas[0]) return;
    enviarCorreoEnSegundoPlano(aprobada
      ? {
        to: filas[0].correo,
        subject: 'Tu cuenta fue aprobada',
        text: 'Tu solicitud de cuenta fue aprobada. Ya puedes iniciar sesión; te enviaremos un código de seguridad a este correo.'
      }
      : {
        to: filas[0].correo,
        subject: 'Tu solicitud de cuenta no fue aprobada',
        text: `Tu solicitud de cuenta no fue aprobada.\n\nMotivo: ${motivo}\n\nPuedes registrarte de nuevo con los datos correctos.`,
        html: `<p>Tu solicitud de cuenta no fue aprobada.</p><p><strong>Motivo:</strong> ${escaparHtml(motivo)}</p><p>Puedes registrarte de nuevo con los datos correctos.</p>`
      });
  } catch (err) {
    console.error('[solicitudes] No se pudo preparar el aviso:', err.code || 'NOTICE_FAILED');
  }
}

// Diagnóstico solo cuando la decisión no se aplicó (camino poco frecuente).
async function motivoNoAplicada(id) {
  const [filas] = await pool.query('SELECT estado, resultado_verificacion FROM solicitudes_registro WHERE id = ?', [id]);
  if (!filas[0]) return { status: 404, error: 'Solicitud no encontrada.' };
  if (filas[0].estado !== 'pendiente') {
    return { status: 409, code: 'YA_DECIDIDA', error: `La solicitud ya fue ${filas[0].estado} por otro administrador.`, estado: filas[0].estado };
  }
  return {
    status: 409,
    code: 'CONFIRMACION_REQUERIDA',
    error: 'La verificación contra el padrón no coincide. Confirma explícitamente para aprobar.',
    resultado: filas[0].resultado_verificacion
  };
}

// POST /api/admin/solicitudes/:id/aprobar  { confirmar?: true }
// Atómico: un solo UPDATE sobre la solicitud y la cuenta, condicionado a que
// siga pendiente y, si la verificación no coincide, a la confirmación explícita.
router.post('/:id/aprobar', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'Solicitud inválida.' });
  const confirmar = req.body?.confirmar === true;
  try {
    const [r] = await pool.query(
      `UPDATE solicitudes_registro s
       JOIN usuarios u ON u.id = s.usuario_id
       SET s.estado = 'aprobada', s.decidida_por = ?, s.decidida_en = NOW(),
           u.estado_cuenta = 'activa'
       WHERE s.id = ? AND s.estado = 'pendiente' AND u.estado_cuenta = 'pendiente'
         AND (s.resultado_verificacion = 'coincide' OR ? = 1)`,
      [req.usuario.uid, req.params.id, confirmar ? 1 : 0]
    );
    if (r.affectedRows !== 2) {
      const motivo = await motivoNoAplicada(req.params.id);
      return res.status(motivo.status).json(motivo);
    }
    res.json({ ok: true, id: Number(req.params.id), estado: 'aprobada' });
    registrarAuditoria({
      usuario: req.usuario, accion: 'aprobar_registro', entidad: 'solicitud_registro', entidadId: req.params.id,
      detalle: { confirmacionExplicita: confirmar }
    });
    avisarN8n('registro.aprobado', req.params.id, 'aprobada');
    avisarSolicitante(req.params.id, true);
  } catch (err) {
    console.error('[solicitudes] Error aprobando:', err.code || 'APPROVE_FAILED');
    if (!res.headersSent) res.status(503).json({ error: 'No fue posible aprobar temporalmente.' });
  }
});

// POST /api/admin/solicitudes/:id/rechazar  { motivo }
router.post('/:id/rechazar', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'Solicitud inválida.' });
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : '';
  if (motivo.length < 5 || motivo.length > 500) {
    return res.status(400).json({ error: 'Escribe el motivo del rechazo (entre 5 y 500 caracteres).' });
  }
  try {
    const [r] = await pool.query(
      `UPDATE solicitudes_registro s
       JOIN usuarios u ON u.id = s.usuario_id
       SET s.estado = 'rechazada', s.motivo_rechazo = ?, s.decidida_por = ?, s.decidida_en = NOW(),
           u.estado_cuenta = 'rechazada'
       WHERE s.id = ? AND s.estado = 'pendiente' AND u.estado_cuenta = 'pendiente'`,
      [motivo, req.usuario.uid, req.params.id]
    );
    if (r.affectedRows !== 2) {
      const diagnostico = await motivoNoAplicada(req.params.id);
      return res.status(diagnostico.status).json(diagnostico.code === 'CONFIRMACION_REQUERIDA'
        ? { status: 409, error: 'No se pudo rechazar: la cuenta asociada no está pendiente.' }
        : diagnostico);
    }
    res.json({ ok: true, id: Number(req.params.id), estado: 'rechazada' });
    // El motivo no va a la auditoría: puede contener datos personales.
    registrarAuditoria({ usuario: req.usuario, accion: 'rechazar_registro', entidad: 'solicitud_registro', entidadId: req.params.id });
    avisarN8n('registro.rechazado', req.params.id, 'rechazada');
    avisarSolicitante(req.params.id, false, motivo);
  } catch (err) {
    console.error('[solicitudes] Error rechazando:', err.code || 'REJECT_FAILED');
    if (!res.headersSent) res.status(503).json({ error: 'No fue posible rechazar temporalmente.' });
  }
});

module.exports = router;
