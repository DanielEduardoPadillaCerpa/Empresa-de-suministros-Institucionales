/* ============================================================
   global-layout.js — componentes globales (navbar, carrito lateral, chatbot)
   Colocar <script src="js/global-layout.js"></script> en el punto exacto
   donde iba el <nav> (inicio del <body>). Se ejecuta de forma síncrona,
   antes de i18n.js / auth.js / cart.js / chatbot.js, por lo que todos los
   ids existen cuando esos scripts enlazan sus eventos.

   Opciones en <body>:
     data-gl-cart="off"   → sin botón ni panel de carrito
     data-gl-chat="off"   → sin chatbot flotante
   ============================================================ */
(function () {
  const script = document.currentScript;
  const body = document.body;
  const archivo = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const conNavbar = body.dataset.glNav !== 'off';
  const conCarrito = body.dataset.glCart !== 'off';
  const conChat = body.dataset.glChat !== 'off';
  const LOGO = 'http://localhost:8081/img/logo-suministros.png';

  body.classList.add('gl-page');
  if (!document.querySelector('link[data-tenant-theme]')) {
    const tema = document.createElement('link');
    tema.rel = 'stylesheet';
    tema.href = 'css/tenant-ui.css';
    tema.dataset.tenantTheme = 'true';
    document.head.appendChild(tema);
  }

  const ICO_CARRITO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';
  const ICO_BUSCAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const ICO_RAYO = '<svg class="cb-head-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
  const ICO_CHAT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11.1c0 2.4 1.3 4.5 3.3 6-.1 1.1-.6 2.4-1.5 3.4-.2.3 0 .7.4.7 2 0 3.7-.8 4.9-1.7.9.2 1.9.3 2.9.3 5.5 0 10-3.6 10-8.1S17.5 3 12 3zm-4 9.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"/></svg>';
  const ICO_SOPORTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-7h3zM3 19a2 2 0 0 0 2 2h1v-7H3z"/></svg>';
  const ICO_ENVIO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h13v13H1z"/><path d="M14 8h4l4 4v4h-8"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>';
  const ICO_ESCUDO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>';

  const enlace = (href, clave, texto, extra) => {
    const activo = archivo === href.split('#')[0].toLowerCase() && href.indexOf('#') === -1;
    const li = extra || '';
    return '<li class="nav-item ' + li + '"><a class="nav-link' + (activo ? ' active' : '') +
      '" href="' + href + '" data-i18n="' + clave + '">' + texto + '</a></li>';
  };

  const enlaceId = (id, href, clave, texto, clases) =>
    enlace(href, clave, texto, clases).replace('<li class="nav-item', '<li id="' + id + '" class="nav-item');

  const menu =
    enlace('landing.html', 'nav_inicio', 'Inicio') +
    enlace('index.html', 'nav_catalogo', 'Catálogo') +
    enlaceId('navRegistro', 'registro.html', 'nav_registro', 'Registro de cliente', 'nav-registro-link') +
    enlaceId('navHistorial', 'historial.html', 'orders_history_nav', 'Historial', 'nav-cliente-link') +
    enlaceId('navMisReportes', 'mis-reportes.html', 'nav_mis_reportes', 'Mis reportes', 'nav-cliente-link') +
    enlace('contacto.html', 'nav_contacto', 'Solicitudes') +
    enlace('leyes.html', 'nav_normatividad', 'Normatividad');

  const botonCarrito = conCarrito ? `
        <li class="nav-item">
          <button class="btn nav-cart-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#carritoOffcanvas" aria-controls="carritoOffcanvas" aria-label="Carrito">
            ${ICO_CARRITO}
            <span class="visually-hidden" data-i18n="nav_carrito">Carrito</span>
            <span id="carrito-badge" class="badge rounded-pill" style="display:none;">0</span>
          </button>
        </li>` : '';

  const volverAdmin = archivo === 'registro.html'
    ? '<a id="nav-regresar-admin" class="btn btn-sm btn-outline-light ms-auto" href="admin-clientes.html" style="display:none;">← Regresar al panel de clientes</a>'
    : '';

  const htmlNav = `
<nav class="navbar navbar-expand-xl navbar-institucional py-2" data-global="1">
  <div class="container">
    <a class="navbar-brand" id="brand-publico" href="landing.html" aria-label="Suministros Institucionales - Ir al inicio">
      <img class="brand-logo" src="${LOGO}" alt="Suministros Institucionales" width="171" height="46">
    </a>
    <button class="navbar-toggler" id="nav-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav1" aria-controls="nav1" aria-expanded="false" aria-label="Abrir menú">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav1">
      <ul class="navbar-nav ms-auto gap-lg-3 align-items-lg-center">
        ${menu}
        <li class="nav-item dropdown selector-idioma nav-tools-start"></li>
        <li class="nav-item">
          <form class="nav-search" id="navSearchForm" action="index.html" method="get" role="search">
            <input class="form-control rounded-pill" type="search" id="filtroBuscar" name="q" placeholder="Buscar productos, categorías..." aria-label="Buscar productos y categorías" autocomplete="off">
            <button class="nav-search-btn" type="submit" aria-label="Buscar">${ICO_BUSCAR}</button>
          </form>
        </li>
        <li class="nav-item d-flex align-items-center" id="auth-nav-slot"></li>${botonCarrito}
      </ul>
    </div>
    ${volverAdmin}
  </div>
</nav>`;

  const htmlCarrito = `
<div class="offcanvas offcanvas-end" tabindex="-1" id="carritoOffcanvas" aria-labelledby="carritoOffcanvasTitulo">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="carritoOffcanvasTitulo" data-i18n="cart_title">Tu Carrito de Compras</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
  </div>
  <div class="offcanvas-body">
    <div class="gl-cart-scroll">
      <div id="carrito-aviso-restringido" class="aviso-sensible" style="display:none;">
        <span data-i18n="cart_restricted_notice_pre">
          Tu carrito incluye equipo táctico restringido. Para completar este pedido necesitarás
          registrar el número de consulta de antecedentes judiciales en el
        </span>
        <a href="registro.html" data-i18n="cart_restricted_notice_link">formulario de registro</a>.
      </div>
      <div id="carrito-items" class="carrito-items-container"></div>
    </div>

    <aside class="gl-cart-footer carrito-summary-panel">
      <h3>Resumen del Pedido</h3>

      <div class="carrito-summary-row">
        <span>Subtotal (<span id="carrito-cantidad-items" data-i18n-ignore="true">0</span> artículos):</span>
        <span id="carrito-subtotal" class="fw-semibold" data-i18n-ignore="true">$0 COP</span>
      </div>

      <div class="carrito-summary-row total-row">
        <span class="fw-bold">Total a pagar:</span>
        <span id="carrito-total" class="fw-bold" data-i18n-ignore="true">$0 COP</span>
      </div>

      <div class="carrito-cupon-row">
        <input type="text" id="cuponDescuento" class="form-control" placeholder="Código de Descuento">
        <button type="button" class="btn btn-outline-dark" onclick="aplicarCupon()">Aplicar</button>
      </div>

      <button type="button" class="btn carrito-checkout-btn" onclick="confirmarCompra()">
        Proceder al pago seguro
      </button>

      <div class="gl-cart-links">
        <button type="button" onclick="if (typeof carritoVaciar === 'function') carritoVaciar();">Vaciar Carrito</button>
        <a href="#" data-bs-dismiss="offcanvas">← Continuar Comprando</a>
      </div>
    </aside>
  </div>
</div>`;

  const htmlChat = `
<button id="chatbot-toggle" type="button" onclick="cbToggle()" title="Atención al cliente" aria-label="Abrir asistente del catálogo" aria-expanded="false">
  <i aria-hidden="true">${ICO_CHAT}</i>
</button>
<div id="chatbot-panel" aria-label="Asistente del catálogo">
  <div class="cb-header">
    ${ICO_RAYO}
    <span class="cb-head-title"><small>Acceso Rápido</small><strong>Pedidos y Consultas</strong></span>
    <button type="button" onclick="cbToggle()" aria-label="Cerrar asistente">✕</button>
  </div>
  <div class="cb-body" id="cb-body" aria-live="polite" aria-relevant="additions text">
    <div class="cb-msg bot" data-i18n="chat_greeting">Hola, soy el asistente virtual de Suministros Institucionales. ¿En qué puedo ayudarte?</div>
  </div>
  <div class="cb-quick cb-quick-start">
    <button type="button" data-q="¿Qué productos tienen disponibles?">Productos disponibles</button>
    <button type="button" data-q="¿Qué productos están restringidos?">Productos restringidos</button>
  </div>
  <div class="cb-input">
    <input type="text" id="cb-input-text" placeholder="Buscar por producto, referencia o categoría..." aria-label="Pregunta sobre el catálogo" maxlength="500">
    <button id="cb-send-button" type="button" onclick="cbEnviar()">Enviar</button>
  </div>
  <button class="cb-human-button" type="button">${ICO_SOPORTE}Contactar Asistencia</button>
  <div class="cb-trust" aria-hidden="true">
    <div>${ICO_ENVIO}Envíos seguros y confiables</div>
    <div>${ICO_ESCUDO}Compras 100% seguras</div>
    <div>${ICO_SOPORTE}Soporte especializado</div>
  </div>
</div>`;

  // 1) Evitar duplicados (por si queda algún bloque estático antiguo)
  document.querySelectorAll('#carritoOffcanvas, #chatbot-toggle, #chatbot-panel').forEach(n => n.remove());

  // 2) Navbar justo donde está este script
  if (conNavbar) {
    if (script && script.parentNode) {
      script.insertAdjacentHTML('beforebegin', htmlNav.trim());
    } else {
      body.insertAdjacentHTML('afterbegin', htmlNav.trim());
    }
  }

  // 3) Carrito lateral y chatbot al final del body
  if (conCarrito) body.insertAdjacentHTML('beforeend', htmlCarrito);
  if (conChat) body.insertAdjacentHTML('beforeend', htmlChat);

  // 4) El chatbot se oculta mientras el carrito está abierto
  const panelCarrito = document.getElementById('carritoOffcanvas');
  if (panelCarrito) {
    panelCarrito.addEventListener('show.bs.offcanvas', () => body.classList.add('gl-cart-open'));
    panelCarrito.addEventListener('hidden.bs.offcanvas', () => body.classList.remove('gl-cart-open'));
  }

  // 5) Respaldo para cupones si la página no define aplicarCupon()
  if (typeof window.aplicarCupon !== 'function') {
    window.aplicarCupon = function () {
      const codigo = (document.getElementById('cuponDescuento') || {}).value;
      const texto = codigo && codigo.trim()
        ? 'Función de cupones próximamente. El código "' + codigo.trim() + '" será validado cuando el módulo esté habilitado.'
        : 'Ingresa un código de descuento.';
      if (typeof mostrarNotificacion === 'function') mostrarNotificacion(texto, 'info');
    };
  }
})();
