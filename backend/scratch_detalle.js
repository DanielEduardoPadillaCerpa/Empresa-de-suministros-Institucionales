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
