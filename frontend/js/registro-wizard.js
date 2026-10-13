/* ============================================================
   Registro por pasos con campos condicionales por tipo de institución.
   Las reglas vienen de GET /api/auth/registro/tipos y el servidor las
   vuelve a aplicar: esta validación solo mejora la experiencia.
   ============================================================ */
(function () {
  const raiz = document.getElementById('registro-wizard');
  if (!raiz) return;

  const PASOS = ['Tipo de institución', 'Requisitos', 'Organización', 'Tus datos', 'Revisión'];
  const CLAVE_BORRADOR = 'si_registro_borrador';
  // Nunca se guardan en el navegador: contraseña ni antecedentes.
  const CAMPOS_NO_PERSISTIBLES = new Set(['password', 'passwordConfirmacion', 'numeroConsultaAntecedentes']);
  const CAMPOS_POR_PASO = {
    2: ['nombreEntidad', 'nit', 'dependencia', 'departamento', 'municipio', 'direccionInstalacion'],
    3: ['nombreFuncionario', 'cargo', 'correo', 'telefono', 'direccionEntrega', 'password', 'passwordConfirmacion', 'numeroConsultaAntecedentes'],
    4: ['aceptaTratamiento']
  };

  let tipos = [];
  let paso = 0;
  const estado = { tipoInstitucion: null };

  const $ = sel => raiz.querySelector(sel);
  const apiBase = () => (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8081').replace(/\/$/, '');
  const tipoActual = () => tipos.find(t => t.id === estado.tipoInstitucion) || null;

  function escapar(texto) {
    const span = document.createElement('span');
    span.textContent = texto == null ? '' : String(texto);
    return span.innerHTML;
  }

  // ---- Borrador local (sin secretos) --------------------------------------
  function guardarBorrador() {
    try {
      const datos = { tipoInstitucion: estado.tipoInstitucion };
      raiz.querySelectorAll('[data-campo]').forEach(el => {
        if (CAMPOS_NO_PERSISTIBLES.has(el.dataset.campo) || el.type === 'checkbox') return;
        datos[el.dataset.campo] = el.value;
      });
      sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos));
    } catch { /* almacenamiento no disponible: se continúa sin borrador */ }
  }

  function leerBorrador() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR)) || {}; } catch { return {}; }
  }

  function borrarBorrador() {
    try { sessionStorage.removeItem(CLAVE_BORRADOR); } catch { /* sin acción */ }
  }

  // ---- Progreso ------------------------------------------------------------
  function pintarProgreso() {
    $('#vf-progreso').innerHTML = PASOS.map((nombre, i) =>
      `<li class="${i === paso ? 'activo' : i < paso ? 'hecho' : ''}" ${i === paso ? 'aria-current="step"' : ''}>${nombre}</li>`
    ).join('');
    raiz.querySelectorAll('[data-paso]').forEach(seccion => {
      seccion.hidden = Number(seccion.dataset.paso) !== paso;
    });
    $('#vf-anterior').hidden = paso === 0 || paso > 4;
    $('#vf-siguiente').hidden = paso >= 4;
    $('#vf-enviar').hidden = paso !== 4;
    $('#vf-acciones').hidden = paso > 4;
  }

  function irA(nuevo) {
    paso = nuevo;
    if (paso === 1) pintarRequisitos();
    if (paso === 2) pintarCamposEspecificos();
    if (paso === 4) pintarResumen();
    pintarProgreso();
    const encabezado = raiz.querySelector(`[data-paso="${paso}"] h2`);
    if (encabezado) {
      encabezado.setAttribute('tabindex', '-1');
      encabezado.focus({ preventScroll: true });
    }
    raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Paso 1: tipo --------------------------------------------------------
  function pintarTipos() {
    $('#vf-tipos').innerHTML = tipos.map(t => `
      <label class="vf-tipo">
        <input type="radio" name="tipoInstitucion" value="${escapar(t.id)}" ${estado.tipoInstitucion === t.id ? 'checked' : ''}>
        <strong>${escapar(t.etiqueta)}</strong>
        <span>${escapar(t.descripcion)}</span>
      </label>`).join('');
    raiz.querySelectorAll('input[name="tipoInstitucion"]').forEach(radio => {
      radio.addEventListener('change', () => cambiarTipo(radio.value));
    });
  }

  function cambiarTipo(nuevo) {
    const anterior = tipoActual();
    if (anterior && anterior.id !== nuevo) {
      const conDatos = anterior.camposEspecificos.some(c => $(`[data-campo="${c.campo}"]`)?.value);
      if (conDatos && !window.confirm('Cambiar el tipo de institución borrará los datos específicos que ya elegiste para el tipo anterior. ¿Continuar?')) {
        raiz.querySelector(`input[name="tipoInstitucion"][value="${anterior.id}"]`).checked = true;
        return;
      }
    }
    estado.tipoInstitucion = nuevo;
    $('#vf-error-tipo').textContent = '';
    pintarCamposEspecificos(true);
    guardarBorrador();
  }

  // ---- Paso 2: requisitos --------------------------------------------------
  function pintarRequisitos() {
    const tipo = tipoActual();
    if (!tipo) return;
    $('#vf-requisitos-titulo').textContent = tipo.etiqueta;
    const dominios = tipo.dominiosInstitucionales.length
      ? `Si te registras con un correo institucional (${tipo.dominiosInstitucionales.map(d => '@' + d).join(', ')}), algunos documentos pueden no ser necesarios.`
      : 'Este tipo no tiene un dominio de correo institucional reconocido: la evidencia documental es necesaria.';
    $('#vf-requisitos-dominio').textContent = dominios;
    const etiquetas = {
      siempre: ['obligatorio', 'Obligatorio'],
      si_el_correo_no_es_institucional: ['condicional', 'Si tu correo no es institucional'],
      segun_datos: ['condicional', 'Según tu sector'],
      opcional: ['', 'Opcional']
    };
    $('#vf-requisitos-lista').innerHTML = tipo.documentos.map(doc => {
      const [clase, texto] = etiquetas[doc.obligatorio] || etiquetas.opcional;
      return `<li><span class="vf-etiqueta ${clase}">${texto}</span><span>${escapar(doc.etiqueta)}</span></li>`;
    }).join('');
  }

  // ---- Paso 3: campos específicos del tipo ---------------------------------
  function pintarCamposEspecificos(limpiar = false) {
    const tipo = tipoActual();
    const contenedor = $('#vf-campos-especificos');
    if (!tipo) { contenedor.innerHTML = ''; return; }
    const previos = limpiar ? {} : leerBorrador();
    contenedor.innerHTML = tipo.camposEspecificos.map(c => `
      <div class="col-md-6 mb-3">
        <label class="form-label" for="vf-${c.campo}">${escapar(c.etiqueta)} <span aria-hidden="true">*</span></label>
        <select class="form-select" id="vf-${c.campo}" data-campo="${c.campo}" required>
          <option value="">Selecciona…</option>
          ${c.opciones.map(o => `<option value="${escapar(o.valor)}" ${previos[c.campo] === o.valor ? 'selected' : ''}>${escapar(o.etiqueta)}</option>`).join('')}
        </select>
        <div class="vf-error-campo" data-error="${c.campo}"></div>
      </div>`).join('');
    const ayudaCorreo = tipo.dominiosInstitucionales.length
      ? `Recomendado: usa tu correo institucional (${tipo.dominiosInstitucionales.map(d => '@' + d).join(', ')}).`
      : 'Usa el correo corporativo desde el que gestionas las compras.';
    $('#vf-ayuda-correo').textContent = ayudaCorreo;
  }

  // ---- Validación cliente --------------------------------------------------
  function valor(campo) {
    const el = $(`[data-campo="${campo}"]`);
    if (!el) return undefined;
    return el.type === 'checkbox' ? el.checked : el.value.trim();
  }

  function marcarError(campo, mensaje) {
    const el = $(`[data-campo="${campo}"]`);
    const error = $(`[data-error="${campo}"]`);
    if (el) {
      el.classList.toggle('is-invalid', Boolean(mensaje));
      el.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
      if (error) {
        error.id = error.id || `vf-error-${campo}`;
        el.setAttribute('aria-describedby', error.id);
      }
    }
    if (error) error.textContent = mensaje || '';
  }

  function validarNitLocal(nit) {
    const limpio = String(nit).replace(/[\s.]/g, '');
    const m = /^(\d{6,15})-?(\d)$/.exec(limpio);
    if (!m) return false;
    const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const suma = m[1].split('').reverse().reduce((t, d, i) => t + Number(d) * pesos[i], 0);
    const r = suma % 11;
    return (r > 1 ? 11 - r : r) === Number(m[2]);
  }

  function validarPaso(n) {
    let valido = true;
    const fallar = (campo, mensaje) => { marcarError(campo, mensaje); valido = false; };
    if (n === 0 && !estado.tipoInstitucion) {
      $('#vf-error-tipo').textContent = 'Selecciona el tipo de institución para continuar.';
      return false;
    }
    if (n === 2) {
      const minimos = { nombreEntidad: 3, dependencia: 2, departamento: 2, municipio: 2, direccionInstalacion: 5 };
      for (const [campo, minimo] of Object.entries(minimos)) {
        marcarError(campo, '');
        if ((valor(campo) || '').length < minimo) fallar(campo, 'Completa este campo.');
      }
      marcarError('nit', '');
      if (!validarNitLocal(valor('nit'))) fallar('nit', 'Escribe el NIT con su dígito de verificación, por ejemplo 900123456-7.');
      for (const c of tipoActual()?.camposEspecificos || []) {
        marcarError(c.campo, '');
        if (!valor(c.campo)) fallar(c.campo, 'Selecciona una opción.');
      }
    }
    if (n === 3) {
      ['nombreFuncionario', 'cargo', 'correo', 'telefono', 'password', 'passwordConfirmacion'].forEach(c => marcarError(c, ''));
      if ((valor('nombreFuncionario') || '').length < 5) fallar('nombreFuncionario', 'Escribe tu nombre completo.');
      if ((valor('cargo') || '').length < 2) fallar('cargo', 'Indica tu cargo o función.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor('correo') || '')) fallar('correo', 'Escribe un correo válido.');
      if (!/^\+?[0-9 ()-]{7,20}$/.test(valor('telefono') || '')) fallar('telefono', 'Escribe un teléfono válido.');
      const password = $('[data-campo="password"]').value;
      if (password.length < 10 || password.length > 72) fallar('password', 'Usa entre 10 y 72 caracteres.');
      if (password !== $('[data-campo="passwordConfirmacion"]').value) fallar('passwordConfirmacion', 'Las contraseñas no coinciden.');
      const antecedentes = valor('numeroConsultaAntecedentes');
      marcarError('numeroConsultaAntecedentes', '');
      if (antecedentes && !$('#vf-autorizacion-sensible').checked) {
        fallar('numeroConsultaAntecedentes', 'Para guardar este dato debes marcar la autorización expresa, o deja el campo vacío.');
      }
    }
    if (n === 4) {
      marcarError('aceptaTratamiento', '');
      if (!valor('aceptaTratamiento')) fallar('aceptaTratamiento', 'Debes autorizar el tratamiento de datos para enviar la solicitud.');
    }
    if (!valido) raiz.querySelector('.is-invalid')?.focus();
    return valido;
  }

  // ---- Paso 5: resumen -----------------------------------------------------
  function pintarResumen() {
    const tipo = tipoActual();
    const filas = [
      ['Tipo de institución', tipo?.etiqueta],
      ['Entidad', valor('nombreEntidad')],
      ['NIT', valor('nit')],
      ['Unidad o dependencia', valor('dependencia')],
      ['Ubicación', `${valor('municipio')}, ${valor('departamento')}`],
      ['Dirección de la sede', valor('direccionInstalacion')],
      ...(tipo?.camposEspecificos || []).map(c => [c.etiqueta, c.opciones.find(o => o.valor === valor(c.campo))?.etiqueta]),
      ['Solicitante', `${valor('nombreFuncionario')} — ${valor('cargo')}`],
      ['Correo', valor('correo')],
      ['Teléfono', valor('telefono')],
      ['Dato de antecedentes', valor('numeroConsultaAntecedentes') ? 'Aportado con autorización expresa' : 'No aportado']
    ];
    $('#vf-resumen').innerHTML = filas.map(([k, v]) => `<dt>${escapar(k)}</dt><dd>${escapar(v || '—')}</dd>`).join('');
  }

  // ---- Envío ---------------------------------------------------------------
  function construirPayload() {
    const tipo = tipoActual();
    const payload = {
      tipoInstitucion: tipo.id,
      nombreEntidad: valor('nombreEntidad'),
      nit: valor('nit'),
      dependencia: valor('dependencia'),
      cargo: valor('cargo'),
      departamento: valor('departamento'),
      municipio: valor('municipio'),
      direccionInstalacion: valor('direccionInstalacion'),
      nombreFuncionario: valor('nombreFuncionario'),
      correo: valor('correo').toLowerCase(),
      telefono: valor('telefono'),
      password: $('[data-campo="password"]').value,
      aceptaTratamiento: valor('aceptaTratamiento') === true
    };
    if (valor('direccionEntrega')) payload.direccionEntrega = valor('direccionEntrega');
    // Solo se envían los campos del tipo elegido: el servidor rechaza los ajenos.
    for (const c of tipo.camposEspecificos) payload[c.campo] = valor(c.campo);
    const antecedentes = valor('numeroConsultaAntecedentes');
    if (antecedentes && $('#vf-autorizacion-sensible').checked) {
      payload.numeroConsultaAntecedentes = antecedentes;
      payload.autorizacionSensible = true;
    }
    return payload;
  }

  function pasoDeCampo(campo) {
    if (campo === 'tipoInstitucion') return 0;
    for (const [n, campos] of Object.entries(CAMPOS_POR_PASO)) if (campos.includes(campo)) return Number(n);
    return (tipoActual()?.camposEspecificos || []).some(c => c.campo === campo) ? 2 : 4;
  }

  async function enviar() {
    if (!validarPaso(4)) return;
    const boton = $('#vf-enviar');
    const mensaje = $('#vf-mensaje');
    boton.disabled = true;
    boton.textContent = 'Enviando…';
    mensaje.hidden = true;
    try {
      const resp = await fetch(apiBase() + '/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(construirPayload())
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        if (datos.errores) {
          Object.entries(datos.errores).forEach(([campo, texto]) => marcarError(campo, texto));
          const primero = Object.keys(datos.errores).find(c => c !== '_');
          if (primero) irA(pasoDeCampo(primero));
        }
        throw new Error(resp.status === 429
          ? 'Se alcanzó el límite de registros desde esta conexión. Inténtalo más tarde.'
          : datos.error || 'No se pudo completar el registro.');
      }
      borrarBorrador();
      mostrarConfirmacion(datos);
    } catch (err) {
      mensaje.className = 'alert alert-danger mt-3';
      mensaje.textContent = err.message === 'Failed to fetch'
        ? 'No hay comunicación con el servidor. Revisa tu conexión e inténtalo de nuevo.'
        : err.message;
      mensaje.hidden = false;
    } finally {
      boton.disabled = false;
      boton.textContent = 'Enviar solicitud';
    }
  }

  function mostrarConfirmacion(datos) {
    paso = 5;
    pintarProgreso();
    $('#vf-progreso').querySelectorAll('li').forEach(li => { li.className = 'hecho'; });
    const docs = datos.documentosRequeridos || [];
    $('#vf-confirmacion-docs').innerHTML = docs.length
      ? docs.map(d => `<li><span class="vf-etiqueta obligatorio">Obligatorio</span><span>${escapar(d.etiqueta)}</span></li>`).join('')
      : '<li><span class="vf-etiqueta cumplido">Correo institucional</span><span>Tu correo coincide con el dominio de la institución: al verificarlo no necesitas documentos obligatorios adicionales.</span></li>';
    const login = new URL('login.html', window.location.href);
    login.searchParams.set('correo', datos.correo);
    login.searchParams.set('registro', 'completo');
    $('#vf-ir-login').href = login.href;
    const seccion = raiz.querySelector('[data-paso="5"]');
    seccion.hidden = false;
    seccion.querySelector('h2').focus();
  }

  // ---- Inicio --------------------------------------------------------------
  async function iniciar() {
    raiz.hidden = false;
    try {
      const resp = await fetch(apiBase() + '/api/auth/registro/tipos');
      if (!resp.ok) throw new Error();
      tipos = (await resp.json()).tipos || [];
    } catch {
      $('#vf-tipos').innerHTML = '<div class="alert alert-danger">No se pudieron cargar los tipos de institución. Verifica que el servidor esté en funcionamiento y recarga la página.</div>';
      $('#vf-acciones').hidden = true;
      return;
    }
    const borrador = leerBorrador();
    if (borrador.tipoInstitucion && tipos.some(t => t.id === borrador.tipoInstitucion)) estado.tipoInstitucion = borrador.tipoInstitucion;
    raiz.querySelectorAll('[data-campo]').forEach(el => {
      if (borrador[el.dataset.campo] && !CAMPOS_NO_PERSISTIBLES.has(el.dataset.campo) && el.type !== 'checkbox') el.value = borrador[el.dataset.campo];
      el.addEventListener('change', guardarBorrador);
    });
    pintarTipos();
    pintarCamposEspecificos();
    pintarProgreso();

    $('#vf-siguiente').addEventListener('click', () => { if (validarPaso(paso)) irA(paso + 1); });
    $('#vf-anterior').addEventListener('click', () => irA(paso - 1));
    $('#vf-enviar').addEventListener('click', enviar);
    $('#vf-campos-especificos').addEventListener('change', guardarBorrador);
  }

  window.registroWizardIniciar = iniciar;
})();
