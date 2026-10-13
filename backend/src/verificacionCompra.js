const crypto = require('crypto');
const { z } = require('zod');
const { cifrar, cifrarEstricto, indiceIdentificador } = require('./crypto');
const { firmarPayload, verificarPayload } = require('./automationSignatures');
const { hashCodigoMfa, compararHashesMfa, generarCodigoMfa } = require('./mfaCodes');
const { dominioCoincide } = require('./registroInstitucional');

// ===========================================================================
// Verificación de identidad y vínculo institucional (ver
// docs/ARQUITECTURA_VERIFICACION.md y docs/POLITICA_VERIFICACION_IDENTIDAD.md)
// ===========================================================================
//
// Una solicitud tiene tres componentes:
//   vinculo_documental   (1ª comprobación) revisión humana de la evidencia
//                        emitida por la institución contra el documento de
//                        identidad declarado.
//   canal_independiente  (2ª comprobación) control de un buzón del dominio
//                        institucional, o confirmación de la institución por
//                        un canal oficial registrada por OTRA persona del equipo.
//   entidad              (auxiliar) la entidad existe y está activa en un
//                        registro público (datos.gov.co, consultado por n8n).
//
// La base de datos guarda resultados; la decisión la toma decidirSolicitud()
// en el backend. n8n solo puede informar el componente 'entidad' y nunca
// aprueba nada.

const RESULTADOS = Object.freeze([
  'pendiente', 'confirmado', 'no_coincide', 'datos_insuficientes', 'fuente_no_disponible', 'respuesta_invalida', 'ambiguo'
]);
const RESULTADOS_STAFF = Object.freeze(['confirmado', 'no_coincide', 'datos_insuficientes', 'ambiguo']);
const COMPONENTES = Object.freeze(['vinculo_documental', 'canal_independiente', 'entidad']);

const METODOS = Object.freeze({
  revision_documental: { componente: 'vinculo_documental', actor: 'staff', permiso: 'verificacion.decidir' },
  correo_institucional: { componente: 'canal_independiente', actor: 'sistema' },
  confirmacion_institucional: { componente: 'canal_independiente', actor: 'staff', permiso: 'verificacion.confirmar_institucion' },
  registro_publico: { componente: 'entidad', actor: 'n8n' },
  revision_manual_entidad: { componente: 'entidad', actor: 'staff', permiso: 'verificacion.decidir' }
});

const FUENTES_REGISTRO_PUBLICO = Object.freeze({
  'datos.gov.co/c82u-588k': 'RUES (Confecámaras)',
  'datos.gov.co/5c7g-ptic': 'CHIP (Contaduría General)'
});

const DIAS_VIGENCIA_SOLICITUD = 30;
const MINUTOS_CODIGO_AUTORIZACION = 10;
const MINUTOS_AUTORIZACION_VIGENTE = 15;
const INTENTOS_CODIGO_AUTORIZACION = 5;
const MAX_INTENTOS_ENTIDAD = 5;

function diasVigenciaVerificacion() {
  const dias = Number(process.env.VERIFICACION_VIGENCIA_DIAS || 365);
  return Number.isSafeInteger(dias) && dias > 0 && dias <= 730 ? dias : 365;
}

// ---------------------------------------------------------------------------
// Identificador personal
// ---------------------------------------------------------------------------
// Solo CC y CE están habilitados. "Placa" (número policial) NO se recoge: el
// negocio no ha definido para qué se necesitaría y la cédula basta para ligar
// la evidencia documental con la persona (ver POLITICA_VERIFICACION_IDENTIDAD.md).
const TIPOS_IDENTIFICADOR = Object.freeze({
  CC: { etiqueta: 'Cédula de ciudadanía', patron: /^\d{4,10}$/ },
  CE: { etiqueta: 'Cédula de extranjería', patron: /^[A-Z0-9]{4,15}$/ }
});

// Normalización documentada: se quitan espacios, puntos y guiones; CE en
// mayúsculas; CC sin ceros a la izquierda (el mismo número escrito "0012345"
// y "12345" debe producir el mismo índice).
function normalizarIdentificador(tipo, numero) {
  if (!Object.prototype.hasOwnProperty.call(TIPOS_IDENTIFICADOR, tipo)) return null;
  let limpio = String(numero || '').replace(/[\s.\-]/g, '').toUpperCase();
  if (tipo === 'CC') limpio = limpio.replace(/^0+/, '');
  return TIPOS_IDENTIFICADOR[tipo].patron.test(limpio) ? limpio : null;
}

async function guardarIdentificador(db, { clienteId, usuarioId, tipo, numero }) {
  const normalizado = normalizarIdentificador(tipo, numero);
  if (!normalizado) return { ok: false, error: 'El número de documento no tiene un formato válido.' };
  const indice = indiceIdentificador(tipo, normalizado);
  await db.query(
    `INSERT INTO identificadores_personales
       (cliente_id, usuario_id, tipo_documento, numero_cifrado, indice_hmac, ultimos_digitos, autorizado_en)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id), tipo_documento = VALUES(tipo_documento),
       numero_cifrado = VALUES(numero_cifrado), indice_hmac = VALUES(indice_hmac),
       ultimos_digitos = VALUES(ultimos_digitos), autorizado_en = NOW()`,
    [clienteId, usuarioId, tipo, cifrarEstricto(normalizado), indice, normalizado.slice(-3)]
  );
  return { ok: true, ultimosDigitos: normalizado.slice(-3) };
}

async function resumenIdentificador(db, clienteId) {
  const [filas] = await db.query(
    `SELECT i.tipo_documento, i.ultimos_digitos, i.autorizado_en,
            (SELECT COUNT(*) FROM identificadores_personales o
              WHERE o.indice_hmac = i.indice_hmac AND o.cliente_id <> i.cliente_id) AS otras_cuentas
     FROM identificadores_personales i WHERE i.cliente_id = ?`,
    [clienteId]
  );
  if (!filas.length) return null;
  return {
    tipo: filas[0].tipo_documento,
    // Solo los tres últimos dígitos: suficiente para que el revisor coteje con
    // el certificado sin exponer el número completo en pantalla.
    enmascarado: `•••••${filas[0].ultimos_digitos}`,
    registradoEn: filas[0].autorizado_en,
    otrasCuentasMismoDocumento: Number(filas[0].otras_cuentas)
  };
}

// ---------------------------------------------------------------------------
// Tabla de decisión
// ---------------------------------------------------------------------------
// Devuelve el estado de la solicitud y si un revisor puede aprobarla. Ningún
// resultado distinto de 'confirmado' puede convertirse en aprobación, y ninguna
// combinación produce un rechazo automático: el rechazo siempre es humano.
function decidirSolicitud(comprobaciones) {
  const por = Object.fromEntries(comprobaciones.map(c => [c.componente, c]));
  const faltantes = COMPONENTES.filter(componente => !por[componente]);
  if (faltantes.length) return { estado: 'requiere_revision', puedeAprobar: false, motivo: 'comprobaciones_incompletas' };

  const resultados = COMPONENTES.map(componente => por[componente].resultado);
  const vinculo = por.vinculo_documental;
  const canal = por.canal_independiente;
  // La segunda comprobación manual debe registrarla una persona distinta de
  // quien hizo la revisión documental (control de cuatro ojos).
  const mismaPersona = canal.actor_tipo === 'staff' && vinculo.actor_tipo === 'staff' &&
    canal.actor_usuario_id && canal.actor_usuario_id === vinculo.actor_usuario_id;

  if (resultados.every(r => r === 'confirmado')) {
    if (mismaPersona) return { estado: 'requiere_revision', puedeAprobar: false, motivo: 'misma_persona_en_ambas_comprobaciones' };
    return { estado: 'requiere_revision', puedeAprobar: true, motivo: 'listo_para_decision' };
  }
  if (resultados.includes('no_coincide')) return { estado: 'requiere_revision', puedeAprobar: false, motivo: 'no_coincidencia' };
  if (resultados.some(r => ['ambiguo', 'respuesta_invalida', 'datos_insuficientes'].includes(r))) {
    return { estado: 'requiere_revision', puedeAprobar: false, motivo: 'resultado_no_concluyente' };
  }
  if (resultados.includes('fuente_no_disponible')) return { estado: 'fuente_no_disponible', puedeAprobar: false, motivo: 'fuente_no_disponible' };
  return { estado: 'en_curso', puedeAprobar: false, motivo: 'comprobaciones_pendientes' };
}

async function cargarComprobaciones(db, solicitudId) {
  const [filas] = await db.query(
    `SELECT id, componente, metodo, resultado, fuente, referencia, observacion, actor_tipo,
            actor_usuario_id, intentos, consultado_en, actualizado_en
     FROM verificacion_comprobaciones WHERE solicitud_id = ? ORDER BY FIELD(componente, 'vinculo_documental', 'canal_independiente', 'entidad')`,
    [solicitudId]
  );
  return filas;
}

async function recalcularSolicitud(db, solicitudId) {
  const comprobaciones = await cargarComprobaciones(db, solicitudId);
  const decision = decidirSolicitud(comprobaciones);
  await db.query(
    `UPDATE solicitudes_verificacion SET estado = ?
     WHERE id = ? AND estado IN ('en_curso','requiere_revision','fuente_no_disponible')`,
    [decision.estado, solicitudId]
  );
  return { ...decision, comprobaciones };
}

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------
// NIT de persona jurídica: base de 9 dígitos que empieza por 8 o 9. Los NIT de
// personas naturales contienen la cédula, así que nunca salen hacia n8n.
function nitPersonaJuridica(nit) {
  const base = String(nit || '').split('-')[0];
  return /^[89]\d{8}$/.test(base) ? base : null;
}

// Cuenta del cliente cuyo correo pertenece al dominio oficial del tipo y que ya
// recibió un código MFA en ese buzón.
function correoInstitucionalVerificado(tipo, usuarios) {
  return usuarios.find(u => u.correo_verificado_en && dominioCoincide(tipo, u.correo)) || null;
}

async function encolarEvento(db, dedupe, evento, { cifrado = false } = {}) {
  const payload = cifrado ? JSON.stringify({ contenido: cifrar(JSON.stringify(evento)) }) : JSON.stringify(evento);
  await db.query(
    'INSERT IGNORE INTO automation_outbox (workflow, dedupe_key, payload, payload_cifrado) VALUES (\'W11\', ?, ?, ?)',
    [dedupe, payload, cifrado]
  );
}

async function solicitudActiva(db, clienteId, { bloquear = false } = {}) {
  const [filas] = await db.query(
    `SELECT * FROM solicitudes_verificacion
     WHERE cliente_id = ? AND estado IN ('en_curso','requiere_revision','fuente_no_disponible')
     ORDER BY id DESC LIMIT 1${bloquear ? ' FOR UPDATE' : ''}`,
    [clienteId]
  );
  return filas[0] || null;
}

// Crea la solicitud y sus tres comprobaciones dentro de la transacción del
// envío. Las que pueden resolverse sin intervención humana se resuelven aquí.
async function crearSolicitud(db, { cliente, usuarioId, usuarios, operacion = 'compra', carritoHash = null, idempotencyKey = null }) {
  if (idempotencyKey) {
    const [previa] = await db.query(
      'SELECT * FROM solicitudes_verificacion WHERE cliente_id = ? AND idempotency_key = ?',
      [cliente.id, idempotencyKey]
    );
    if (previa.length) return { solicitud: previa[0], repetida: true };
  }
  const tipo = cliente.tipo_institucion;
  const ref = crypto.randomBytes(16).toString('hex');
  const [insercion] = await db.query(
    `INSERT INTO solicitudes_verificacion
       (ref, cliente_id, usuario_id, tipo_institucion, operacion, carrito_hash, idempotency_key, expira_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [ref, cliente.id, usuarioId, tipo, operacion, carritoHash, idempotencyKey, DIAS_VIGENCIA_SOLICITUD]
  );
  const solicitudId = insercion.insertId;
  const insertar = (componente, metodo, resultado, { fuente = null, referencia = null, observacion = null, actor = 'sistema' } = {}) => db.query(
    `INSERT INTO verificacion_comprobaciones
       (solicitud_id, componente, metodo, resultado, fuente, referencia, observacion, actor_tipo, consultado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${resultado === 'pendiente' ? 'NULL' : 'NOW()'})`,
    [solicitudId, componente, metodo, resultado, fuente, referencia, observacion, actor]
  );

  await insertar('vinculo_documental', 'revision_documental', 'pendiente');

  const buzon = correoInstitucionalVerificado(tipo, usuarios);
  if (buzon) {
    // Control demostrado (código MFA recibido) de un buzón del dominio oficial de
    // la institución: lo administra la institución, no el solicitante.
    await insertar('canal_independiente', 'correo_institucional', 'confirmado', {
      fuente: `dominio:${String(buzon.correo).split('@').pop()}`,
      observacion: 'Código de acceso recibido en un buzón del dominio institucional.'
    });
  } else {
    await insertar('canal_independiente', 'confirmacion_institucional', 'pendiente', {
      observacion: 'Sin correo institucional verificado: requiere confirmación de la institución por canal oficial.'
    });
  }

  const nit = nitPersonaJuridica(cliente.nit);
  if (nit) {
    await insertar('entidad', 'registro_publico', 'pendiente');
  } else {
    await insertar('entidad', 'revision_manual_entidad', 'datos_insuficientes', {
      observacion: cliente.nit ? 'El NIT no corresponde a una persona jurídica: se verifica manualmente.' : 'Sin NIT registrado.'
    });
  }

  const [[solicitud]] = await db.query('SELECT * FROM solicitudes_verificacion WHERE id = ?', [solicitudId]);
  await recalcularSolicitud(db, solicitudId);
  // A n8n solo viajan la referencia opaca, el tipo y el NIT de la persona
  // jurídica (dato de la entidad, no personal).
  await encolarEvento(db, `verificacion:${ref}:solicitada`, {
    evento: 'verificacion.solicitada',
    ref,
    tipoInstitucion: tipo,
    consultarEntidad: Boolean(nit),
    ...(nit ? { nit } : {}),
    timestamp: new Date().toISOString()
  });
  return { solicitud, repetida: false };
}

async function cerrarSolicitudesActivas(db, clienteId, estado, motivo, actorUsuarioId = null) {
  await db.query(
    `UPDATE solicitudes_verificacion SET estado = ?, motivo = ?, decidida_en = NOW(), decidida_por = ?
     WHERE cliente_id = ? AND estado IN ('en_curso','requiere_revision','fuente_no_disponible')`,
    [estado, motivo ? String(motivo).slice(0, 500) : null, actorUsuarioId, clienteId]
  );
}

async function revocarAutorizacionesCompra(db, clienteId) {
  await db.query(
    "UPDATE autorizaciones_compra SET estado = 'revocada' WHERE cliente_id = ? AND estado IN ('pendiente_codigo','vigente')",
    [clienteId]
  );
}

// Registro de un resultado por parte del personal.
async function registrarComprobacionStaff(db, { solicitud, componente, resultado, referencia, observacion, usuarioId }) {
  if (!RESULTADOS_STAFF.includes(resultado)) return { ok: false, status: 400, error: 'Resultado no válido.' };
  const metodo = {
    vinculo_documental: 'revision_documental',
    canal_independiente: 'confirmacion_institucional',
    entidad: 'revision_manual_entidad'
  }[componente];
  if (!metodo) return { ok: false, status: 400, error: 'Componente no válido.' };
  const [actuales] = await db.query(
    'SELECT * FROM verificacion_comprobaciones WHERE solicitud_id = ? AND componente = ? FOR UPDATE',
    [solicitud.id, componente]
  );
  const actual = actuales[0];
  if (componente === 'canal_independiente' && actual?.metodo === 'correo_institucional' && actual.resultado === 'confirmado') {
    return { ok: false, status: 409, error: 'La segunda comprobación ya está confirmada por el correo institucional.' };
  }
  if (componente === 'entidad' && actual?.metodo === 'registro_publico' && actual.resultado === 'confirmado') {
    return { ok: false, status: 409, error: 'La entidad ya está confirmada en el registro público.' };
  }
  // Cuatro ojos: quien registra una comprobación humana no puede registrar la otra.
  const otra = componente === 'vinculo_documental' ? 'canal_independiente' : componente === 'canal_independiente' ? 'vinculo_documental' : null;
  if (otra && resultado === 'confirmado') {
    const [otras] = await db.query(
      "SELECT actor_usuario_id FROM verificacion_comprobaciones WHERE solicitud_id = ? AND componente = ? AND actor_tipo = 'staff' AND resultado = 'confirmado'",
      [solicitud.id, otra]
    );
    if (otras.length && Number(otras[0].actor_usuario_id) === Number(usuarioId)) {
      return { ok: false, status: 409, error: 'La otra comprobación la registraste tú: esta debe registrarla otra persona del equipo.' };
    }
  }
  if ((componente !== 'vinculo_documental' || resultado !== 'confirmado') && !referencia && !observacion) {
    return { ok: false, status: 400, error: 'Indica la referencia o una observación que respalde el resultado.' };
  }
  if (componente === 'canal_independiente' && resultado === 'confirmado' && !referencia) {
    return { ok: false, status: 400, error: 'Indica la referencia de la confirmación institucional (número de oficio, radicado o canal usado).' };
  }
  await db.query(
    `UPDATE verificacion_comprobaciones
     SET metodo = ?, resultado = ?, referencia = ?, observacion = ?, actor_tipo = 'staff',
         actor_usuario_id = ?, consultado_en = NOW(), fuente = ?
     WHERE solicitud_id = ? AND componente = ?`,
    [metodo, resultado, referencia || null, observacion || null, usuarioId,
      componente === 'entidad' ? 'revision_manual' : null, solicitud.id, componente]
  );
  return { ok: true, ...(await recalcularSolicitud(db, solicitud.id)) };
}

// ---------------------------------------------------------------------------
// Respuestas de n8n (componente 'entidad')
// ---------------------------------------------------------------------------
const esquemaResultadoN8n = z.object({
  ref: z.string().regex(/^[a-f0-9]{32}$/),
  componente: z.literal('entidad'),
  metodo: z.literal('registro_publico'),
  resultado: z.enum(['confirmado', 'no_coincide', 'datos_insuficientes', 'fuente_no_disponible', 'respuesta_invalida', 'ambiguo']),
  fuente: z.enum(Object.keys(FUENTES_REGISTRO_PUBLICO)).nullable(),
  consultadoEn: z.string().datetime(),
  nonce: z.string().regex(/^[a-f0-9]{32,64}$/)
}).strict();

function secretoRespuestasN8n() {
  return process.env.N8N_W11_CALLBACK_SECRET || '';
}

// Valida procedencia (HMAC con secreto propio del canal de vuelta), vigencia
// (±5 min), esquema estricto, no repetición (nonce) y correspondencia con una
// comprobación que esperaba exactamente ese resultado. Nada aquí aprueba.
async function aplicarResultadoN8n(db, { payload, headers }) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { status: 400, error: 'Solicitud inválida.' };
  if (!verificarPayload(payload, headers, secretoRespuestasN8n())) return { status: 401, error: 'Firma no válida.' };
  const parse = esquemaResultadoN8n.safeParse(payload);
  if (!parse.success) return { status: 400, error: 'Resultado con formato no válido.' };
  const datos = parse.data;
  if (datos.resultado === 'confirmado' && !datos.fuente) return { status: 400, error: 'Un resultado confirmado debe indicar la fuente.' };
  const edad = Date.now() - Date.parse(datos.consultadoEn);
  if (edad < -60_000 || edad > 15 * 60_000) return { status: 400, error: 'La consulta informada no es reciente.' };

  try {
    await db.query('INSERT INTO automation_nonces (nonce) VALUES (?)', [datos.nonce]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { status: 409, error: 'Mensaje repetido.' };
    throw err;
  }
  const [solicitudes] = await db.query(
    `SELECT * FROM solicitudes_verificacion WHERE ref = ? AND expira_en > NOW()
       AND estado IN ('en_curso','requiere_revision','fuente_no_disponible') FOR UPDATE`,
    [datos.ref]
  );
  if (!solicitudes.length) return { status: 404, error: 'Solicitud no encontrada o cerrada.' };
  const solicitud = solicitudes[0];
  const [actualizacion] = await db.query(
    `UPDATE verificacion_comprobaciones
     SET resultado = ?, fuente = ?, actor_tipo = 'n8n', actor_usuario_id = NULL,
         consultado_en = ?, intentos = intentos + 1,
         observacion = ?
     WHERE solicitud_id = ? AND componente = 'entidad' AND metodo = 'registro_publico'
       AND resultado IN ('pendiente','fuente_no_disponible','respuesta_invalida')`,
    [datos.resultado, datos.fuente, new Date(datos.consultadoEn), datos.fuente ? FUENTES_REGISTRO_PUBLICO[datos.fuente] : null, solicitud.id]
  );
  if (actualizacion.affectedRows !== 1) return { status: 409, error: 'La comprobación no espera un resultado automático.' };
  const decision = await recalcularSolicitud(db, solicitud.id);
  return { status: 200, cuerpo: { ok: true, estado: decision.estado } };
}

// ---------------------------------------------------------------------------
// Mantenimiento (lo invoca n8n W11 programado o el job interno)
// ---------------------------------------------------------------------------
async function procesarMantenimiento(pool) {
  const resumen = { reintentosEntidad: 0, solicitudesExpiradas: 0, autorizacionesExpiradas: 0 };
  // Reintento de consultas de entidad sin respuesta o con la fuente caída.
  const [pendientes] = await pool.query(
    `SELECT s.ref, s.tipo_institucion, c.nit, vc.id, vc.intentos
     FROM verificacion_comprobaciones vc
     JOIN solicitudes_verificacion s ON s.id = vc.solicitud_id
     JOIN clientes c ON c.id = s.cliente_id
     WHERE vc.componente = 'entidad' AND vc.metodo = 'registro_publico'
       AND vc.resultado IN ('pendiente','fuente_no_disponible','respuesta_invalida')
       AND vc.actualizado_en < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       AND s.estado IN ('en_curso','requiere_revision','fuente_no_disponible') AND s.expira_en > NOW()
     LIMIT 50`
  );
  for (const p of pendientes) {
    if (Number(p.intentos) >= MAX_INTENTOS_ENTIDAD) {
      // Agotados los reintentos, la fuente se considera no disponible y un
      // revisor puede registrar la entidad manualmente.
      await pool.query(
        "UPDATE verificacion_comprobaciones SET resultado = 'fuente_no_disponible', observacion = 'Reintentos agotados: verificar la entidad manualmente.' WHERE id = ? AND resultado <> 'fuente_no_disponible'",
        [p.id]
      );
      continue;
    }
    const nit = nitPersonaJuridica(p.nit);
    if (!nit) continue;
    await pool.query('UPDATE verificacion_comprobaciones SET intentos = intentos + 1 WHERE id = ?', [p.id]);
    await encolarEvento(pool, `verificacion:${p.ref}:entidad:${Number(p.intentos) + 1}`, {
      evento: 'verificacion.solicitada', ref: p.ref, tipoInstitucion: p.tipo_institucion,
      consultarEntidad: true, nit, timestamp: new Date().toISOString()
    });
    resumen.reintentosEntidad += 1;
  }
  const [expiradas] = await pool.query(
    `SELECT id, cliente_id FROM solicitudes_verificacion
     WHERE estado IN ('en_curso','requiere_revision','fuente_no_disponible') AND expira_en <= NOW() LIMIT 100`
  );
  for (const s of expiradas) {
    await pool.query("UPDATE solicitudes_verificacion SET estado = 'expirada', motivo = 'Sin decisión dentro del plazo.' WHERE id = ?", [s.id]);
    await pool.query(
      "UPDATE clientes SET estado_verificacion = 'requiere_informacion', motivo_estado = 'La solicitud expiró sin decisión; vuelve a enviarla.' WHERE id = ? AND estado_verificacion = 'pendiente'",
      [s.cliente_id]
    );
    resumen.solicitudesExpiradas += 1;
  }
  const [autorizaciones] = await pool.query(
    "UPDATE autorizaciones_compra SET estado = 'expirada' WHERE estado IN ('pendiente_codigo','vigente') AND expira_en <= NOW()"
  );
  resumen.autorizacionesExpiradas = autorizaciones.affectedRows;
  await pool.query('DELETE FROM automation_nonces WHERE recibido_en < DATE_SUB(NOW(), INTERVAL 1 DAY)');
  return resumen;
}

// ---------------------------------------------------------------------------
// Autorización de compra por operación
// ---------------------------------------------------------------------------
// Huella del contenido del carrito: mismos productos y cantidades, sin importar
// el orden ni la variación (la variación no cambia la elegibilidad).
function hashCarrito(lineas) {
  const totales = new Map();
  for (const { id, cantidad } of lineas) totales.set(Number(id), (totales.get(Number(id)) || 0) + Number(cantidad));
  const canonico = [...totales.entries()].sort((a, b) => a[0] - b[0]);
  return crypto.createHash('sha256').update(JSON.stringify(canonico)).digest('hex');
}

async function crearAutorizacionCompra(db, { ctx, carritoHash }) {
  const [aprobadas] = await db.query(
    "SELECT id FROM solicitudes_verificacion WHERE cliente_id = ? AND estado = 'aprobada' ORDER BY decidida_en DESC, id DESC LIMIT 1",
    [ctx.clienteId]
  );
  if (!aprobadas.length) return { ok: false, status: 403, code: 'REQUIERE_VERIFICACION', error: 'Tu cuenta necesita una verificación aprobada para comprar productos restringidos.' };
  const [recientes] = await db.query(
    'SELECT COUNT(*) AS total FROM autorizaciones_compra WHERE usuario_id = ? AND creado_en > DATE_SUB(NOW(), INTERVAL 15 MINUTE)',
    [ctx.usuarioId]
  );
  if (Number(recientes[0].total) >= 5) return { ok: false, status: 429, error: 'Demasiadas solicitudes de autorización. Espera unos minutos.' };
  await db.query(
    "UPDATE autorizaciones_compra SET estado = 'revocada' WHERE usuario_id = ? AND estado = 'pendiente_codigo'",
    [ctx.usuarioId]
  );
  const ref = crypto.randomBytes(32).toString('hex');
  const codigo = generarCodigoMfa();
  await db.query(
    `INSERT INTO autorizaciones_compra (ref, usuario_id, cliente_id, solicitud_id, carrito_hash, codigo_hash, expira_en)
     VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [ref, ctx.usuarioId, ctx.clienteId, aprobadas[0].id, carritoHash, hashCodigoMfa(`compra:${ref}`, ctx.usuarioId, codigo), MINUTOS_CODIGO_AUTORIZACION]
  );
  return { ok: true, ref, codigo, vigenciaMinutos: MINUTOS_CODIGO_AUTORIZACION };
}

async function confirmarAutorizacionCompra(db, { ref, codigo, usuarioId }) {
  const [filas] = await db.query(
    'SELECT *, (expira_en > NOW()) AS vigente FROM autorizaciones_compra WHERE ref = ? AND usuario_id = ? FOR UPDATE',
    [ref, usuarioId]
  );
  const fila = filas[0];
  if (!fila || fila.estado !== 'pendiente_codigo') return { ok: false, status: 404, error: 'La autorización no existe o ya no está disponible.' };
  if (!fila.vigente) {
    await db.query("UPDATE autorizaciones_compra SET estado = 'expirada' WHERE id = ?", [fila.id]);
    return { ok: false, status: 410, error: 'El código expiró. Solicita uno nuevo.' };
  }
  const correcto = compararHashesMfa(fila.codigo_hash, hashCodigoMfa(`compra:${ref}`, usuarioId, codigo));
  if (!correcto) {
    const restantes = INTENTOS_CODIGO_AUTORIZACION - Number(fila.intentos) - 1;
    await db.query(
      "UPDATE autorizaciones_compra SET intentos = intentos + 1, estado = IF(intentos + 1 >= ?, 'bloqueada', estado) WHERE id = ?",
      [INTENTOS_CODIGO_AUTORIZACION, fila.id]
    );
    return { ok: false, status: 401, error: restantes > 0 ? `El código no coincide. Te quedan ${restantes} intento(s).` : 'Se agotaron los intentos. Solicita una nueva autorización.' };
  }
  await db.query(
    "UPDATE autorizaciones_compra SET estado = 'vigente', confirmada_en = NOW(), expira_en = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
    [MINUTOS_AUTORIZACION_VIGENTE, fila.id]
  );
  return { ok: true, vigenciaMinutos: MINUTOS_AUTORIZACION_VIGENTE };
}

// Dentro de la transacción del checkout: valida que la autorización pertenezca
// a este usuario y cliente, al mismo carrito, siga vigente y su solicitud siga
// aprobada; la marca consumida para que no se reutilice.
async function consumirAutorizacionCompra(db, { ref, ctx, carritoHash }) {
  if (typeof ref !== 'string' || !/^[a-f0-9]{64}$/.test(ref)) return { ok: false, motivo: 'falta' };
  const [filas] = await db.query(
    `SELECT a.id, a.usuario_id, a.cliente_id, a.carrito_hash, a.estado, (a.expira_en > NOW()) AS vigente,
            s.estado AS estado_solicitud
     FROM autorizaciones_compra a JOIN solicitudes_verificacion s ON s.id = a.solicitud_id
     WHERE a.ref = ? FOR UPDATE`,
    [ref]
  );
  const fila = filas[0];
  if (!fila || Number(fila.usuario_id) !== ctx.usuarioId || Number(fila.cliente_id) !== ctx.clienteId) return { ok: false, motivo: 'no_corresponde' };
  if (fila.estado !== 'vigente' || !fila.vigente) return { ok: false, motivo: 'no_vigente' };
  if (fila.estado_solicitud !== 'aprobada') return { ok: false, motivo: 'verificacion_no_vigente' };
  if (fila.carrito_hash !== carritoHash) return { ok: false, motivo: 'carrito_distinto' };
  await db.query("UPDATE autorizaciones_compra SET estado = 'consumida', consumida_en = NOW() WHERE id = ? AND estado = 'vigente'", [fila.id]);
  return { ok: true, id: fila.id };
}

async function vincularAutorizacionPedido(db, autorizacionId, pedidoId) {
  await db.query('UPDATE autorizaciones_compra SET pedido_id = ? WHERE id = ?', [pedidoId, autorizacionId]);
}

module.exports = {
  RESULTADOS,
  RESULTADOS_STAFF,
  COMPONENTES,
  METODOS,
  FUENTES_REGISTRO_PUBLICO,
  TIPOS_IDENTIFICADOR,
  diasVigenciaVerificacion,
  normalizarIdentificador,
  guardarIdentificador,
  resumenIdentificador,
  decidirSolicitud,
  cargarComprobaciones,
  recalcularSolicitud,
  nitPersonaJuridica,
  crearSolicitud,
  solicitudActiva,
  cerrarSolicitudesActivas,
  revocarAutorizacionesCompra,
  registrarComprobacionStaff,
  aplicarResultadoN8n,
  procesarMantenimiento,
  encolarEvento,
  hashCarrito,
  crearAutorizacionCompra,
  confirmarAutorizacionCompra,
  consumirAutorizacionCompra,
  vincularAutorizacionPedido,
  firmarPayload
};
