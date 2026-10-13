const { pool } = require('./db');
const { datosPublicosInvitado } = require('./tenancy');

// Servicio central de autorización del comprador.
//
// El JWT solo identifica a la persona (uid + versión de sesión). Estado de
// verificación, institución aprobada y autorización de restringidos se leen de
// MySQL en cada decisión, de modo que aprobar, rechazar o suspender una cuenta
// surte efecto en la siguiente petición aunque el token siga vigente.

const PERMISOS_STAFF = Object.freeze({
  'verificacion.ver': 'Consultar solicitudes de registro y sus datos',
  'verificacion.decidir': 'Aprobar, rechazar o pedir información adicional',
  'documentos.ver': 'Descargar documentos de acreditación',
  'cuentas.suspender': 'Suspender y reactivar cuentas',
  'restringidos.autorizar': 'Conceder o revocar la autorización de productos restringidos',
  'productos.cumplimiento': 'Configurar elegibilidad, restricción y revisión legal de productos',
  'staff.permisos': 'Asignar permisos administrativos'
});

const ESTADOS_VERIFICACION = Object.freeze([
  'borrador', 'pendiente', 'requiere_informacion', 'aprobado', 'rechazado', 'suspendido'
]);

const REVISION_QUE_BLOQUEA_VENTA = new Set(['pendiente', 'bloqueada']);

const CONTEXTO_INVITADO = Object.freeze({
  autenticado: false,
  staff: false,
  aprobado: false,
  institucion: null,
  autorizadoRestringidos: false,
  estado: null
});

async function obtenerPermisosStaff(usuarioId, db = pool) {
  const [filas] = await db.query('SELECT permiso FROM staff_permisos WHERE usuario_id = ?', [usuarioId]);
  return new Set(filas.map(fila => fila.permiso));
}

// Construye el contexto a partir de la base de datos. `bloquear` se usa dentro
// de transacciones (checkout) para leer la fila del cliente con FOR UPDATE.
async function obtenerContexto(usuarioToken, { db = pool, bloquear = false } = {}) {
  if (!usuarioToken) return CONTEXTO_INVITADO;
  const usuarioId = Number(usuarioToken.uid);
  if (!Number.isSafeInteger(usuarioId) || usuarioId < 1) return CONTEXTO_INVITADO;

  const [filas] = await db.query(
    `SELECT u.id, u.rol, u.cliente_id, u.correo_verificado_en,
            c.estado_verificacion, c.institucion_aprobada, c.tipo_institucion,
            c.autorizacion_general
     FROM usuarios u
     LEFT JOIN clientes c ON c.id = u.cliente_id
     WHERE u.id = ?${bloquear ? ' FOR UPDATE' : ''}`,
    [usuarioId]
  );
  const fila = filas[0];
  if (!fila || !fila.id) return CONTEXTO_INVITADO;

  if (fila.rol === 'admin') {
    return {
      autenticado: true,
      staff: true,
      usuarioId,
      permisos: await obtenerPermisosStaff(usuarioId, db),
      aprobado: false,
      institucion: null,
      autorizadoRestringidos: false,
      estado: null
    };
  }

  const aprobado = Boolean(fila.cliente_id) && fila.estado_verificacion === 'aprobado' && Boolean(fila.institucion_aprobada);
  return {
    autenticado: true,
    staff: false,
    usuarioId,
    clienteId: fila.cliente_id ? Number(fila.cliente_id) : null,
    estado: fila.cliente_id ? fila.estado_verificacion || 'pendiente' : null,
    tipoInstitucion: fila.tipo_institucion || null,
    correoVerificado: Boolean(fila.correo_verificado_en),
    aprobado,
    institucion: aprobado ? fila.institucion_aprobada : null,
    autorizadoRestringidos: aprobado && Boolean(fila.autorizacion_general)
  };
}

function leerMetadatos(producto) {
  if (!producto.metadatos) return null;
  if (typeof producto.metadatos === 'object') return producto.metadatos;
  try {
    return JSON.parse(producto.metadatos);
  } catch {
    return null;
  }
}

function institucionesElegibles(producto) {
  const extra = Array.isArray(producto.instituciones_elegibles)
    ? producto.instituciones_elegibles
    : String(producto.instituciones_elegibles || '').split(',').filter(Boolean);
  return new Set([producto.institucion_id, ...extra]);
}

function esElegible(producto, institucion) {
  if (!institucion) return false;
  const elegibles = institucionesElegibles(producto);
  return elegibles.has('general') || elegibles.has(institucion);
}

// Decide qué puede hacer el contexto con un producto.
//   visible:     si el producto existe para este usuario (si no: 404 / omitido)
//   nivel:       'completo' (precio, inventario) o 'vitrina' (nombre e imagen)
//   puedeComprar y motivo: para el carrito, el checkout y los mensajes de UI
function evaluarProducto(producto, ctx) {
  const oculto = { visible: false, nivel: null, puedeComprar: false, motivo: 'no_disponible' };
  if (!producto) return oculto;
  if (ctx.staff) return { visible: true, nivel: 'completo', puedeComprar: false, motivo: 'personal_administrativo' };
  if (producto.estado !== 'activo') return oculto;

  const revision = producto.revision_legal || 'no_requerida';
  const restringido = producto.restringido === true || Number(producto.restringido) === 1;
  const elegible = ctx.aprobado && esElegible(producto, ctx.institucion);

  // Un producto restringido ni siquiera se revela a quien no esté aprobado y
  // sea elegible: no aparece en listados, búsquedas, asistente ni detalle.
  if (restringido && !elegible) return oculto;
  if (revision === 'bloqueada') return oculto;

  if (!ctx.aprobado) {
    return {
      visible: true,
      nivel: 'vitrina',
      puedeComprar: false,
      motivo: ctx.autenticado ? 'cuenta_no_aprobada' : 'requiere_login'
    };
  }
  if (!elegible) return oculto;

  let motivo = null;
  if (REVISION_QUE_BLOQUEA_VENTA.has(revision)) motivo = 'revision_legal_pendiente';
  else if (restringido && !ctx.autorizadoRestringidos) motivo = 'requiere_autorizacion_restringidos';
  else if (leerMetadatos(producto)?.cotizacion_requerida === true) motivo = 'cotizacion_requerida';
  return { visible: true, nivel: 'completo', puedeComprar: motivo === null, motivo };
}

// Forma de un producto que viaja al navegador según la decisión anterior.
function presentarProducto(producto, decision) {
  const { instituciones_elegibles: _extra, ...resto } = producto;
  const base = decision.nivel === 'vitrina' ? datosPublicosInvitado(resto) : resto;
  if (decision.nivel === 'vitrina') delete base.revision_legal;
  return {
    ...base,
    acceso: { nivel: decision.nivel, puedeComprar: decision.puedeComprar, motivo: decision.motivo }
  };
}

function claveCache(ctx) {
  if (ctx.staff) return 'staff';
  if (!ctx.autenticado) return 'invitado';
  if (!ctx.aprobado) return 'no_aprobado';
  return `aprobado:${ctx.institucion}:${ctx.autorizadoRestringidos ? 'r' : 'nr'}`;
}

// Middleware: exige el permiso administrativo indicado, leído de la base de
// datos (no del token). Debe ir después de requiereAutenticacion.
function requierePermiso(...permisos) {
  return async (req, res, next) => {
    try {
      const ctx = await obtenerContexto(req.usuario);
      if (!ctx.staff) return res.status(403).json({ error: 'Acceso restringido: solo personal administrativo.' });
      const faltante = permisos.find(permiso => !ctx.permisos.has(permiso));
      if (faltante) {
        return res.status(403).json({ error: 'Tu rol administrativo no tiene permiso para esta acción.', permisoRequerido: faltante });
      }
      req.contextoStaff = ctx;
      return next();
    } catch (err) {
      console.error('[autorizacion] No se pudo verificar el permiso:', err.code || 'PERMISSION_CHECK_FAILED');
      return res.status(503).json({ error: 'No fue posible verificar tus permisos temporalmente.' });
    }
  };
}

module.exports = {
  PERMISOS_STAFF,
  ESTADOS_VERIFICACION,
  CONTEXTO_INVITADO,
  obtenerContexto,
  obtenerPermisosStaff,
  evaluarProducto,
  presentarProducto,
  esElegible,
  claveCache,
  requierePermiso
};
