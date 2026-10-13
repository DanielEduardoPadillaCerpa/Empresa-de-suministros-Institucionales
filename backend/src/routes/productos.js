const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../db');
const { requiereAutenticacion, autenticacionOpcional, requiereAdmin } = require('./auth');
const { registrarAuditoria } = require('../auditoria');
const { invalidarIndiceCatalogo } = require('../assistant/indiceCatalogo');
const { institucionValida } = require('../tenancy');
const {
  obtenerContexto,
  obtenerPermisosStaff,
  evaluarProducto,
  presentarProducto,
  claveCache
} = require('../autorizacion');

// Los formularios multipart envían booleanos como texto ("false" es truthy).
function aBooleano(valor) {
  return valor === true || valor === 1 || ['true', '1', 'on'].includes(String(valor).toLowerCase());
}

// Restricción e institución de un producto definen quién puede comprarlo:
// cambiarlas exige el permiso de cumplimiento, no basta con ser administrador.
async function puedeCambiarReglasProducto(req) {
  const permisos = await obtenerPermisosStaff(Number(req.usuario.uid));
  return permisos.has('productos.cumplimiento');
}

// Umbral por defecto para considerar "inventario bajo" (configurable por .env)
const STOCK_MINIMO = Number(process.env.STOCK_MINIMO || 10);
const CATALOGO_CACHE_MS = 5_000;
const catalogoCache = new Map();

function invalidarCacheCatalogo() {
  catalogoCache.clear();
  invalidarIndiceCatalogo();
}

const IMAGENES_DIR = path.join(__dirname, '../../img/productos');
const TIPOS_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
async function leerMultipart(req) {
  if (!String(req.headers['content-type'] || '').startsWith('multipart/form-data')) return;
  const match = req.headers['content-type'].match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw Object.assign(new Error('Formulario multipart invalido'), { status: 400 });
  const chunks = []; let total = 0;
  for await (const chunk of req) { total += chunk.length; if (total > 6 * 1024 * 1024) throw Object.assign(new Error('Archivo demasiado grande'), { status: 413 }); chunks.push(chunk); }
  const body = Buffer.concat(chunks); const boundary = Buffer.from('--' + (match[1] || match[2]));
  const campos = {}; let archivo = null;
  for (const parte of splitBuffer(body, boundary).slice(1)) {
    const fin = parte.indexOf(Buffer.from('\r\n\r\n')); if (fin < 0) continue;
    const cabeceras = parte.subarray(0, fin).toString('utf8');
    let contenido = parte.subarray(fin + 4); if (contenido.subarray(-2).toString() === '\r\n') contenido = contenido.subarray(0, -2);
    const nombre = (cabeceras.match(/name="([^"]+)"/) || [])[1]; if (!nombre) continue;
    const nombreArchivo = (cabeceras.match(/filename="([^"]*)"/) || [])[1];
    if (!nombreArchivo) { campos[nombre] = contenido.toString('utf8'); continue; }
    const tipo = (cabeceras.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1] || '';
    if (!TIPOS_IMAGEN.has(tipo) || contenido.length > 5 * 1024 * 1024) throw Object.assign(new Error('Imagen no valida. Usa JPG, PNG, WEBP o GIF de maximo 5 MB.'), { status: 400 });
    await fs.promises.mkdir(IMAGENES_DIR, { recursive: true });
    const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[tipo];
    const nombreSeguro = crypto.randomBytes(12).toString('hex') + ext;
    await fs.promises.writeFile(path.join(IMAGENES_DIR, nombreSeguro), contenido);
    archivo = '/img/productos/' + nombreSeguro;
  }
  req.body = campos; if (archivo) req.fileImagePath = archivo;
}
function splitBuffer(buffer, separator) {
  const partes = []; let inicio = 0; let posicion;
  while ((posicion = buffer.indexOf(separator, inicio)) !== -1) { partes.push(buffer.subarray(inicio, posicion)); inicio = posicion + separator.length; }
  partes.push(buffer.subarray(inicio)); return partes;
}
function incluirInactivosSiAdmin(req, res, next) {
  if (req.query.incluir_inactivos !== '1') return next();
  return requiereAutenticacion(req, res, () => requiereAdmin(req, res, next));
}


const COLUMNAS_PRODUCTO = `p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.cantidad_disponible, p.estado,
       p.restringido, p.categoria_id, p.macrocategoria, p.institucion_id, p.metadatos, p.fecha_creacion,
       p.revision_legal, GROUP_CONCAT(e.institucion_id ORDER BY e.institucion_id) AS instituciones_elegibles`;

function normalizarElegibles(producto) {
  return {
    ...producto,
    instituciones_elegibles: String(producto.instituciones_elegibles || '').split(',').filter(Boolean)
  };
}

// GET /api/productos -> catálogo según el contexto del solicitante.
// Visitantes y cuentas no aprobadas: vitrina (sin precio ni inventario) y sin
// productos restringidos. Cuentas aprobadas: su institución + 'general' + los
// productos donde su institución es elegible. Staff: todo (incluir_inactivos=1).
// La decisión la toma autorizacion.evaluarProducto con datos leídos de MySQL.
router.get('/', autenticacionOpcional, incluirInactivosSiAdmin, async (req, res) => {
  try {
    const categoriaId = req.query.categoria_id;
    if (categoriaId !== undefined && !/^\d{1,9}$/.test(String(categoriaId))) {
      return res.status(400).json({ error: 'Categoría inválida.' });
    }
    const incluirInactivos = req.query.incluir_inactivos === '1';
    const ctx = await obtenerContexto(req.usuario);
    const cacheKey = `${claveCache(ctx)}:${categoriaId || 'todos'}`;
    const cacheEntry = incluirInactivos || ctx.staff ? null : catalogoCache.get(cacheKey);
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      return res.json(cacheEntry.products);
    }

    const condiciones = [];
    const params = [];
    if (!incluirInactivos) condiciones.push("p.estado = 'activo'");
    if (categoriaId) {
      condiciones.push('p.categoria_id = ?');
      params.push(Number(categoriaId));
    }
    const [filas] = await pool.query(
      `SELECT ${COLUMNAS_PRODUCTO}
       FROM productos p
       LEFT JOIN productos_elegibilidad e ON e.producto_id = p.id
       ${condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : ''}
       GROUP BY p.id
       ORDER BY p.nombre ASC`,
      params
    );

    const productos = [];
    for (const fila of filas.map(normalizarElegibles)) {
      const decision = evaluarProducto(fila, ctx);
      if (!decision.visible) continue;
      productos.push(ctx.staff ? { ...fila, acceso: { nivel: 'completo', puedeComprar: false, motivo: decision.motivo } } : presentarProducto(fila, decision));
    }
    if (!incluirInactivos && !ctx.staff) {
      catalogoCache.set(cacheKey, { products: productos, expiresAt: Date.now() + CATALOGO_CACHE_MS });
    }
    res.json(productos);
  } catch (err) {
    console.error('[productos] Error cargando el catálogo:', err.code || err.message);
    res.status(500).json({ error: 'Error cargando productos' });
  }
});

// GET /api/productos/bajo-inventario -> productos por debajo del umbral mínimo (solo admin)
// IMPORTANTE: declarada ANTES de '/:id', porque Express prueba las rutas en
// orden y '/:id' interpretaría "bajo-inventario" como si fuera un ID.
router.get('/bajo-inventario', requiereAutenticacion, requiereAdmin, async (req, res) => {
  try {
    const umbral = req.query.umbral ? Number(req.query.umbral) : STOCK_MINIMO;
    const [filas] = await pool.query(
      `SELECT id, nombre, cantidad_disponible, categoria_id
       FROM productos
       WHERE estado = 'activo' AND cantidad_disponible <= ?
       ORDER BY cantidad_disponible ASC`,
      [umbral]
    );
    res.json({ umbral, productos: filas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error consultando inventario bajo' });
  }
});

// GET /api/productos/:id -> detalle. Un producto que el solicitante no puede
// ver responde 404 igual que uno inexistente, para no revelar su existencia.
router.get('/:id', autenticacionOpcional, async (req, res) => {
  try {
    if (!/^\d{1,9}$/.test(req.params.id)) return res.status(404).json({ error: 'Producto no encontrado' });
    const [filas] = await pool.query(
      `SELECT ${COLUMNAS_PRODUCTO}
       FROM productos p
       LEFT JOIN productos_elegibilidad e ON e.producto_id = p.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [Number(req.params.id)]
    );
    const producto = filas.length ? normalizarElegibles(filas[0]) : null;
    const ctx = await obtenerContexto(req.usuario);
    const decision = evaluarProducto(producto, ctx);
    if (!decision.visible) return res.status(404).json({ error: 'Producto no encontrado' });
    if (ctx.staff) return res.json({ ...producto, acceso: { nivel: 'completo', puedeComprar: false, motivo: decision.motivo } });
    res.json(presentarProducto(producto, decision));
  } catch (err) {
    console.error('[productos] Error consultando producto:', err.code || err.message);
    res.status(500).json({ error: 'Error consultando producto' });
  }
});

// POST /api/productos -> crear producto (solo admin)
router.post('/', requiereAutenticacion, requiereAdmin, async (req, res) => {
  try { await leerMultipart(req); } catch (err) { return res.status(err.status || 400).json({ error: err.message }); }
  try {
    const { nombre, descripcion, precio, imagen: imagenRecibida, cantidad_disponible, estado, restringido, categoria_id, macrocategoria, institucion_id, metadatos } = req.body;
    const imagen = req.fileImagePath || imagenRecibida;

    if (!nombre || precio === undefined || precio === null) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }
    const institucion = institucion_id || 'policia';
    if (!institucionValida(institucion)) {
      return res.status(400).json({ error: 'La institución asignada al producto no es válida.' });
    }
    const esRestringido = aBooleano(restringido);
    if (esRestringido && !await puedeCambiarReglasProducto(req)) {
      return res.status(403).json({ error: 'Crear productos restringidos requiere el permiso de cumplimiento.' });
    }

    let metadatosObjeto = metadatos;
    if (typeof metadatos === 'string') { try { metadatosObjeto = JSON.parse(metadatos); } catch (err) { metadatosObjeto = null; } }
    const metadatosJson = metadatosObjeto && typeof metadatosObjeto === 'object' ? JSON.stringify(metadatosObjeto) : null;

    // Un producto restringido nace sin venta hasta su revisión legal.
    const [resultado] = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, imagen, cantidad_disponible, estado, restringido, categoria_id, macrocategoria, institucion_id, metadatos, revision_legal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion || null,
        Number(precio),
        imagen || null,
        Number(cantidad_disponible) || 0,
        estado === 'inactivo' ? 'inactivo' : 'activo',
        esRestringido,
        categoria_id || null,
        ['vestimenta', 'herramientas'].includes(macrocategoria) ? macrocategoria : 'general',
        institucion,
        metadatosJson,
        esRestringido ? 'pendiente' : 'no_requerida',
      ]
    );
    invalidarCacheCatalogo();

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'crear',
      entidad: 'producto',
      entidadId: resultado.insertId,
      detalle: { nombre, precio },
    });

    res.status(201).json({ id: resultado.insertId, nombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// PUT /api/productos/:id -> editar producto (solo admin)
router.put('/:id', requiereAutenticacion, requiereAdmin, async (req, res) => {
  try { await leerMultipart(req); } catch (err) { return res.status(err.status || 400).json({ error: err.message }); }
  try {
    const { nombre, descripcion, precio, imagen: imagenRecibida, cantidad_disponible, estado, restringido, categoria_id, macrocategoria, institucion_id, metadatos } = req.body;
    const imagen = req.fileImagePath || imagenRecibida;

    const [existente] = await pool.query('SELECT id, institucion_id, restringido, revision_legal FROM productos WHERE id = ?', [req.params.id]);
    if (!existente.length) return res.status(404).json({ error: 'Producto no encontrado' });
    const institucion = institucion_id || existente[0].institucion_id;
    if (!institucionValida(institucion)) {
      return res.status(400).json({ error: 'La institución asignada al producto no es válida.' });
    }
    const eraRestringido = aBooleano(existente[0].restringido);
    const esRestringido = restringido === undefined ? eraRestringido : aBooleano(restringido);
    const cambiaReglas = esRestringido !== eraRestringido || institucion !== existente[0].institucion_id;
    if (cambiaReglas && !await puedeCambiarReglasProducto(req)) {
      return res.status(403).json({ error: 'Cambiar la restricción o la institución de un producto requiere el permiso de cumplimiento.' });
    }
    const revisionLegal = esRestringido && !eraRestringido ? 'pendiente' : existente[0].revision_legal || 'no_requerida';

    let metadatosObjeto = metadatos;
    if (typeof metadatos === 'string') { try { metadatosObjeto = JSON.parse(metadatos); } catch (err) { metadatosObjeto = null; } }
    const metadatosJson = metadatosObjeto && typeof metadatosObjeto === 'object' ? JSON.stringify(metadatosObjeto) : null;

    await pool.query(
      `UPDATE productos SET
         nombre = ?,
         descripcion = ?,
         precio = ?,
         imagen = COALESCE(?, imagen),
         cantidad_disponible = ?,
         estado = ?,
         restringido = ?,
         categoria_id = ?,
         macrocategoria = ?,
         institucion_id = ?,
         metadatos = ?,
         revision_legal = ?
       WHERE id = ?`,
      [
        nombre,
        descripcion || null,
        Number(precio),
        imagen || null,
        Number(cantidad_disponible) || 0,
        estado === 'inactivo' ? 'inactivo' : 'activo',
        esRestringido,
        categoria_id || null,
        ['vestimenta', 'herramientas'].includes(macrocategoria) ? macrocategoria : 'general',
        institucion,
        metadatosJson,
        revisionLegal,
        req.params.id,
      ]
    );
    invalidarCacheCatalogo();

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'editar',
      entidad: 'producto',
      entidadId: req.params.id,
      detalle: { nombre, precio, cantidad_disponible, ...(cambiaReglas ? { restringido: esRestringido, institucion } : {}) },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

// DELETE /api/productos/:id -> eliminar producto (solo admin)
// Si el producto ya tiene pedidos asociados (detalle_pedido), no se puede
// borrar sin romper el historial de compras: en ese caso se desactiva
// (estado = 'inactivo') en vez de eliminarlo físicamente, y se informa al
// admin por qué. Si nunca se vendió, se elimina de verdad.
router.delete('/:id', requiereAutenticacion, requiereAdmin, async (req, res) => {
  try {
    const [existente] = await pool.query('SELECT id, nombre FROM productos WHERE id = ?', [req.params.id]);
    if (!existente.length) return res.status(404).json({ error: 'Producto no encontrado' });

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM detalle_pedido WHERE producto_id = ?',
      [req.params.id]
    );

    if (total > 0) {
      await pool.query("UPDATE productos SET estado = 'inactivo' WHERE id = ?", [req.params.id]);
      invalidarCacheCatalogo();
      await registrarAuditoria({
        usuario: req.usuario,
        accion: 'editar',
        entidad: 'producto',
        entidadId: req.params.id,
        detalle: { motivo: 'desactivado en vez de eliminado (tiene pedidos asociados)' },
      });
      return res.json({ ok: true, desactivado: true, mensaje: 'El producto tiene pedidos asociados: se desactivó del catálogo en vez de eliminarse, para no romper el historial.' });
    }

    await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    invalidarCacheCatalogo();
    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'eliminar',
      entidad: 'producto',
      entidadId: req.params.id,
      detalle: { nombre: existente[0].nombre },
    });
    res.json({ ok: true, desactivado: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

router.invalidarCacheCatalogo = invalidarCacheCatalogo;
module.exports = router;
