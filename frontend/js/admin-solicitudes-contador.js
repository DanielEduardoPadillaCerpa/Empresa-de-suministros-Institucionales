/* ============================================================
   Contador de solicitudes de cuenta pendientes en el menú admin.
   Consulta GET /api/admin/solicitudes/contador (COUNT con índice) cada
   12 segundos mientras la pestaña está visible, y pinta el número en
   todos los elementos .badge-solicitudes.
   ============================================================ */
(function () {
  const INTERVALO_MS = 12000;
  let pendientes = null;
  const oyentes = [];

  function pintar() {
    document.querySelectorAll('.badge-solicitudes').forEach(badge => {
      badge.textContent = pendientes > 0 ? String(pendientes) : '';
      badge.hidden = !(pendientes > 0);
      badge.setAttribute('aria-label', `${pendientes || 0} solicitudes pendientes`);
    });
  }

  function fijar(valor) {
    const anterior = pendientes;
    pendientes = Math.max(0, valor);
    pintar();
    if (anterior !== null && anterior !== pendientes) oyentes.forEach(fn => fn(pendientes));
    if (anterior === null) oyentes.forEach(fn => fn(pendientes));
  }

  async function refrescar() {
    if (typeof authLeer !== 'function') return;
    const sesion = authLeer();
    if (!sesion || sesion.rol !== 'admin' || !sesion.token) return;
    if (typeof authAsegurarTokenValido === 'function' && !await authAsegurarTokenValido()) return;
    try {
      const resp = await fetch(API_BASE + '/api/admin/solicitudes/contador', {
        headers: { Authorization: 'Bearer ' + authLeer().token },
        cache: 'no-store'
      });
      if (!resp.ok) return;
      const datos = await resp.json();
      fijar(Number(datos.pendientes) || 0);
    } catch { /* sin conexión: se reintenta en el siguiente ciclo */ }
  }

  setInterval(() => { if (document.visibilityState === 'visible') refrescar(); }, INTERVALO_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refrescar(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refrescar);
  else refrescar();

  // Reportes de clientes nuevos y solicitudes de contacto sin atender, en el
  // menú de la cuenta del administrador. Se consultan con menos frecuencia.
  const ATENCION = [
    { url: '/api/reportes/clientes/contador', campo: 'nuevos', selector: '.badge-reportes-clientes', texto: 'reportes nuevos' },
    { url: '/api/admin/contacto/contador', campo: 'recibidas', selector: '.badge-contacto', texto: 'solicitudes sin atender' }
  ];
  const valoresAtencion = {};

  function pintarAtencion() {
    for (const c of ATENCION) {
      const valor = valoresAtencion[c.selector] || 0;
      document.querySelectorAll(c.selector).forEach(badge => {
        const texto = valor > 0 ? String(valor) : '';
        // Solo si cambia: escribir el mismo texto dispararía de nuevo el observador.
        if (badge.textContent !== texto) badge.textContent = texto;
        badge.hidden = !(valor > 0);
        badge.setAttribute('aria-label', `${valor} ${c.texto}`);
      });
    }
  }

  async function refrescarAtencion() {
    if (typeof authLeer !== 'function') return;
    const sesion = authLeer();
    if (!sesion || sesion.rol !== 'admin' || !sesion.token) return;
    await Promise.all(ATENCION.map(async c => {
      try {
        const resp = await fetch(API_BASE + c.url, { headers: { Authorization: 'Bearer ' + authLeer().token }, cache: 'no-store' });
        if (!resp.ok) return;
        valoresAtencion[c.selector] = Number((await resp.json())[c.campo]) || 0;
      } catch { /* sin conexión: se reintenta en el siguiente ciclo */ }
    }));
    pintarAtencion();
  }

  setInterval(() => { if (document.visibilityState === 'visible') refrescarAtencion(); }, 30000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refrescarAtencion);
  else refrescarAtencion();
  // El menú de la cuenta se vuelve a dibujar al renovar la sesión: repintar.
  new MutationObserver(pintarAtencion).observe(document.documentElement, { childList: true, subtree: true });

  window.ContadoresAtencion = { refrescar: refrescarAtencion };

  window.ContadorSolicitudes = {
    refrescar,
    // Actualización optimista al aprobar o rechazar (sin esperar al servidor).
    ajustar: delta => { if (pendientes !== null) { pendientes = Math.max(0, pendientes + delta); pintar(); } },
    alCambiar: fn => oyentes.push(fn)
  };
})();
