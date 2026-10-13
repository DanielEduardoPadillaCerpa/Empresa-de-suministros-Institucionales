const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const { pool } = require('../db');
const { cifrar, descifrar } = require('../crypto');
const { requiereAutenticacion, requiereAdmin } = require('./auth');
const { registrarAuditoriaTransaccional } = require('../auditoria');
const { invalidarIndiceCatalogo } = require('../assistant/indiceCatalogo');
const { institucionValida } = require('../tenancy');
const {
  PERMISOS_STAFF,
  ESTADOS_VERIFICACION,
  obtenerContexto,
  requierePermiso
} = require('../autorizacion');
const {
  TIPOS_COMPRADOR,
  TIPOS_DOCUMENTO,
  tipoCompradorValido,
  dominioCoincide,
  validarDatosOrganizacion,
  datosInstitucionales,
  requisitosDocumentales,
  documentosFaltantes
} = require('../registroInstitucional');
const {
  MAX_REINTENTOS_TRAS_RECHAZO,
  MAX_DOCUMENTOS_VIGENTES,
  validarTransicion,
  registrarHistorial,
  revocarSesionesCliente,
  validarDocumento,
  guardarDocumentoCifrado,
  leerDocumentoCifrado,
  eliminarArchivoDocumento,
  leerMultipartDocumento
} = require('../verificacion');

const limitarSubidas = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMITS !== '1',
  handler: (req, res) => res.status(429).json({ error: 'Demasiadas cargas de documentos. Inténtalo más tarde.' })
});

const ESTADOS_EDITABLES = new Set(['borrador', 'requiere_informacion', 'rechazado']);

function parsearId(valor) {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

function leerJsonCifrado(valor) {
  if (!valor) return {};
  try {
    return JSON.parse(descifrar(valor)) || {};
  } catch {
    return {};
  }
}

function motivoValido(motivo, obligatorio) {
  if (motivo === undefined || motivo === null || motivo === '') return obligatorio ? null : '';
  if (typeof motivo !== 'string') return null;
  const limpio = motivo.trim();
  if (obligatorio && limpio.length < 10) return null;
  return limpio.length <= 500 ? limpio : null;
}

async function auditar(db, usuario, accion, clienteId, detalle) {
  await registrarAuditoriaTransaccional(db, {
    usuario, accion, entidad: 'verificacion_cliente', entidadId: clienteId, detalle
  });
}

async function cargarCliente(db, clienteId, { bloquear = false } = {}) {
  const [filas] = await db.query(
    `SELECT id, nombre_unidad, direccion_instalacion, nit, nombre_funcionario, correo, telefono,
            direccion_entrega, autorizacion_general, fecha_registro, tipo_institucion,
            estado_verificacion, institucion_aprobada, motivo_estado, datos_registro_cifrados,
            dominio_verificado, tipo_solicitado, datos_cambio_cifrados, reintentos_envio,
            enviado_revision_en, decidido_en, decidido_por
     FROM clientes WHERE id = ?${bloquear ? ' FOR UPDATE' : ''}`,
    [clienteId]
  );
  return filas[0] || null;
}

async function documentosVigentes(db, clienteId) {
  const [filas] = await db.query(
    `SELECT id, tipo_documento, nombre_original_cifrado, mime, tamano_bytes, sha256, creado_en
     FROM documentos_verificacion WHERE cliente_id = ? AND estado = 'vigente' ORDER BY creado_en`,
    [clienteId]
  );
  return filas;
}

async function usuariosDelCliente(db, clienteId) {
  const [filas] = await db.query(
    'SELECT id, correo, correo_verificado_en FROM usuarios WHERE cliente_id = ? ORDER BY id',
    [clienteId]
  );
  return filas;
}

// Requisitos de una solicitud: correo verificado + documentos obligatorios del
// tipo (o del tipo solicitado en un cambio). El dominio institucional solo
// cuenta si el correo de ese dominio ya fue verificado por MFA.
function evaluarRequisitos(cliente, usuarios, documentos, { tipo = cliente.tipo_institucion, datos } = {}) {
  const correoVerificado = usuarios.some(u => u.correo_verificado_en);
  const dominioVerificado = usuarios.some(u => u.correo_verificado_en && dominioCoincide(tipo, u.correo));
  const datosOrg = datos || leerJsonCifrado(cliente.datos_registro_cifrados);
  const requisitos = requisitosDocumentales(tipo, { dominioVerificado, datos: datosOrg });
  const faltantes = documentosFaltantes(requisitos, documentos);
  return {
    tipoDefinido: tipoCompradorValido(tipo),
    correoVerificado,
    dominioVerificado,
    requisitos: requisitos.map(req => ({
      ...req,
      cumplido: documentos.some(doc => doc.tipo_documento === req.tipo)
    })),
    faltantes: faltantes.map(req => req.tipo),
    completo: tipoCompradorValido(tipo) && correoVerificado && faltantes.length === 0
  };
}

function documentoPublico(doc) {
  return {
    id: Number(doc.id),
    tipo: doc.tipo_documento,
    nombre: descifrar(doc.nombre_original_cifrado),
    mime: doc.mime,
    tamanoBytes: Number(doc.tamano_bytes),
    creadoEn: doc.creado_en
  };
}

// ===========================================================================
// Titular de la cuenta
// ===========================================================================
async function contextoTitular(req, res) {
  const ctx = await obtenerContexto(req.usuario);
  if (ctx.staff || !ctx.clienteId) {
    res.status(403).json({ error: 'Esta sección es para cuentas de compradores.' });
    return null;
  }
  return ctx;
}

router.get('/mi-solicitud', requiereAutenticacion, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const ctx = await contextoTitular(req, res);
    if (!ctx) return;
    const cliente = await cargarCliente(pool, ctx.clienteId);
    if (!cliente) return res.status(404).json({ error: 'No se encontró la solicitud asociada a tu cuenta.' });
    const [documentos, usuarios] = await Promise.all([
      documentosVigentes(pool, cliente.id),
      usuariosDelCliente(pool, cliente.id)
    ]);
    const [historial] = await pool.query(
      `SELECT estado_anterior, estado_nuevo, evento, actor_tipo, motivo, creado_en
       FROM verificacion_historial WHERE cliente_id = ? ORDER BY creado_en, id`,
      [cliente.id]
    );
    const enCambio = Boolean(cliente.tipo_solicitado);
    const requisitos = evaluarRequisitos(cliente, usuarios, documentos, enCambio
      ? { tipo: cliente.tipo_solicitado, datos: leerJsonCifrado(cliente.datos_cambio_cifrados) }
      : {});
    const estado = cliente.estado_verificacion;
    const editable = ESTADOS_EDITABLES.has(estado) || (estado === 'aprobado' && enCambio);
    res.json({
      clienteId: cliente.id,
      estado,
      tipoInstitucion: cliente.tipo_institucion,
      tipoEtiqueta: TIPOS_COMPRADOR[cliente.tipo_institucion]?.etiqueta || null,
      institucionAprobada: cliente.institucion_aprobada,
      tipoSolicitado: cliente.tipo_solicitado,
      motivo: cliente.motivo_estado,
      organizacion: {
        nombreEntidad: cliente.nombre_unidad,
        nit: cliente.nit,
        ...leerJsonCifrado(cliente.datos_registro_cifrados)
      },
      autorizacionRestringidos: estado === 'aprobado' && Boolean(cliente.autorizacion_general),
      requisitos,
      documentos: documentos.map(documentoPublico),
      historial: historial.map(h => ({
        estadoAnterior: h.estado_anterior,
        estadoNuevo: h.estado_nuevo,
        evento: h.evento,
        actor: h.actor_tipo,
        motivo: h.motivo,
        fecha: h.creado_en
      })),
      puedeSubirDocumentos: editable,
      puedeEnviar: ESTADOS_EDITABLES.has(estado) && requisitos.completo &&
        (estado !== 'rechazado' || Number(cliente.reintentos_envio) < MAX_REINTENTOS_TRAS_RECHAZO),
      puedeCambiarTipo: ESTADOS_EDITABLES.has(estado) || (estado === 'aprobado' && !enCambio),
      reintentosRestantes: Math.max(0, MAX_REINTENTOS_TRAS_RECHAZO - Number(cliente.reintentos_envio || 0))
    });
  } catch (err) {
    console.error('[verificacion] No se pudo consultar la solicitud:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible consultar tu solicitud.' });
  }
});

router.post('/mi-solicitud/documentos', requiereAutenticacion, limitarSubidas, async (req, res) => {
  let entrada;
  try {
    entrada = await leerMultipartDocumento(req);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }
  let archivoGuardado = null;
  let connection;
  try {
    const ctx = await contextoTitular(req, res);
    if (!ctx) return;
    const tipoDocumento = String(entrada.campos.tipoDocumento || '');
    if (!TIPOS_DOCUMENTO.has(tipoDocumento)) return res.status(400).json({ error: 'Tipo de documento no válido.' });
    if (!entrada.archivo) return res.status(400).json({ error: 'Adjunta un archivo.' });
    const validacion = validarDocumento(entrada.archivo.contenido);
    if (!validacion.ok) return res.status(400).json({ error: validacion.error });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, ctx.clienteId, { bloquear: true });
    const editable = ESTADOS_EDITABLES.has(cliente.estado_verificacion) ||
      (cliente.estado_verificacion === 'aprobado' && cliente.tipo_solicitado);
    if (!editable) {
      await connection.rollback();
      return res.status(409).json({ error: 'Tu solicitud no admite documentos en su estado actual.' });
    }
    const [[{ total }]] = await connection.query(
      "SELECT COUNT(*) AS total FROM documentos_verificacion WHERE cliente_id = ? AND estado = 'vigente'",
      [cliente.id]
    );
    if (Number(total) >= MAX_DOCUMENTOS_VIGENTES) {
      await connection.rollback();
      return res.status(409).json({ error: `Puedes tener como máximo ${MAX_DOCUMENTOS_VIGENTES} documentos. Elimina alguno antes de subir otro.` });
    }

    archivoGuardado = await guardarDocumentoCifrado(entrada.archivo.contenido);
    const [resultado] = await connection.query(
      `INSERT INTO documentos_verificacion
         (cliente_id, subido_por, tipo_documento, nombre_original_cifrado, mime, tamano_bytes, sha256, archivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente.id,
        ctx.usuarioId,
        tipoDocumento,
        cifrar(entrada.archivo.nombre),
        validacion.tipo.mime,
        entrada.archivo.contenido.length,
        crypto.createHash('sha256').update(entrada.archivo.contenido).digest('hex'),
        archivoGuardado
      ]
    );
    await connection.commit();
    res.status(201).json({ id: resultado.insertId, tipo: tipoDocumento, mime: validacion.tipo.mime });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    if (archivoGuardado) await eliminarArchivoDocumento(archivoGuardado);
    console.error('[verificacion] No se pudo guardar el documento:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible guardar el documento.' });
  } finally {
    if (connection) connection.release();
  }
});

async function enviarDocumento(res, doc) {
  const contenido = await leerDocumentoCifrado(doc.archivo);
  const extension = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' }[doc.mime] || 'bin';
  res.set({
    'Content-Type': doc.mime,
    'Content-Disposition': `attachment; filename="documento-${doc.id}.${extension}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox"
  });
  res.send(contenido);
}

router.get('/mi-solicitud/documentos/:id', requiereAutenticacion, async (req, res) => {
  try {
    const ctx = await contextoTitular(req, res);
    if (!ctx) return;
    const id = parsearId(req.params.id);
    const [filas] = await pool.query(
      "SELECT id, archivo, mime FROM documentos_verificacion WHERE id = ? AND cliente_id = ? AND estado = 'vigente'",
      [id, ctx.clienteId]
    );
    if (!filas.length) return res.status(404).json({ error: 'Documento no encontrado.' });
    await enviarDocumento(res, filas[0]);
  } catch (err) {
    console.error('[verificacion] No se pudo entregar el documento:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible descargar el documento.' });
  }
});

router.delete('/mi-solicitud/documentos/:id', requiereAutenticacion, async (req, res) => {
  try {
    const ctx = await contextoTitular(req, res);
    if (!ctx) return;
    const cliente = await cargarCliente(pool, ctx.clienteId);
    const editable = ESTADOS_EDITABLES.has(cliente.estado_verificacion) ||
      (cliente.estado_verificacion === 'aprobado' && cliente.tipo_solicitado);
    if (!editable) return res.status(409).json({ error: 'No puedes modificar documentos mientras la solicitud está en revisión.' });
    const id = parsearId(req.params.id);
    const [filas] = await pool.query(
      "SELECT id, archivo FROM documentos_verificacion WHERE id = ? AND cliente_id = ? AND estado = 'vigente'",
      [id, ctx.clienteId]
    );
    if (!filas.length) return res.status(404).json({ error: 'Documento no encontrado.' });
    await pool.query(
      "UPDATE documentos_verificacion SET estado = 'eliminado', eliminado_en = NOW() WHERE id = ?",
      [filas[0].id]
    );
    await eliminarArchivoDocumento(filas[0].archivo);
    res.json({ ok: true });
  } catch (err) {
    console.error('[verificacion] No se pudo eliminar el documento:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible eliminar el documento.' });
  }
});

router.post('/mi-solicitud/enviar', requiereAutenticacion, async (req, res) => {
  let connection;
  try {
    const ctx = await contextoTitular(req, res);
    if (!ctx) return;
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, ctx.clienteId, { bloquear: true });
    const transicion = validarTransicion('enviar', cliente.estado_verificacion);
    if (!transicion.ok) {
      await connection.rollback();
      return res.status(409).json({ error: transicion.error });
    }
    if (cliente.estado_verificacion === 'rechazado' && Number(cliente.reintentos_envio) >= MAX_REINTENTOS_TRAS_RECHAZO) {
      await connection.rollback();
      return res.status(409).json({ error: 'Agotaste los reenvíos permitidos tras un rechazo. Contacta al equipo de soporte.' });
    }
    const [documentos, usuarios] = await Promise.all([
      documentosVigentes(connection, cliente.id),
      usuariosDelCliente(connection, cliente.id)
    ]);
    const requisitos = evaluarRequisitos(cliente, usuarios, documentos);
    if (!requisitos.completo) {
      await connection.rollback();
      return res.status(422).json({ error: 'Tu solicitud todavía no cumple los requisitos.', requisitos });
    }
    await connection.query(
      `UPDATE clientes
       SET estado_verificacion = 'pendiente', enviado_revision_en = NOW(), motivo_estado = NULL,
           dominio_verificado = ?,
           reintentos_envio = reintentos_envio + IF(estado_verificacion = 'rechazado', 1, 0)
       WHERE id = ? AND estado_verificacion = ?`,
      [requisitos.dominioVerificado, cliente.id, cliente.estado_verificacion]
    );
    await registrarHistorial(connection, {
      clienteId: cliente.id,
      anterior: cliente.estado_verificacion,
      nuevo: 'pendiente',
      evento: 'enviar',
      actorUsuarioId: ctx.usuarioId,
      actorTipo: 'cliente'
    });
    await connection.commit();
    res.json({ ok: true, estado: 'pendiente' });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo enviar la solicitud:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible enviar tu solicitud.' });
  } finally {
    if (connection) connection.release();
  }
});

// Clasificación de la organización: completa una cuenta heredada, corrige los
// datos antes de la aprobación o, si ya está aprobada, solicita un cambio de
// tipo que debe aprobar un revisor (no se concede de inmediato).
router.post('/mi-solicitud/clasificacion', requiereAutenticacion, async (req, res) => {
  let connection;
  try {
    const ctx = await contextoTitular(req, res);
    if (!ctx) return;
    const validacion = validarDatosOrganizacion(req.body);
    if (!validacion.ok) {
      return res.status(400).json({ error: validacion.errores._ || 'Revisa los datos marcados.', errores: validacion.errores });
    }
    const datos = validacion.datos;
    const tipo = datos.tipoInstitucion;
    const datosOrg = datosInstitucionales(tipo, datos);

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, ctx.clienteId, { bloquear: true });
    const estado = cliente.estado_verificacion;

    if (ESTADOS_EDITABLES.has(estado)) {
      await connection.query(
        `UPDATE clientes SET tipo_institucion = ?, nombre_unidad = ?, nit = ?, direccion_instalacion = ?,
                datos_registro_cifrados = ?, estado_verificacion = 'borrador'
         WHERE id = ?`,
        [tipo, datos.nombreEntidad, datos.nit, datos.direccionInstalacion, cifrar(JSON.stringify(datosOrg)), cliente.id]
      );
      if (estado !== 'borrador' || cliente.tipo_institucion !== tipo) {
        await registrarHistorial(connection, {
          clienteId: cliente.id, anterior: estado, nuevo: 'borrador', evento: 'clasificacion',
          actorUsuarioId: ctx.usuarioId, actorTipo: 'cliente',
          motivo: cliente.tipo_institucion === tipo ? 'Datos de la organización actualizados' : `Tipo de institución: ${tipo}`
        });
      }
      await connection.commit();
      return res.json({ ok: true, estado: 'borrador', tipoInstitucion: tipo });
    }

    if (estado === 'aprobado') {
      if (tipo === cliente.tipo_institucion) {
        await connection.rollback();
        return res.status(409).json({ error: 'Para corregir datos de una cuenta aprobada usa una solicitud de corrección en Mi cuenta.' });
      }
      if (cliente.tipo_solicitado) {
        await connection.rollback();
        return res.status(409).json({ error: 'Ya tienes un cambio de tipo en revisión.' });
      }
      await connection.query(
        'UPDATE clientes SET tipo_solicitado = ?, datos_cambio_cifrados = ? WHERE id = ?',
        [tipo, cifrar(JSON.stringify({ ...datosOrg, nombreEntidad: datos.nombreEntidad, nit: datos.nit, direccionInstalacion: datos.direccionInstalacion })), cliente.id]
      );
      await registrarHistorial(connection, {
        clienteId: cliente.id, anterior: estado, nuevo: estado, evento: 'cambio_tipo_solicitado',
        actorUsuarioId: ctx.usuarioId, actorTipo: 'cliente', motivo: `Cambio solicitado a: ${tipo}`
      });
      await connection.commit();
      return res.status(202).json({
        ok: true, estado, tipoSolicitado: tipo,
        mensaje: 'Tu cambio de tipo quedó en revisión. Mientras tanto conservas el acceso actual. Adjunta la evidencia del nuevo tipo.'
      });
    }

    await connection.rollback();
    return res.status(409).json({ error: estado === 'pendiente'
      ? 'Tu solicitud está en revisión; espera la decisión antes de modificarla.'
      : 'Tu cuenta no admite cambios en su estado actual.' });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo actualizar la clasificación:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible actualizar la clasificación.' });
  } finally {
    if (connection) connection.release();
  }
});

// ===========================================================================
// Panel administrativo (staff con permisos diferenciados)
// ===========================================================================
const staff = [requiereAutenticacion, requiereAdmin];

router.get('/admin/mis-permisos', ...staff, requierePermiso(), (req, res) => {
  res.json({
    permisos: [...req.contextoStaff.permisos],
    catalogo: PERMISOS_STAFF
  });
});

router.get('/admin/solicitudes', ...staff, requierePermiso('verificacion.ver'), async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const condiciones = [];
    const params = [];
    const { estado, tipo, desde, hasta, q, cambio } = req.query;
    if (estado) {
      if (!ESTADOS_VERIFICACION.includes(estado)) return res.status(400).json({ error: 'Estado no válido.' });
      condiciones.push('c.estado_verificacion = ?');
      params.push(estado);
    }
    if (tipo) {
      if (tipo === 'sin_clasificar') condiciones.push('c.tipo_institucion IS NULL');
      else if (tipoCompradorValido(tipo)) {
        condiciones.push('c.tipo_institucion = ?');
        params.push(tipo);
      } else return res.status(400).json({ error: 'Tipo no válido.' });
    }
    for (const [valor, operador] of [[desde, '>='], [hasta, '<']]) {
      if (!valor) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return res.status(400).json({ error: 'Fecha no válida (AAAA-MM-DD).' });
      condiciones.push(`c.fecha_registro ${operador} ${operador === '<' ? 'DATE_ADD(?, INTERVAL 1 DAY)' : '?'}`);
      params.push(valor);
    }
    if (q) {
      const termino = String(q).trim().slice(0, 100);
      condiciones.push('(c.nombre_unidad LIKE ? OR c.nit LIKE ?)');
      params.push(`%${termino}%`, `%${termino.replace(/[^\d-]/g, '') || termino}%`);
    }
    if (cambio === '1') condiciones.push('c.tipo_solicitado IS NOT NULL');

    const [filas] = await pool.query(
      `SELECT c.id, c.nombre_unidad, c.nit, c.tipo_institucion, c.estado_verificacion, c.institucion_aprobada,
              c.tipo_solicitado, c.fecha_registro, c.enviado_revision_en, c.decidido_en, c.dominio_verificado,
              c.autorizacion_general, c.nombre_funcionario,
              (SELECT u.correo FROM usuarios u WHERE u.cliente_id = c.id ORDER BY u.id LIMIT 1) AS correo_cuenta,
              (SELECT COUNT(*) FROM documentos_verificacion d WHERE d.cliente_id = c.id AND d.estado = 'vigente') AS documentos,
              (SELECT COUNT(*) FROM clientes c2 WHERE c2.nit = c.nit AND c2.id <> c.id) AS mismo_nit
       FROM clientes c
       ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
       ORDER BY FIELD(c.estado_verificacion, 'pendiente', 'requiere_informacion', 'borrador', 'suspendido', 'rechazado', 'aprobado'),
                COALESCE(c.enviado_revision_en, c.fecha_registro) ASC
       LIMIT 200`,
      params
    );
    const [conteos] = await pool.query('SELECT estado_verificacion AS estado, COUNT(*) AS total FROM clientes GROUP BY estado_verificacion');
    res.json({
      conteos: Object.fromEntries(conteos.map(c => [c.estado, Number(c.total)])),
      solicitudes: filas.map(f => ({
        clienteId: f.id,
        entidad: f.nombre_unidad,
        nit: f.nit,
        solicitante: descifrar(f.nombre_funcionario),
        correo: f.correo_cuenta,
        tipoInstitucion: f.tipo_institucion,
        estado: f.estado_verificacion,
        institucionAprobada: f.institucion_aprobada,
        tipoSolicitado: f.tipo_solicitado,
        fechaRegistro: f.fecha_registro,
        enviadoRevisionEn: f.enviado_revision_en,
        decididoEn: f.decidido_en,
        dominioInstitucional: Boolean(f.dominio_verificado),
        autorizacionRestringidos: Boolean(f.autorizacion_general),
        documentos: Number(f.documentos),
        otrasCuentasMismoNit: Number(f.mismo_nit)
      }))
    });
  } catch (err) {
    console.error('[verificacion] No se pudo listar solicitudes:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible listar las solicitudes.' });
  }
});

router.get('/admin/solicitudes/:clienteId', ...staff, requierePermiso('verificacion.ver'), async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const cliente = await cargarCliente(pool, parsearId(req.params.clienteId));
    if (!cliente) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    const [documentos, usuarios] = await Promise.all([
      documentosVigentes(pool, cliente.id),
      usuariosDelCliente(pool, cliente.id)
    ]);
    const [historial] = await pool.query(
      `SELECT h.estado_anterior, h.estado_nuevo, h.evento, h.actor_tipo, h.motivo, h.creado_en, u.correo AS actor_correo
       FROM verificacion_historial h LEFT JOIN usuarios u ON u.id = h.actor_usuario_id
       WHERE h.cliente_id = ? ORDER BY h.creado_en, h.id`,
      [cliente.id]
    );
    const [mismoNit] = await pool.query(
      'SELECT id, nombre_unidad, estado_verificacion, tipo_institucion FROM clientes WHERE nit = ? AND id <> ? LIMIT 20',
      [cliente.nit, cliente.id]
    );
    const datosCambio = cliente.tipo_solicitado ? leerJsonCifrado(cliente.datos_cambio_cifrados) : null;
    res.json({
      clienteId: cliente.id,
      estado: cliente.estado_verificacion,
      tipoInstitucion: cliente.tipo_institucion,
      institucionAprobada: cliente.institucion_aprobada,
      motivo: cliente.motivo_estado,
      organizacion: {
        nombreEntidad: cliente.nombre_unidad,
        nit: cliente.nit,
        direccionInstalacion: cliente.direccion_instalacion,
        ...leerJsonCifrado(cliente.datos_registro_cifrados)
      },
      solicitante: {
        nombre: descifrar(cliente.nombre_funcionario),
        correo: descifrar(cliente.correo),
        telefono: descifrar(cliente.telefono)
      },
      cuentas: usuarios.map(u => ({
        usuarioId: u.id,
        correo: u.correo,
        correoVerificado: Boolean(u.correo_verificado_en),
        dominioCoincide: dominioCoincide(cliente.tipo_institucion, u.correo)
      })),
      requisitos: evaluarRequisitos(cliente, usuarios, documentos),
      documentos: documentos.map(documentoPublico),
      cambioSolicitado: cliente.tipo_solicitado ? {
        tipo: cliente.tipo_solicitado,
        datos: datosCambio,
        requisitos: evaluarRequisitos(cliente, usuarios, documentos, { tipo: cliente.tipo_solicitado, datos: datosCambio })
      } : null,
      autorizacionRestringidos: Boolean(cliente.autorizacion_general),
      reintentosEnvio: Number(cliente.reintentos_envio),
      fechaRegistro: cliente.fecha_registro,
      enviadoRevisionEn: cliente.enviado_revision_en,
      decididoEn: cliente.decidido_en,
      otrasCuentasMismoNit: mismoNit.map(c => ({
        clienteId: c.id, entidad: c.nombre_unidad, estado: c.estado_verificacion, tipoInstitucion: c.tipo_institucion
      })),
      historial: historial.map(h => ({
        estadoAnterior: h.estado_anterior,
        estadoNuevo: h.estado_nuevo,
        evento: h.evento,
        actor: h.actor_tipo,
        actorCorreo: h.actor_tipo === 'staff' ? h.actor_correo : null,
        motivo: h.motivo,
        fecha: h.creado_en
      }))
    });
  } catch (err) {
    console.error('[verificacion] No se pudo consultar la solicitud:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible consultar la solicitud.' });
  }
});

// Toda descarga administrativa queda auditada; si la auditoría falla, no se entrega.
router.get('/admin/documentos/:id', ...staff, requierePermiso('documentos.ver'), async (req, res) => {
  try {
    const [filas] = await pool.query(
      "SELECT id, cliente_id, tipo_documento, archivo, mime FROM documentos_verificacion WHERE id = ? AND estado = 'vigente'",
      [parsearId(req.params.id)]
    );
    if (!filas.length) return res.status(404).json({ error: 'Documento no encontrado.' });
    await auditar(pool, req.usuario, 'ver_documento', filas[0].cliente_id, { documentoId: filas[0].id, tipo: filas[0].tipo_documento });
    await enviarDocumento(res, filas[0]);
  } catch (err) {
    console.error('[verificacion] No se pudo entregar el documento:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible descargar el documento.' });
  }
});

const DECISIONES = { aprobar: 'aprobar', rechazar: 'rechazar', solicitar_informacion: 'solicitar_informacion' };

router.post('/admin/solicitudes/:clienteId/decision', ...staff, requierePermiso('verificacion.decidir'), async (req, res) => {
  const evento = DECISIONES[req.body?.decision];
  if (!evento) return res.status(400).json({ error: 'Decisión no válida.' });
  const motivo = motivoValido(req.body?.motivo, evento !== 'aprobar');
  if (motivo === null) return res.status(400).json({ error: 'Indica el motivo de la decisión (mínimo 10 caracteres, máximo 500).' });

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, parsearId(req.params.clienteId), { bloquear: true });
    if (!cliente) {
      await connection.rollback();
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    const transicion = validarTransicion(evento, cliente.estado_verificacion);
    if (!transicion.ok) {
      await connection.rollback();
      return res.status(409).json({ error: transicion.error });
    }
    if (evento === 'aprobar') {
      const [documentos, usuarios] = await Promise.all([
        documentosVigentes(connection, cliente.id),
        usuariosDelCliente(connection, cliente.id)
      ]);
      const requisitos = evaluarRequisitos(cliente, usuarios, documentos);
      if (!requisitos.completo || !institucionValida(cliente.tipo_institucion)) {
        await connection.rollback();
        return res.status(422).json({ error: 'La solicitud no cumple los requisitos para aprobarse (tipo, correo verificado y documentos obligatorios).', requisitos });
      }
    }
    const nuevo = transicion.regla.hacia;
    await connection.query(
      `UPDATE clientes SET estado_verificacion = ?, institucion_aprobada = ?, motivo_estado = ?,
              decidido_en = NOW(), decidido_por = ?
       WHERE id = ? AND estado_verificacion = ?`,
      [nuevo, evento === 'aprobar' ? cliente.tipo_institucion : null, motivo || null,
        Number(req.usuario.uid), cliente.id, cliente.estado_verificacion]
    );
    await registrarHistorial(connection, {
      clienteId: cliente.id, anterior: cliente.estado_verificacion, nuevo, evento,
      actorUsuarioId: Number(req.usuario.uid), actorTipo: 'staff', motivo
    });
    await auditar(connection, req.usuario, `verificacion_${evento}`, cliente.id, {
      estadoAnterior: cliente.estado_verificacion, estadoNuevo: nuevo, tipoInstitucion: cliente.tipo_institucion, motivo
    });
    await connection.commit();
    res.json({ ok: true, estado: nuevo });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo registrar la decisión:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible registrar la decisión.' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/admin/solicitudes/:clienteId/cambio-tipo', ...staff, requierePermiso('verificacion.decidir'), async (req, res) => {
  const decision = req.body?.decision;
  if (!['aprobar', 'rechazar'].includes(decision)) return res.status(400).json({ error: 'Decisión no válida.' });
  const motivo = motivoValido(req.body?.motivo, decision === 'rechazar');
  if (motivo === null) return res.status(400).json({ error: 'Indica el motivo (mínimo 10 caracteres).' });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, parsearId(req.params.clienteId), { bloquear: true });
    if (!cliente || !cliente.tipo_solicitado || cliente.estado_verificacion !== 'aprobado') {
      await connection.rollback();
      return res.status(409).json({ error: 'No hay un cambio de tipo pendiente para esta cuenta.' });
    }
    const datosCambio = leerJsonCifrado(cliente.datos_cambio_cifrados);
    if (decision === 'aprobar') {
      const [documentos, usuarios] = await Promise.all([
        documentosVigentes(connection, cliente.id),
        usuariosDelCliente(connection, cliente.id)
      ]);
      const requisitos = evaluarRequisitos(cliente, usuarios, documentos, { tipo: cliente.tipo_solicitado, datos: datosCambio });
      if (!requisitos.completo) {
        await connection.rollback();
        return res.status(422).json({ error: 'Faltan requisitos del nuevo tipo de institución.', requisitos });
      }
      const { nombreEntidad, nit, direccionInstalacion, ...datosOrg } = datosCambio;
      // La autorización de restringidos se concedió para la institución
      // anterior: se revoca y debe evaluarse de nuevo.
      await connection.query(
        `UPDATE clientes SET tipo_institucion = tipo_solicitado, institucion_aprobada = tipo_solicitado,
                nombre_unidad = COALESCE(?, nombre_unidad), nit = COALESCE(?, nit),
                direccion_instalacion = COALESCE(?, direccion_instalacion), datos_registro_cifrados = ?,
                tipo_solicitado = NULL, datos_cambio_cifrados = NULL, autorizacion_general = FALSE,
                decidido_en = NOW(), decidido_por = ?
         WHERE id = ?`,
        [nombreEntidad || null, nit || null, direccionInstalacion || null, cifrar(JSON.stringify(datosOrg)), Number(req.usuario.uid), cliente.id]
      );
    } else {
      await connection.query('UPDATE clientes SET tipo_solicitado = NULL, datos_cambio_cifrados = NULL WHERE id = ?', [cliente.id]);
    }
    await registrarHistorial(connection, {
      clienteId: cliente.id, anterior: 'aprobado', nuevo: 'aprobado', evento: `cambio_tipo_${decision === 'aprobar' ? 'aprobado' : 'rechazado'}`,
      actorUsuarioId: Number(req.usuario.uid), actorTipo: 'staff',
      motivo: [motivo, `${cliente.tipo_institucion} → ${cliente.tipo_solicitado}`].filter(Boolean).join(' · ')
    });
    await auditar(connection, req.usuario, `cambio_tipo_${decision}`, cliente.id, {
      tipoAnterior: cliente.tipo_institucion, tipoSolicitado: cliente.tipo_solicitado, motivo
    });
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo resolver el cambio de tipo:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible resolver el cambio de tipo.' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/admin/solicitudes/:clienteId/suspension', ...staff, requierePermiso('cuentas.suspender'), async (req, res) => {
  const evento = { suspender: 'suspender', reactivar: 'reactivar' }[req.body?.accion];
  if (!evento) return res.status(400).json({ error: 'Acción no válida.' });
  const motivo = motivoValido(req.body?.motivo, true);
  if (motivo === null) return res.status(400).json({ error: 'Indica el motivo (mínimo 10 caracteres).' });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, parsearId(req.params.clienteId), { bloquear: true });
    if (!cliente) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cuenta no encontrada.' });
    }
    const transicion = validarTransicion(evento, cliente.estado_verificacion);
    if (!transicion.ok) {
      await connection.rollback();
      return res.status(409).json({ error: transicion.error });
    }
    const nuevo = evento === 'suspender' ? 'suspendido' : (cliente.institucion_aprobada ? 'aprobado' : 'borrador');
    await connection.query(
      'UPDATE clientes SET estado_verificacion = ?, motivo_estado = ?, decidido_en = NOW(), decidido_por = ? WHERE id = ? AND estado_verificacion = ?',
      [nuevo, motivo, Number(req.usuario.uid), cliente.id, cliente.estado_verificacion]
    );
    // Suspender cierra de inmediato todas las sesiones de la cuenta.
    if (evento === 'suspender') await revocarSesionesCliente(connection, cliente.id);
    await registrarHistorial(connection, {
      clienteId: cliente.id, anterior: cliente.estado_verificacion, nuevo, evento,
      actorUsuarioId: Number(req.usuario.uid), actorTipo: 'staff', motivo
    });
    await auditar(connection, req.usuario, `cuenta_${evento}`, cliente.id, { estadoAnterior: cliente.estado_verificacion, estadoNuevo: nuevo, motivo });
    await connection.commit();
    res.json({ ok: true, estado: nuevo });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo cambiar la suspensión:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible actualizar la cuenta.' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/admin/solicitudes/:clienteId/restringidos', ...staff, requierePermiso('restringidos.autorizar'), async (req, res) => {
  if (typeof req.body?.autorizar !== 'boolean') return res.status(400).json({ error: 'Indica si se autoriza o se revoca.' });
  const motivo = motivoValido(req.body?.motivo, true);
  if (motivo === null) return res.status(400).json({ error: 'Indica el motivo y la evidencia revisada (mínimo 10 caracteres).' });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cliente = await cargarCliente(connection, parsearId(req.params.clienteId), { bloquear: true });
    if (!cliente) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cuenta no encontrada.' });
    }
    if (req.body.autorizar && cliente.estado_verificacion !== 'aprobado') {
      await connection.rollback();
      return res.status(409).json({ error: 'Solo una cuenta aprobada puede recibir autorización de productos restringidos.' });
    }
    await connection.query('UPDATE clientes SET autorizacion_general = ? WHERE id = ?', [req.body.autorizar, cliente.id]);
    await registrarHistorial(connection, {
      clienteId: cliente.id, anterior: cliente.estado_verificacion, nuevo: cliente.estado_verificacion,
      evento: req.body.autorizar ? 'restringidos_autorizados' : 'restringidos_revocados',
      actorUsuarioId: Number(req.usuario.uid), actorTipo: 'staff', motivo
    });
    await auditar(connection, req.usuario, req.body.autorizar ? 'restringidos_autorizar' : 'restringidos_revocar', cliente.id, { motivo });
    await connection.commit();
    res.json({ ok: true, autorizacionRestringidos: req.body.autorizar });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo cambiar la autorización de restringidos:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible actualizar la autorización.' });
  } finally {
    if (connection) connection.release();
  }
});

// --- Cumplimiento de productos ----------------------------------------------
router.get('/admin/productos', ...staff, requierePermiso('productos.cumplimiento'), async (req, res) => {
  try {
    const condiciones = [];
    const params = [];
    if (req.query.revision) {
      if (!['no_requerida', 'pendiente', 'aprobada', 'bloqueada'].includes(req.query.revision)) {
        return res.status(400).json({ error: 'Revisión no válida.' });
      }
      condiciones.push('p.revision_legal = ?');
      params.push(req.query.revision);
    }
    if (req.query.restringido === '1') condiciones.push('p.restringido = TRUE');
    if (req.query.q) {
      condiciones.push('p.nombre LIKE ?');
      params.push(`%${String(req.query.q).trim().slice(0, 100)}%`);
    }
    const [filas] = await pool.query(
      `SELECT p.id, p.nombre, p.institucion_id, p.restringido, p.revision_legal, p.estado, c.nombre AS categoria,
              GROUP_CONCAT(e.institucion_id ORDER BY e.institucion_id) AS elegibles
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN productos_elegibilidad e ON e.producto_id = p.id
       ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
       GROUP BY p.id
       ORDER BY FIELD(p.revision_legal, 'pendiente', 'bloqueada', 'aprobada', 'no_requerida'), p.restringido DESC, p.nombre
       LIMIT 300`,
      params
    );
    res.json(filas.map(f => ({
      id: f.id,
      nombre: f.nombre,
      categoria: f.categoria,
      institucion: f.institucion_id,
      institucionesElegibles: String(f.elegibles || '').split(',').filter(Boolean),
      restringido: Boolean(f.restringido),
      revisionLegal: f.revision_legal,
      estado: f.estado
    })));
  } catch (err) {
    console.error('[verificacion] No se pudo listar productos de cumplimiento:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible listar los productos.' });
  }
});

router.put('/admin/productos/:id/cumplimiento', ...staff, requierePermiso('productos.cumplimiento'), async (req, res) => {
  const { revisionLegal, restringido, institucionesElegibles } = req.body || {};
  if (!['no_requerida', 'pendiente', 'aprobada', 'bloqueada'].includes(revisionLegal) || typeof restringido !== 'boolean' ||
      !Array.isArray(institucionesElegibles) || institucionesElegibles.length > 10 ||
      institucionesElegibles.some(i => !institucionValida(i))) {
    return res.status(400).json({ error: 'Datos de cumplimiento no válidos.' });
  }
  if (restringido && revisionLegal === 'no_requerida') {
    return res.status(400).json({ error: 'Un producto restringido debe tener revisión legal pendiente, aprobada o bloqueada.' });
  }
  const motivo = motivoValido(req.body?.motivo, true);
  if (motivo === null) return res.status(400).json({ error: 'Indica el sustento de la decisión (mínimo 10 caracteres).' });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const productoId = parsearId(req.params.id);
    const [filas] = await connection.query(
      'SELECT id, institucion_id, restringido, revision_legal FROM productos WHERE id = ? FOR UPDATE',
      [productoId]
    );
    if (!filas.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    const extras = [...new Set(institucionesElegibles)].filter(i => i !== filas[0].institucion_id);
    await connection.query('UPDATE productos SET restringido = ?, revision_legal = ? WHERE id = ?', [restringido, revisionLegal, productoId]);
    await connection.query('DELETE FROM productos_elegibilidad WHERE producto_id = ?', [productoId]);
    for (const institucion of extras) {
      await connection.query(
        'INSERT INTO productos_elegibilidad (producto_id, institucion_id, creado_por) VALUES (?, ?, ?)',
        [productoId, institucion, Number(req.usuario.uid)]
      );
    }
    await registrarAuditoriaTransaccional(connection, {
      usuario: req.usuario,
      accion: 'producto_cumplimiento',
      entidad: 'producto',
      entidadId: productoId,
      detalle: {
        antes: { restringido: Boolean(filas[0].restringido), revisionLegal: filas[0].revision_legal },
        despues: { restringido, revisionLegal, institucionesElegibles: extras },
        motivo
      }
    });
    await connection.commit();
    invalidarIndiceCatalogo();
    require('./productos').invalidarCacheCatalogo();
    res.json({ ok: true });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudo actualizar el cumplimiento del producto:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible actualizar el producto.' });
  } finally {
    if (connection) connection.release();
  }
});

// --- Personal administrativo y permisos ---------------------------------------
router.get('/admin/permisos', ...staff, requierePermiso('staff.permisos'), async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT u.id, u.correo, u.fecha_creacion, GROUP_CONCAT(p.permiso ORDER BY p.permiso) AS permisos
       FROM usuarios u LEFT JOIN staff_permisos p ON p.usuario_id = u.id
       WHERE u.rol = 'admin' GROUP BY u.id ORDER BY u.id`
    );
    res.json({
      catalogo: PERMISOS_STAFF,
      personal: filas.map(f => ({ usuarioId: f.id, correo: f.correo, creado: f.fecha_creacion, permisos: String(f.permisos || '').split(',').filter(Boolean) }))
    });
  } catch (err) {
    console.error('[verificacion] No se pudo listar el personal:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible listar el personal.' });
  }
});

function permisosValidos(permisos) {
  return Array.isArray(permisos) && permisos.every(p => Object.prototype.hasOwnProperty.call(PERMISOS_STAFF, p));
}

router.put('/admin/permisos/:usuarioId', ...staff, requierePermiso('staff.permisos'), async (req, res) => {
  const usuarioId = parsearId(req.params.usuarioId);
  const permisos = req.body?.permisos;
  if (!permisosValidos(permisos)) return res.status(400).json({ error: 'Permisos no válidos.' });
  if (usuarioId === Number(req.usuario.uid) && !permisos.includes('staff.permisos')) {
    return res.status(409).json({ error: 'No puedes quitarte a ti mismo el permiso de administrar permisos.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [usuarios] = await connection.query("SELECT id, rol FROM usuarios WHERE id = ? FOR UPDATE", [usuarioId]);
    if (!usuarios.length || usuarios[0].rol !== 'admin') {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuario administrativo no encontrado.' });
    }
    const [actuales] = await connection.query('SELECT permiso FROM staff_permisos WHERE usuario_id = ?', [usuarioId]);
    await connection.query('DELETE FROM staff_permisos WHERE usuario_id = ?', [usuarioId]);
    for (const permiso of new Set(permisos)) {
      await connection.query('INSERT INTO staff_permisos (usuario_id, permiso, otorgado_por) VALUES (?, ?, ?)', [usuarioId, permiso, Number(req.usuario.uid)]);
    }
    await registrarAuditoriaTransaccional(connection, {
      usuario: req.usuario, accion: 'permisos_staff', entidad: 'usuario', entidadId: usuarioId,
      detalle: { antes: actuales.map(a => a.permiso), despues: [...new Set(permisos)] }
    });
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('[verificacion] No se pudieron actualizar permisos:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible actualizar los permisos.' });
  } finally {
    if (connection) connection.release();
  }
});

// Alta de personal administrativo. La persona inicia sesión con MFA por correo
// como cualquier otra cuenta; no se vincula a ningún cliente comprador.
router.post('/admin/personal', ...staff, requierePermiso('staff.permisos'), async (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const password = req.body?.password;
  const permisos = req.body?.permisos || [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254) return res.status(400).json({ error: 'Correo no válido.' });
  if (typeof password !== 'string' || password.length < 12 || password.length > 72) {
    return res.status(400).json({ error: 'La contraseña temporal debe tener entre 12 y 72 caracteres.' });
  }
  if (!permisosValidos(permisos)) return res.status(400).json({ error: 'Permisos no válidos.' });
  let connection;
  try {
    const hash = await bcrypt.hash(password, 12);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [usuario] = await connection.query("INSERT INTO usuarios (correo, password_hash, rol) VALUES (?, ?, 'admin')", [correo, hash]);
    for (const permiso of new Set(permisos)) {
      await connection.query('INSERT INTO staff_permisos (usuario_id, permiso, otorgado_por) VALUES (?, ?, ?)', [usuario.insertId, permiso, Number(req.usuario.uid)]);
    }
    await registrarAuditoriaTransaccional(connection, {
      usuario: req.usuario, accion: 'crear_staff', entidad: 'usuario', entidadId: usuario.insertId,
      detalle: { correo, permisos: [...new Set(permisos)] }
    });
    await connection.commit();
    res.status(201).json({ usuarioId: usuario.insertId });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    console.error('[verificacion] No se pudo crear el usuario administrativo:', err.code || err.message);
    res.status(500).json({ error: 'No fue posible crear el usuario.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
