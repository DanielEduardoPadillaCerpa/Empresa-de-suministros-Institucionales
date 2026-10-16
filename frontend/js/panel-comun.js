/* ============================================================
   Utilidades de los paneles Mi cuenta, Reportes de clientes,
   Solicitudes de contacto y Auditoría.
   Requiere js/auth.js (API_BASE, authLeer, authAsegurarTokenValido).
   ============================================================ */
(function () {
  function esc(texto) {
    const span = document.createElement('span');
    span.textContent = texto == null ? '' : String(texto);
    return span.innerHTML;
  }

  function fecha(valor) {
    return valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  }

  // Petición autenticada. 401 → al login con regreso a la página; los demás
  // errores se lanzan con el mensaje del servidor, el estado y el cuerpo.
  function crearApi(pagina) {
    const alLogin = () => window.location.replace('login.html?redirect=' + encodeURIComponent(pagina));
    return async function api(ruta, opciones = {}) {
      if (!await authAsegurarTokenValido()) {
        alLogin();
        throw new Error('Sesión vencida');
      }
      const headers = { ...(opciones.headers || {}), Authorization: 'Bearer ' + authLeer().token };
      if (opciones.body) headers['Content-Type'] = 'application/json';
      const resp = await fetch(API_BASE + ruta, { cache: 'no-store', ...opciones, headers });
      if (resp.status === 401) {
        alLogin();
        throw new Error('Sesión vencida');
      }
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) throw Object.assign(new Error(datos.error || 'Error ' + resp.status), { datos, status: resp.status });
      return datos;
    };
  }

  // Exige sesión iniciada (y rol admin si se pide) antes de pintar la página.
  function exigirSesion(pagina, { admin = false } = {}) {
    const sesion = authLeer();
    if (!sesion?.token || sesion.mfaVerified !== true || (admin && sesion.rol !== 'admin')) {
      window.location.replace('login.html?redirect=' + encodeURIComponent(pagina));
      return null;
    }
    return sesion;
  }

  // Mensaje de permiso faltante con el nombre del permiso que pide el servidor.
  function mensajePermiso(err) {
    if (err?.status === 403 && err.datos?.permisoRequerido) {
      return `Tu cuenta administrativa no tiene el permiso "${err.datos.permisoRequerido}". Pídeselo a un superadministrador.`;
    }
    return err?.message || 'No fue posible completar la operación.';
  }

  window.PanelComun = { esc, fecha, crearApi, exigirSesion, mensajePermiso };
})();
