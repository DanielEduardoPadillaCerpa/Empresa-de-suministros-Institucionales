const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { pool } = require('../db');
const { cifrar } = require('../crypto');
const { manejarMensaje, limitarMensajes } = require('./asistente');
const { avisarAdministrador } = require('../avisosAdmin');

const router = express.Router();
const limitarSolicitudesInstitucionales = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    error: 'Se alcanzó el límite temporal de solicitudes. Inténtalo más tarde.'
  })
});

// Las calificaciones alimentan los indicadores del panel: sin límite, un
// script podría llenar la tabla y distorsionar el promedio.
const limitarCalificaciones = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMITS !== '1',
  handler: (req, res) => res.status(429).json({ error: 'Demasiadas calificaciones desde esta conexión. Inténtalo más tarde.' })
});

router.post('/mensaje', limitarMensajes, (req, res) => manejarMensaje(req, res));

router.post('/solicitudes', limitarSolicitudesInstitucionales, async (req, res) => {
  const body = req.body || {};
  const tipoSolicitud = String(body.tipoSolicitud || '');
  const tipoEntidad = String(body.tipoEntidad || '');
  const entidad = typeof body.entidad === 'string' ? body.entidad.trim() : '';
  const nit = typeof body.nit === 'string' ? body.nit.replace(/\D/g, '') : '';
  const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
  const criticidad = String(body.criticidad || '');
  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim() : '';

  if (body.website) return res.status(400).json({ error: 'No fue posible procesar la solicitud.' });
  if (!['pqrs', 'soporte', 'cotizacion'].includes(tipoSolicitud) ||
      !['publica', 'privada'].includes(tipoEntidad) ||
      !['baja', 'media', 'alta', 'urgente'].includes(criticidad)) {
    return res.status(400).json({ error: 'Selecciona un tipo de solicitud, entidad y criticidad válidos.' });
  }
  if (String(body.autorizacionDatos || '') !== 'true') {
    return res.status(400).json({ error: 'Debes autorizar el tratamiento de los datos para radicar la solicitud.' });
  }
  if (!entidad || entidad.length > 255 || !/^\d{9,10}$/.test(nit) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 255 ||
      mensaje.length < 20 || mensaje.length > 2000) {
    return res.status(400).json({ error: 'Revisa el nombre de la entidad, NIT, correo y descripción de la solicitud.' });
  }

  try {
    const [resultado] = await pool.query(
      `INSERT INTO solicitudes_contacto
        (tipo_solicitud, tipo_entidad, entidad, nit_cifrado, correo_cifrado, criticidad, mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipoSolicitud, tipoEntidad, entidad, cifrar(nit), cifrar(correo), criticidad, mensaje]
    );
    const radicado = `SI-${String(resultado.insertId).padStart(8, '0')}`;
    res.status(201).json({ ok: true, radicado });
    avisarAdministrador({
      asunto: `Nueva solicitud de contacto ${radicado} (${criticidad})`,
      texto: `Llegó la solicitud ${radicado}: tipo ${tipoSolicitud}, criticidad ${criticidad}.\n\nRevísala en el panel administrativo: Solicitudes de contacto.`
    });
    return undefined;
  } catch (error) {
    console.error('[atencion] No se pudo registrar la solicitud institucional:', error.code || 'CONTACT_REQUEST_FAILED');
    return res.status(500).json({ error: 'No fue posible registrar la solicitud. Inténtalo de nuevo más tarde.' });
  }
});

router.post('/calificacion', limitarCalificaciones, async (req, res) => {
  try {
    const { conversacionId, calificacion, comentario, escaladoAHumano } = req.body || {};
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5.' });
    }
    if (conversacionId != null &&
        (typeof conversacionId !== 'string' || conversacionId.length > 100)) {
      return res.status(400).json({ error: 'El identificador de conversación no es válido.' });
    }
    if (comentario != null && (typeof comentario !== 'string' || comentario.length > 1000)) {
      return res.status(400).json({ error: 'El comentario no puede superar 1000 caracteres.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO atenciones (conversacion_id, calificacion, comentario, escalado_a_humano)
       VALUES (?, ?, ?, ?)`,
      [conversacionId || null, calificacion, comentario || null, Boolean(escaladoAHumano)]
    );
    return res.status(201).json({ id: resultado.insertId });
  } catch (error) {
    console.error('[atencion] No se pudo registrar la calificación:', error.code || 'RATING_SAVE_FAILED');
    return res.status(500).json({ error: 'No fue posible registrar la calificación.' });
  }
});

module.exports = router;
