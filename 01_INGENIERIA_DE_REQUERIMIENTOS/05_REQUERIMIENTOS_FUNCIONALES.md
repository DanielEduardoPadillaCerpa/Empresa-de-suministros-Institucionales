# Requerimientos funcionales

| Campo | Valor |
|---|---|
| ID documental | DOC-01-05 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Especificar los 40 requerimientos funcionales (REQ-F-001 a REQ-F-040) reconstruidos a partir del sistema, con su origen, estado y criterio de aceptación.

## Alcance

Todos los módulos MOD-01 a MOD-17. Convenciones de origen (O1 comportamiento existente, O2 documentado en `../docs/`, O3 inferido, O4 mejora propuesta) en [03_METODO_DE_LEVANTAMIENTO_DE_REQUERIMIENTOS.md](03_METODO_DE_LEVANTAMIENTO_DE_REQUERIMIENTOS.md). Prioridades: **[INF]**. Estado "VERIFICADO" solo si lo cubre una prueba ejecutada el 2026-10-16 (Jest 107/107, node:test 51/51).

## Resumen

| ID | Nombre | Prioridad | Estado | TC |
|---|---|---|---|---|
| REQ-F-001 | Solicitar cuenta (registro verificado) | Alta | IMPLEMENTADO Y VERIFICADO | TC-001 |
| REQ-F-002 | Verificar terna contra padrón cifrado | Alta | IMPLEMENTADO Y VERIFICADO | TC-002 |
| REQ-F-003 | Sincronizar padrón desde la fuente | Alta | IMPLEMENTADO, NO VERIFICADO | TC-003 |
| REQ-F-004 | Gestionar solicitudes de registro | Alta | IMPLEMENTADO Y VERIFICADO | TC-004 |
| REQ-F-005 | Inicio de sesión paso 1 | Alta | IMPLEMENTADO Y VERIFICADO | TC-005 |
| REQ-F-006 | Segundo factor por correo | Alta | IMPLEMENTADO Y VERIFICADO (cancelar no cubierto) | TC-006 |
| REQ-F-007 | Revocación de sesión y estado desde BD | Alta | IMPLEMENTADO Y VERIFICADO | TC-007 |
| REQ-F-008 | Refresh rotativo y cierre de sesión | Media | IMPLEMENTADO, NO VERIFICADO | TC-008 |
| REQ-F-009 | Cambio obligatorio de contraseña inicial | Alta | IMPLEMENTADO Y VERIFICADO | TC-009 |
| REQ-F-010 | Consultar y editar perfil propio | Media | PARCIALMENTE IMPLEMENTADO | TC-010 |
| REQ-F-011 | Cambiar correo con código | Media | PARCIALMENTE IMPLEMENTADO | TC-011 |
| REQ-F-012 | Cambiar contraseña y cerrar sesiones | Alta | IMPLEMENTADO Y VERIFICADO | TC-012 |
| REQ-F-013 | Solicitudes de corrección/eliminación | Media | PARCIALMENTE IMPLEMENTADO | TC-013 |
| REQ-F-014 | Catálogo según contexto | Alta | IMPLEMENTADO Y VERIFICADO | TC-014 |
| REQ-F-015 | Detalle y filtro por categoría | Media | IMPLEMENTADO, NO VERIFICADO | TC-015 |
| REQ-F-016 | Administrar productos y categorías | Media | IMPLEMENTADO, NO VERIFICADO | TC-016 |
| REQ-F-017 | Cumplimiento de productos | Alta | IMPLEMENTADO, NO VERIFICADO | TC-017 |
| REQ-F-018 | Carrito en el navegador | Media | IMPLEMENTADO, NO VERIFICADO | TC-018 |
| REQ-F-019 | Checkout idempotente | Alta | IMPLEMENTADO, NO VERIFICADO | TC-019 |
| REQ-F-020 | Prellenado del checkout | Baja | IMPLEMENTADO Y VERIFICADO | TC-020 |
| REQ-F-021 | Pagos con proveedor mock | Alta | IMPLEMENTADO, NO VERIFICADO | TC-021 |
| REQ-F-022 | Expirar pedidos y liberar reservas | Alta | IMPLEMENTADO Y VERIFICADO | TC-022 |
| REQ-F-023 | Historial y cancelación de pedido | Media | IMPLEMENTADO, NO VERIFICADO | TC-023 |
| REQ-F-024 | Gestión de pedidos (admin) | Media | IMPLEMENTADO, NO VERIFICADO | TC-024 |
| REQ-F-025 | Comprobante no-DIAN | Media | IMPLEMENTADO Y VERIFICADO | TC-025 |
| REQ-F-026 | Gestión de clientes (admin) | Media | IMPLEMENTADO Y VERIFICADO | TC-026 |
| REQ-F-027 | Solicitar verificación institucional | Alta | IMPLEMENTADO, NO VERIFICADO | TC-027 |
| REQ-F-028 | Revisar verificación con doble comprobación | Alta | IMPLEMENTADO Y VERIFICADO | TC-028 |
| REQ-F-029 | Autorización por compra de restringidos | Alta | IMPLEMENTADO, NO VERIFICADO | TC-029 |
| REQ-F-030 | Personal, permisos, superadmin, diagnóstico | Alta | IMPLEMENTADO, NO VERIFICADO | TC-030 |
| REQ-F-031 | Asistente de catálogo | Baja | IMPLEMENTADO Y VERIFICADO | TC-031 |
| REQ-F-032 | Calificación y solicitudes de contacto | Baja | IMPLEMENTADO, NO VERIFICADO | TC-032 |
| REQ-F-033 | Reportes | Media | IMPLEMENTADO, NO VERIFICADO | TC-033 |
| REQ-F-034 | Auditoría administrativa | Alta | IMPLEMENTADO, NO VERIFICADO | TC-034 |
| REQ-F-035 | Eventos firmados hacia n8n | Media | IMPLEMENTADO Y VERIFICADO | TC-035 |
| REQ-F-036 | Workflows n8n operativos | Media | NO DETERMINADO | TC-036 |
| REQ-F-037 | Migraciones al arrancar y reversión | Alta | IMPLEMENTADO Y VERIFICADO | TC-037 |
| REQ-F-038 | Interfaz multilenguaje | Baja | PARCIALMENTE IMPLEMENTADO | TC-038 |
| REQ-F-039 | Portada, normatividad y navegación | Baja | IMPLEMENTADO, NO VERIFICADO | TC-039 |
| REQ-F-040 | Pasarela de pagos real | Alta | DOCUMENTADO, NO IMPLEMENTADO | TC-040 |

---

## MOD-02 · Registro verificado y padrón

### REQ-F-001 — Solicitar cuenta (registro verificado)

| Atributo | Valor |
|---|---|
| Descripción | El visitante envía `tipoInstitucion` (policia, defensa, bomberos, socorro, penitenciario, corporativo), `nombreCompleto` (5–150, al menos dos palabras), `nit` (1–30, normalizable), `correo` (≤254), `password` (10–72, sin contener el usuario del correo), `aceptaTerminos: true`, `aceptaTratamiento: true`, el campo específico opcional de su tipo y un captcha resuelto. El servidor crea en una transacción `clientes`, `usuarios` (`estado_cuenta='pendiente'`) y `solicitudes_registro`, y responde siempre **202** con el mismo mensaje. |
| Justificación | Solo personas del padrón con aprobación humana deben tener cuenta (RN-001). |
| Actor | ACT-01 → ACT-02 |
| Origen | O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §1, `../docs/CHANGELOG.md` 2026-10-15) |
| Evidencia | `../backend/src/routes/auth.js` (`POST /registro`), `../backend/src/registroInstitucional.js` (`esquemaRegistroMinimo`, esquema `.strict()`), `../backend/src/seguridad/registroVerificado.js`, `../frontend/registro.html`, `../frontend/js/registro-wizard.js`, `../frontend/js/captcha.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `account-registration-phase0.spec.js` (registro válido 202, correo repetido misma respuesta, sin captcha, campos ajenos rechazados, aceptaciones exigidas) y `registro-verificado.test.js` (flujo) |
| Criterio de aceptación | CA-001 en [09_CRITERIOS_DE_ACEPTACION.md](09_CRITERIOS_DE_ACEPTACION.md) |
| Dependencias | REQ-F-002, REQ-NF-001, REQ-NF-002; `ENC_KEY`/`HMAC_KEY` configuradas (si faltan responde 503) |
| Observaciones | Límite `REGISTRO_LIMITE_POR_HORA` (10) por IP. Si el correo ya existe se envía un aviso al titular (RN-004). |

### REQ-F-002 — Verificar terna NIT + nombre + institución contra el padrón cifrado

| Atributo | Valor |
|---|---|
| Descripción | Normalizar NIT (solo dígitos, sin DV) y nombre (sin tildes, mayúsculas, palabras ordenadas), buscar por `nit_hash` en `padron_institucional` y clasificar en: `coincide`, `nit_no_existe`, `nombre_no_coincide`, `institucion_no_coincide`, `persona_inactiva`, `padron_no_disponible`. El resultado es solo una bandera para el administrador. |
| Justificación | Reducir suplantaciones sin exponer el padrón (RN-002). |
| Actor | Sistema (durante REQ-F-001 y REQ-F-004) |
| Origen | O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §1–2) |
| Evidencia | `../backend/src/seguridad/padron.js` (`verificarEnPadron`), `../backend/src/seguridad/normalizacion.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `registro-verificado.test.js` (padrón:*, NIT, nombre) |
| Criterio de aceptación | CA-002 |
| Dependencias | REQ-F-003, REQ-NF-001 |
| Observaciones | El índice `nit_hash` no es único: varios funcionarios comparten NIT. |

### REQ-F-003 — Sincronizar el padrón cifrado desde la fuente

| Atributo | Valor |
|---|---|
| Descripción | Copiar (solo lectura) la tabla `personas_institucionales_prueba` de `PADRON_DB_URI` (o `MYSQL_ADDON_URI`) a `padron_institucional` cifrada, al arrancar y cada `PADRON_SYNC_MINUTOS` (10); las filas que desaparecen quedan `inactiva`; `npm run padron:importar` fuerza la sincronización. |
| Justificación | El padrón es la referencia de identidad; la fuente nunca se modifica. |
| Actor | ACT-11, ACT-09 |
| Origen | O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §2) |
| Evidencia | `../backend/src/seguridad/padron.js` (`sincronizarPadron`, `iniciarSincronizacionPeriodica`), `../backend/server.js`, `../backend/scripts/importar-padron.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO (requiere la base fuente; no se ejecutó) |
| Criterio de aceptación | CA-003 |
| Dependencias | ACT-09 disponible; claves de cifrado |
| Observaciones | La fuente actual es una base de laboratorio que simula la del Estado; la conexión con una fuente oficial es PENDIENTE. |

### REQ-F-004 — Gestionar solicitudes de registro

| Atributo | Valor |
|---|---|
| Descripción | Con permiso `clientes.gestionar` (o superadmin): contador de pendientes (`GET /api/admin/solicitudes/contador`), lista sin NIT ni nombre (`GET /api/admin/solicitudes?estado=`), detalle descifrado con el padrón al lado y verificación repetida (`GET /:id`, auditado), aprobar (`POST /:id/aprobar`, exige `{confirmar:true}` si el resultado no es `coincide`) y rechazar con motivo de 5–500 caracteres (`POST /:id/rechazar`). Aprobar y rechazar son un UPDATE atómico condicionado a que la solicitud siga pendiente y el admin sea válido; el solicitante recibe correo. |
| Justificación | Aprobación humana obligatoria (RN-003). |
| Actor | ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §1, §5) |
| Evidencia | `../backend/src/routes/solicitudesRegistro.js`, `../frontend/admin-solicitudes.html`, `../frontend/js/admin-solicitudes-contador.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `registro-verificado.test.js` (flujo: aprobación, confirmación explícita, rechazo con motivo, acceso al panel) |
| Criterio de aceptación | CA-004 |
| Dependencias | REQ-F-002, REQ-F-034, REQ-F-035 (aviso W12 opcional) |
| Observaciones | Respuesta 409 `YA_DECIDIDA` o `CONFIRMACION_REQUERIDA`. El motivo del rechazo no se guarda en auditoría. |

## MOD-01 · Autenticación y sesión

### REQ-F-005 — Inicio de sesión, paso 1

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/auth/login` con correo, contraseña (≤72) y captcha. Si el correo no existe se compara contra un hash de relleno. Solo tras validar la contraseña se informa el estado de la cuenta (`CUENTA_PENDIENTE`, `CUENTA_RECHAZADA`, `CUENTA_SUSPENDIDA`, 403). Si la cuenta está activa se crea un reto MFA y se responde 202 con `challengeId` y correo enmascarado. |
| Justificación | Evitar enumeración de cuentas y fuerza bruta. |
| Actor | ACT-02, ACT-03, ACT-04, ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §1) |
| Evidencia | `../backend/src/routes/auth.js`, `../backend/src/seguridad/contrasenas.js` (`hashRelleno`), `../frontend/login.html` |
| Estado | IMPLEMENTADO Y VERIFICADO — `registro-verificado.test.js`, `mi-cuenta.spec.js` |
| Criterio de aceptación | CA-005 |
| Dependencias | REQ-F-006, captcha (`../backend/src/seguridad/captcha.js`) |
| Observaciones | Límite 10 intentos/15 min por IP (RN-005). |

### REQ-F-006 — Segundo factor por correo

| Atributo | Valor |
|---|---|
| Descripción | Código de 6 dígitos (`crypto.randomInt`) almacenado solo como HMAC con `MFA_TOKEN_PEPPER`; vence en 5 min, admite 5 intentos; `POST /mfa/verificar` emite access token y refresh token y marca `correo_verificado_en`; `POST /mfa/reenviar` (tras 60 s, máx. 5 reenvíos); `POST /mfa/cancelar`. Envío por nodemailer en segundo plano (nunca por n8n). |
| Justificación | Prueba de control del buzón y segundo factor. |
| Actor | Usuarios con cuenta activa; ACT-10 |
| Origen | O1, O2 (`../docs/FLUJO_AUTENTICACION_ACTUAL.md`, `../docs/CHANGELOG.md` 2026-10-15) |
| Evidencia | `../backend/src/routes/auth.js`, `../backend/src/mfaCodes.js`, `../backend/src/seguridad/correo.js` |
| Estado | IMPLEMENTADO Y VERIFICADO (verificar y reenviar); `cancelar` IMPLEMENTADO, NO VERIFICADO |
| Criterio de aceptación | CA-006 |
| Dependencias | REQ-F-005; SMTP o consola de laboratorio |
| Observaciones | Sin SMTP fuera de producción el código se imprime en consola marcado `[correo-laboratorio]`. |

### REQ-F-007 — Revocación de sesión y validación desde BD

| Atributo | Valor |
|---|---|
| Descripción | `requiereAutenticacion` valida JWT HS256 con `mfa === true`, compara `sv` con `usuarios.session_version`, exige `estado_cuenta='activa'` y toma `rol` de la BD en cada petición. |
| Justificación | Que suspender o revocar surta efecto inmediato aunque el JWT siga vigente. |
| Actor | Todos los autenticados |
| Origen | O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §1) |
| Evidencia | `../backend/src/routes/auth.js` (`requiereAutenticacion`) |
| Estado | IMPLEMENTADO Y VERIFICADO — `mi-cuenta.spec.js` |
| Criterio de aceptación | CA-007 |
| Dependencias | REQ-NF-003 (`JWT_SECRET`) |
| Observaciones | Respuestas 401 (revocada) o 403 `CUENTA_NO_ACTIVA`. |

### REQ-F-008 — Renovar sesión y cerrar sesión

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/auth/refresh` canjea un refresh token (solo su SHA-256 en `refresh_tokens`) por un access token nuevo, revocando el usado (rotación), con vigencia `REFRESH_EXPIRES_DIAS` (7). `POST /api/auth/logout` revoca el refresh token. |
| Justificación | Sesiones de 2 h sin pedir login continuamente. |
| Actor | Usuarios autenticados |
| Origen | O1, O2 (`../docs/FLUJO_AUTENTICACION_ACTUAL.md`) |
| Evidencia | `../backend/src/routes/auth.js`, `../frontend/js/auth.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO (sin prueba ejecutada en esta auditoría) |
| Criterio de aceptación | CA-008 |
| Dependencias | REQ-F-006 |
| Observaciones | Tokens guardados en `localStorage` (BUG-011). |

### REQ-F-009 — Cambio obligatorio de la contraseña inicial

| Atributo | Valor |
|---|---|
| Descripción | Si `usuarios.debe_cambiar_password` es verdadero, solo se permite `GET /api/mi-cuenta` y `POST /api/mi-cuenta/password`; el resto responde 403 `PASSWORD_CHANGE_REQUIRED`. Aplica al admin sembrado por `ADMIN_EMAIL/ADMIN_PASSWORD`, al superadmin y al personal nuevo. |
| Justificación | Evitar credenciales iniciales conocidas. |
| Actor | ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/AUDITORIA_TECNICA.md` §8 A7) |
| Evidencia | `../backend/src/routes/auth.js` (`RUTAS_CON_CAMBIO_PENDIENTE`), `../backend/src/db.js` (`sembrarAdminPorDefecto`), `../frontend/cambiar-password.html` |
| Estado | IMPLEMENTADO Y VERIFICADO — `mi-cuenta.spec.js` ("con contraseña inicial pendiente solo se permite cambiarla") |
| Criterio de aceptación | CA-009 |
| Dependencias | REQ-F-012 |
| Observaciones | — |

## MOD-03 · Mi cuenta

### REQ-F-010 — Consultar y editar el perfil propio

| Atributo | Valor |
|---|---|
| Descripción | `GET /api/mi-cuenta` devuelve el perfil descifrado del `cliente_id` de la sesión; `PATCH /api/mi-cuenta` admite solo `nombreFuncionario`, `telefono` (normalizado, colombiano), `direccionEntrega`, `direccionInstalacion`; rechaza HTML y campos fuera de la lista; audita nombres de campos sin valores. |
| Justificación | Derechos de actualización del titular (Ley 1581). |
| Actor | ACT-03, ACT-04 |
| Origen | O1, O2 (`../backend/README.md` "Mi cuenta") |
| Evidencia | `../backend/src/routes/miCuenta.js` |
| Estado | PARCIALMENTE IMPLEMENTADO — API verificada (`mi-cuenta.spec.js`); **no existe pantalla** (BUG-004) |
| Criterio de aceptación | CA-010 |
| Dependencias | REQ-F-007 |
| Observaciones | RN-021. |

### REQ-F-011 — Cambiar el correo con código

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/mi-cuenta/correo/solicitar` (con contraseña actual) envía un código al correo nuevo (reto `cambio_correo`, destino cifrado); `POST /correo/confirmar` sincroniza `usuarios.correo` y `clientes.correo` en una transacción, revoca sesiones y avisa al correo anterior. |
| Justificación | Cambio de identificador de acceso con prueba de control del nuevo buzón. |
| Actor | ACT-03, ACT-04 |
| Origen | O1, O2 (`../backend/README.md` "Mi cuenta") |
| Evidencia | `../backend/src/routes/miCuenta.js` |
| Estado | PARCIALMENTE IMPLEMENTADO — API verificada (`mi-cuenta.spec.js`, cambio de correo*); sin pantalla (BUG-004) |
| Criterio de aceptación | CA-011 |
| Dependencias | REQ-F-006, REQ-F-034 |
| Observaciones | Correo duplicado → respuesta genérica sin crear reto. |

### REQ-F-012 — Cambiar contraseña y cerrar todas las sesiones

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/mi-cuenta/password` exige contraseña actual y MFA en los últimos 15 minutos, cambia el hash y revoca todas las sesiones. `POST /api/mi-cuenta/sesiones/cerrar-todas` revoca refresh tokens e incrementa `session_version`. |
| Justificación | Control del titular sobre su cuenta. |
| Actor | Todos los autenticados |
| Origen | O1, O2 (`../backend/README.md`) |
| Evidencia | `../backend/src/routes/miCuenta.js`, `../frontend/cambiar-password.html` |
| Estado | IMPLEMENTADO Y VERIFICADO — `mi-cuenta.spec.js`; "cerrar todas" sin pantalla |
| Criterio de aceptación | CA-012 |
| Dependencias | REQ-F-007 |
| Observaciones | Defecto corregido el 2026-10-13: zona horaria del MFA reciente (`../docs/RESULTADOS_PRUEBAS.md`). |

### REQ-F-013 — Solicitudes de corrección o eliminación de datos

| Atributo | Valor |
|---|---|
| Descripción | El titular crea una solicitud (`POST /api/mi-cuenta/solicitud-cambio`, campos `nit`, `nombreUnidad`, `eliminacion`, `correccion`); el staff con `clientes.gestionar` la lista (`GET /solicitudes`) y aprueba/rechaza (`PATCH /solicitudes/:id`). Se encola aviso W8 con solo id y tipo. |
| Justificación | Derechos ARCO / Habeas Data. |
| Actor | ACT-03, ACT-05 |
| Origen | O1, O2 (`../docs/TRATAMIENTO_DATOS_PERSONALES.md` §3) |
| Evidencia | `../backend/src/routes/miCuenta.js`, tabla `solicitudes_cuenta` en `../backend/src/db.js` |
| Estado | PARCIALMENTE IMPLEMENTADO — API verificada (`mi-cuenta.spec.js`); sin pantallas para titular ni administrador (BUG-004, BUG-005) |
| Criterio de aceptación | CA-013 |
| Dependencias | REQ-F-035 |
| Observaciones | No existe borrado automático (BUG-015). |

## MOD-05/06 · Catálogo

### REQ-F-014 — Catálogo según el contexto

| Atributo | Valor |
|---|---|
| Descripción | `GET /api/productos` aplica `evaluarProducto` (contexto leído de MySQL): visitante y cuentas no habilitadas ven vitrina sin precio ni inventario; restringidos e instituciones ajenas se ocultan (404 en detalle); staff ve completo sin poder comprar. |
| Justificación | Evitar exposición de productos sensibles y precios institucionales (RN-007). |
| Actor | ACT-01 a ACT-06 |
| Origen | O1, O2 (`../docs/ARQUITECTURA_OBJETIVO.md`, `../docs/arquitectura-multitenant.md`) |
| Evidencia | `../backend/src/autorizacion.js`, `../backend/src/tenancy.js`, `../backend/src/routes/productos.js`, `../frontend/index.html` |
| Estado | IMPLEMENTADO Y VERIFICADO (reglas unitarias: `tenancy.test.js`, `assistant.spec.js` invitado); listado HTTP contra MySQL solo con evidencia histórica no reproducida |
| Criterio de aceptación | CA-014 |
| Dependencias | REQ-F-017, REQ-F-028 |
| Observaciones | — |

### REQ-F-015 — Detalle de producto y filtro por categoría

| Atributo | Valor |
|---|---|
| Descripción | `GET /api/productos/:id` (id numérico, 404 si no visible) y `GET /api/productos?categoria=`; `GET /api/categorias`, `GET /api/categorias/:id`. |
| Actor | ACT-01 a ACT-06 |
| Origen | O1, O3 |
| Evidencia | `../backend/src/routes/productos.js`, `../backend/src/routes/categorias.js`, `../frontend/producto-detalle.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Navegación del catálogo. CA-015 |
| Dependencias | REQ-F-014 |
| Observaciones | Defectos de orden de rutas corregidos históricamente (`../INFORME-INSPECCION.md` #11). |

### REQ-F-016 — Administrar productos, categorías e inventario bajo

| Atributo | Valor |
|---|---|
| Descripción | CRUD de productos (`POST/PUT/DELETE /api/productos`) y categorías, consulta `/api/productos/bajo-inventario`, todo con `catalogo.gestionar`; invalida el índice del asistente. |
| Actor | ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/CHANGELOG.md` 2026-10-13 tarde) |
| Evidencia | `../backend/src/routes/productos.js`, `../backend/src/routes/categorias.js`, `../frontend/admin-productos.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Mantener el catálogo. CA-016 |
| Dependencias | REQ-F-030, REQ-F-034 |
| Observaciones | Cambiar `restringido` o institución exige además `productos.cumplimiento`. |

### REQ-F-017 — Cumplimiento de productos

| Atributo | Valor |
|---|---|
| Descripción | Con `productos.cumplimiento`: marcar restringido, institución principal, elegibilidad M:N (`productos_elegibilidad`) y `revision_legal` (`no_requerida`, `pendiente`, `aprobada`, `bloqueada`) vía `GET /api/verificacion/admin/productos` y `PUT /admin/productos/:id/cumplimiento`. |
| Actor | ACT-05 |
| Origen | O1, O2 (`../docs/ARQUITECTURA_OBJETIVO.md`, `../docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md`) |
| Evidencia | `../backend/src/routes/verificacion.js`, `../backend/src/migraciones/001_verificacion_institucional.js`, `../frontend/admin-verificaciones.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO (evidencia histórica: integración K, H) |
| Justificación / Criterio | Control preventivo de venta de restringidos (RN-008). CA-017 |
| Dependencias | REQ-F-014 |
| Observaciones | Régimen legal de restringidos pendiente de validación jurídica. |

## MOD-07/08 · Compra, pagos y pedidos

### REQ-F-018 — Carrito en el navegador

| Atributo | Valor |
|---|---|
| Descripción | Guardar ids y cantidades en `localStorage`; el servidor nunca confía en precios del carrito. |
| Actor | ACT-01, ACT-03, ACT-04 |
| Origen | O1 |
| Evidencia | `../frontend/js/cart.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Selección de productos antes del checkout. CA-018 |
| Dependencias | REQ-F-019 |
| Observaciones | El comentario de cabecera de `cart.js` aún menciona `POST /api/pedidos` (retirado, responde 410). |

### REQ-F-019 — Checkout idempotente

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/checkout` exige JWT y cabecera `Idempotency-Key` (16–128); rechaza datos de tarjeta; relee contexto y productos con `FOR UPDATE`, calcula el total con precios de MySQL, verifica inventario, reserva unidades, cifra datos del comprador y dirección, crea pedido `pendiente_pago` y pago; si hay restringidos exige autorización de compra (403 `REQUIERE_AUTORIZACION_COMPRA`). |
| Actor | ACT-03, ACT-04 |
| Origen | O1, O2 (`../backend/README.md` "Checkout de Fase 1") |
| Evidencia | `../backend/src/routes/checkout.js`, `../frontend/checkout.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO (evidencia histórica: integración E, K, L) |
| Justificación / Criterio | Evitar doble cobro, manipulación de precio y sobreventa (RN-013). CA-019 |
| Dependencias | REQ-F-014, REQ-F-021, REQ-F-029 |
| Observaciones | 409 si la clave se reutiliza con otro cuerpo o falta inventario. |

### REQ-F-020 — Prellenar el checkout

| Atributo | Valor |
|---|---|
| Descripción | `GET /api/checkout/perfil` devuelve solo el perfil del `clienteId` autenticado con `Cache-Control: no-store`; el frontend rellena solo campos vacíos. |
| Actor | ACT-03, ACT-04 |
| Origen | O1, O2 (`../backend/README.md`) |
| Evidencia | `../backend/src/routes/checkout.js`, `../frontend/js/checkout-autofill.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `assistant.spec.js` (perfil checkout*) |
| Justificación / Criterio | Comodidad sin exposición. CA-020 |
| Dependencias | REQ-F-010 |
| Observaciones | — |

### REQ-F-021 — Pagos con proveedor mock

| Atributo | Valor |
|---|---|
| Descripción | Webhook `POST /api/pagos/webhook/mock` con HMAC-SHA256 sobre `timestamp.cuerpo` y ventana de 5 min, deduplicación por `evento_id`, validación de referencia, moneda e importe; simulación `POST /api/pagos/dev/simular-webhook` (resultado por centavos, RN-014; deshabilitada en producción); consulta `GET /api/pagos/:pedidoId/estado` solo del dueño. `POST /api/pagos/procesar` retirado (410). |
| Actor | ACT-03, ACT-08 |
| Origen | O1, O2 (`../backend/README.md`) |
| Evidencia | `../backend/src/routes/pagos.js`, `../backend/src/paymentProvider.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO (solo "estado requiere JWT / solo pedidos propios" cubierto por `assistant.spec.js`) |
| Justificación / Criterio | Flujo de pago completo sin cobros reales. CA-021 |
| Dependencias | REQ-F-019, REQ-F-025 |
| Observaciones | No es una pasarela de producción (REQ-F-040). |

### REQ-F-022 — Expirar pedidos pendientes y liberar reservas

| Atributo | Valor |
|---|---|
| Descripción | Job interno cada 60 s (lotes de 25) y endpoint `POST /api/automatizaciones/pedidos/expirar` (token W4) pasan pedido y pago a vencidos y liberan inventario en una transacción. |
| Actor | ACT-11, ACT-07 |
| Origen | O1, O2 (`../backend/README.md` "n8n — Fase 4") |
| Evidencia | `../backend/src/paymentJobs.js`, `../backend/src/inventoryReservations.js`, `../backend/src/routes/automatizaciones.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `paymentJobs.test.js` |
| Justificación / Criterio | No retener inventario indefinidamente (RN-016). CA-022 |
| Dependencias | REQ-F-019 |
| Observaciones | — |

### REQ-F-023 — Historial y cancelación de pedido propio

| Atributo | Valor |
|---|---|
| Descripción | `GET /api/pedidos` lista pedidos del cliente; `PUT /api/pedidos/:id/cancelar` cancela solo pedidos propios en `pendiente` o `pendiente_pago`, liberando reserva. |
| Actor | ACT-03, ACT-04 |
| Origen | O1 |
| Evidencia | `../backend/src/routes/pedidos.js`, `../frontend/mis-pedidos.html`, `../frontend/historial.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Seguimiento del cliente. CA-023 |
| Dependencias | REQ-F-019 |
| Observaciones | — |

### REQ-F-024 — Gestión de pedidos (administrador)

| Atributo | Valor |
|---|---|
| Descripción | Con `pedidos.gestionar`: `GET /api/pedidos/todos`, `GET /api/pedidos/:clienteId`, `PUT /api/pedidos/:id` (estado). |
| Actor | ACT-05 |
| Origen | O1 |
| Evidencia | `../backend/src/routes/pedidos.js`, `../frontend/admin-pedidos.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Operación logística. CA-024 |
| Dependencias | REQ-F-030, REQ-F-034 |
| Observaciones | Estados de pedido: pendiente, pendiente_pago, pagado, expirado, rechazado, confirmado, preparado, enviado, entregado, cancelado. |

### REQ-F-025 — Comprobante no-DIAN

| Atributo | Valor |
|---|---|
| Descripción | Solo un pago aprobado crea, en la misma transacción, un comprobante y tareas de `correo_outbox`: aviso al admin siempre y correo al cliente solo si `enviarComprobante=true`. `GET /api/comprobantes/:pedidoId` (JSON o `?format=pdf`) para el dueño o con enlace firmado (24 h); `POST /:pedidoId/reenviar` máximo 3 por hora. |
| Actor | ACT-03, ACT-04, ACT-10 |
| Origen | O1, O2 (`../backend/README.md` "Comprobantes y correos") |
| Evidencia | `../backend/src/routes/comprobantes.js`, `../backend/src/receiptService.js`, `../backend/src/receiptTokens.js`, `../backend/src/emailOutbox.js`, `../backend/src/email.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `receiptService.test.js`, `receiptTokens.test.js`, `receiptEmail.test.js` |
| Justificación / Criterio | Soporte de la compra (RN-015). CA-025 |
| Dependencias | REQ-F-021; `RECEIPT_LINK_SECRET`, `RECEIPT_LINK_BASE_URL` |
| Observaciones | No es factura electrónica. |

## MOD-10 · Clientes

### REQ-F-026 — Gestión de clientes

| Atributo | Valor |
|---|---|
| Descripción | Con `clientes.gestionar`: listar, consultar, crear, editar y eliminar clientes (`/api/clientes`), cifrando campos privados; conceder restringidos solo con `restringidos.autorizar` y cuenta aprobada. `POST /api/clientes/:id/dato-sensible` solo para el propio cliente o un admin, con consentimiento. |
| Actor | ACT-05; ACT-03 (dato sensible propio) |
| Origen | O1, O2 (`../docs/AUDITORIA_TECNICA.md` H5) |
| Evidencia | `../backend/src/routes/clientes.js`, `../frontend/admin-clientes.html` |
| Estado | IMPLEMENTADO Y VERIFICADO (controles de acceso) — `account-registration-phase0.spec.js` |
| Justificación / Criterio | Gestión de fichas con mínimo privilegio. CA-026 |
| Dependencias | REQ-F-030 |
| Observaciones | El consentimiento del dato sensible no concede autorización de compra. |

## MOD-04 · Verificación institucional y en la compra

### REQ-F-027 — Solicitar verificación institucional

| Atributo | Valor |
|---|---|
| Descripción | En *Mi verificación*: consultar la solicitud (`GET /api/verificacion/mi-solicitud`), subir documentos (validación por firma PDF/PNG/JPEG, 5 MB, 10 por cliente, cifrados en `DOCUMENTOS_DIR`), registrar el identificador CC/CE con `autorizaTratamiento: true` (cifrado v2 + índice HMAC, últimos 3 dígitos visibles), elegir clasificación y enviar (idempotente con `Idempotency-Key`). |
| Actor | ACT-03 |
| Origen | O1, O2 (`../docs/ARQUITECTURA_VERIFICACION.md`, `../docs/POLITICA_VERIFICACION_IDENTIDAD.md`) |
| Evidencia | `../backend/src/routes/verificacion.js`, `../backend/src/verificacion.js`, `../backend/src/verificacionCompra.js`, `../frontend/mi-verificacion.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO (normalización, HMAC y cifrado v2 sí verificados en `verificacion-compra.test.js`; flujo HTTP solo histórico) |
| Justificación / Criterio | Acreditar el vínculo para restringidos (RN-009). CA-027 |
| Dependencias | `CRYPTO_KEYS`, `IDENT_HMAC_KEY`; REQ-NF-001 |
| Observaciones | Límite 30 subidas/hora por IP. Sin antivirus (deuda conocida). |

### REQ-F-028 — Revisar la verificación y decidir

| Atributo | Valor |
|---|---|
| Descripción | Staff con permisos: listar y ver solicitudes (`verificacion.ver`), registrar comprobaciones (`vinculo_documental`, `canal_independiente`, `entidad`), decidir (`verificacion.decidir`) según tabla de decisión con cuatro ojos, cambio de tipo, suspender/reactivar (`cuentas.suspender`), conceder restringidos (`restringidos.autorizar`), descargar documentos (`documentos.ver`, auditado), revelar identificador (`identificadores.ver` + justificación). |
| Actor | ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/POLITICA_VERIFICACION_IDENTIDAD.md` §4) |
| Evidencia | `../backend/src/routes/verificacion.js`, `../backend/src/verificacionCompra.js` (`decidirSolicitud`), `../frontend/admin-verificaciones.html` |
| Estado | IMPLEMENTADO Y VERIFICADO (tabla de decisión: `verificacion-compra.test.js`); flujo HTTP solo evidencia histórica |
| Justificación / Criterio | Reducir falsos positivos (RN-011, RN-012, RN-020). CA-028 |
| Dependencias | REQ-F-027, REQ-F-034, REQ-F-035 |
| Observaciones | Ninguna combinación aprueba o rechaza automáticamente. |

### REQ-F-029 — Autorización por compra de restringidos

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/verificacion/compra/autorizacion` envía un código al correo ligado al usuario, cliente, solicitud aprobada y hash del carrito; `POST /compra/autorizacion/confirmar` lo valida (5 intentos); el checkout consume la autorización en su transacción (un solo uso). |
| Actor | ACT-04 |
| Origen | O1, O2 (`../docs/ARQUITECTURA_VERIFICACION.md` §2) |
| Evidencia | `../backend/src/routes/verificacion.js`, `../backend/src/routes/checkout.js`, `../frontend/checkout.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO (hash del carrito verificado en `verificacion-compra.test.js`) |
| Justificación / Criterio | Segundo control por operación. CA-029 |
| Dependencias | REQ-F-028, REQ-F-019 |
| Observaciones | Límite 20 peticiones/15 min por IP. El código va al mismo correo que el MFA (riesgo residual documentado). |

### REQ-F-030 — Personal, permisos, superadministrador y diagnóstico

| Atributo | Valor |
|---|---|
| Descripción | Con `staff.permisos`: listar permisos, asignar (`PUT /admin/permisos/:usuarioId`) y crear personal (`POST /admin/personal`, contraseña temporal a cambiar). Superadmin solo por `scripts/crear-superadmin.js --confirmar-base`; `GET /admin/diagnostico` solo superadmin. |
| Actor | ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md`) |
| Evidencia | `../backend/src/routes/verificacion.js`, `../backend/src/autorizacion.js`, `../backend/scripts/crear-superadmin.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO (evidencia histórica: compra-verificada 15, 16) |
| Justificación / Criterio | Mínimo privilegio (RN-017, RN-018). CA-030 |
| Dependencias | REQ-F-009, REQ-F-034 |
| Observaciones | — |

## MOD-11/12/13 · Asistente, atención, reportes y auditoría

### REQ-F-031 — Asistente de catálogo

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/asistente/mensaje` (≤500 caracteres, 20/min por IP) responde por reglas sobre el índice del catálogo visible para el usuario; modo `ASSISTANT_MODE=llm` solo con Ollama local y plan JSON validado; `GET /sugerencias`; preguntas no resueltas en `asistente_pendientes`; `GET /pendientes/resumen-semanal` con token. |
| Actor | ACT-01 a ACT-04, ACT-07 |
| Origen | O1, O2 (`../backend/ASISTENTE-CATALOGO.md`) |
| Evidencia | `../backend/src/routes/asistente.js`, `../backend/src/assistant/*`, `../frontend/js/chatbot.js` |
| Estado | IMPLEMENTADO Y VERIFICADO — `assistant.spec.js` |
| Justificación / Criterio | Atención automatizada sin filtrar datos. CA-031 |
| Dependencias | REQ-F-014 |
| Observaciones | Las FAQ sembradas contienen textos `[COMPLETAR: …]` pendientes del negocio (`../backend/src/db.js`). |

### REQ-F-032 — Calificación de atención y solicitudes de contacto

| Atributo | Valor |
|---|---|
| Descripción | `POST /api/atencion/calificacion` (1–5, comentario ≤1000); `POST /api/atencion/solicitudes` (PQRS/soporte/cotización, NIT 9–10 dígitos y correo cifrados, autorización de datos, 5 por 15 min, campo trampa `website`) devuelve radicado `SI-00000000`. |
| Actor | ACT-01, ACT-03 |
| Origen | O1, O2 (`../docs/arquitectura-multitenant.md` "Solicitudes y normatividad") |
| Evidencia | `../backend/src/routes/atencion.js`, `../frontend/contacto.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Canal de contacto institucional. CA-032 |
| Dependencias | REQ-NF-001 |
| Observaciones | BUG-002: la calificación no tiene autenticación ni límite. No existe pantalla para gestionar `solicitudes_contacto`. |

### REQ-F-033 — Reportes

| Atributo | Valor |
|---|---|
| Descripción | `GET /api/reportes/mensual` (atenciones, escalados, promedio, sugerencias ≤3, pedidos por estado, top 5 vendidos); `/api/mis-reportes` CRUD de reportes/sugerencias del cliente autenticado. |
| Actor | ACT-05 (reporte mensual), ACT-03 (mis-reportes) |
| Origen | O1 |
| Evidencia | `../backend/src/routes/reportes.js`, `../backend/src/routes/misreportes.js`, `../frontend/reportes.html`, `../frontend/mis-reportes.html` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Indicadores de servicio. CA-033 |
| Dependencias | REQ-F-032 |
| Observaciones | **BUG-001**: el reporte mensual no exige autenticación. |

### REQ-F-034 — Auditoría administrativa

| Atributo | Valor |
|---|---|
| Descripción | Registrar acciones (crear, editar, eliminar, aprobar_registro, rechazar_registro, ver_solicitud_registro, ver_documento, cuenta_suspender, etc.) en `auditoria`; consultar con `auditoria.ver` (`GET /api/auditoria?limite=&entidad=`, máx. 500). |
| Actor | ACT-05, ACT-06 |
| Origen | O1, O2 (`../docs/MODELO_DATOS.md`) |
| Evidencia | `../backend/src/auditoria.js`, `../backend/src/routes/auditoria.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO (la auditoría de campos de mi-cuenta sí está verificada en `mi-cuenta.spec.js`) |
| Justificación / Criterio | Trazabilidad. CA-034 |
| Dependencias | — |
| Observaciones | No existe pantalla dedicada de auditoría en `../frontend/` (consulta por API). |

## MOD-14/15/17 · Automatización, persistencia y frontend transversal

### REQ-F-035 — Eventos firmados hacia n8n

| Atributo | Valor |
|---|---|
| Descripción | `automation_outbox` (W1, W3, W6, W8, W11) firma con HMAC y reintenta (máx. 8, backoff); endpoints `/api/automatizaciones/*` con `x-automation-token` propio (W2, W4, W11 mantenimiento); resultado W11 con HMAC + nonce; avisos W12 `{evento, solicitud_id, resultado}`. |
| Actor | ACT-07, ACT-11 |
| Origen | O1, O2 (`../backend/README.md`, `../docs/FLUJO_N8N_VERIFICACION.md`, `../docs/REGISTRO_VERIFICADO.md` §4) |
| Evidencia | `../backend/src/automationOutbox.js`, `../backend/src/automationSignatures.js`, `../backend/src/automationAuth.js`, `../backend/src/seguridad/avisosN8n.js`, `../backend/src/routes/automatizaciones.js` |
| Estado | IMPLEMENTADO Y VERIFICADO (lado backend y código de nodos) — `automation.test.js`, `registro-verificado.test.js`, `verificacion-compra.test.js` |
| Justificación / Criterio | n8n notifica, no decide. CA-035 |
| Dependencias | REQ-NF-008 |
| Observaciones | BUG-014 (NIT hacia W11, decisión pendiente). |

### REQ-F-036 — Workflows n8n operativos

| Atributo | Valor |
|---|---|
| Descripción | Los workflows W1–W12 deben estar importados, con credenciales y activos en una instancia n8n. |
| Actor | ACT-07 |
| Origen | O2 (`../docs/FLUJO_N8N_VERIFICACION.md` §7, `../backend/README.md`) |
| Evidencia | `../n8n/workflows/*.json` (todos `active: false`), `../n8n/docker-compose.yml` |
| Estado | NO DETERMINADO (instancia no accesible en esta auditoría) |
| Justificación / Criterio | Avisos operativos. CA-036 |
| Dependencias | REQ-F-035 |
| Observaciones | W5 y W9 sin uso desde 2026-10-15. |

### REQ-F-037 — Migraciones al arrancar y reversión

| Atributo | Valor |
|---|---|
| Descripción | `migrar()` crea tablas (`CREATE TABLE IF NOT EXISTS`), aplica ALTER tolerantes, siembra categorías/productos y aplica migraciones versionadas 001–003 registradas en `schema_migraciones`; `node scripts/migraciones.js estado | revertir <versión> --confirmo-perdida-de-datos`. |
| Actor | ACT-11, operador |
| Origen | O1, O2 (`../docs/MODELO_DATOS.md`, `../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md`) |
| Evidencia | `../backend/src/db.js`, `../backend/src/migraciones/`, `../backend/sql/003_registro_verificado.sql`, `../backend/scripts/migraciones.js` |
| Estado | IMPLEMENTADO Y VERIFICADO (idempotencia de la migración de cuenta: `db-account-migration.spec.js`); reversión solo evidencia histórica |
| Justificación / Criterio | Despliegue sin pasos SQL manuales. CA-037 |
| Dependencias | — |
| Observaciones | Riesgo RSK-003: arrancar contra producción aplica migraciones. |

### REQ-F-038 — Interfaz multilenguaje

| Atributo | Valor |
|---|---|
| Descripción | Selector de idioma y traducción con atributos `data-i18n`. |
| Actor | ACT-01 a ACT-06 |
| Origen | O1, O2 (`../README.md`: "selector de idioma") |
| Evidencia | `../frontend/js/i18n.js` |
| Estado | PARCIALMENTE IMPLEMENTADO — páginas nuevas (mi-verificacion, checkout, contacto, leyes, cambiar-password, admin-solicitudes/verificaciones/productos) con 0–1 claves (BUG-016) |
| Justificación / Criterio | Accesibilidad lingüística. CA-038 |
| Dependencias | — |
| Observaciones | — |

### REQ-F-039 — Portada, normatividad y navegación común

| Atributo | Valor |
|---|---|
| Descripción | `landing.html` como entrada (redirección desde `/`), `leyes.html` con referencias normativas informativas, menú común (`global-layout.js`, `navbar.js`) y paleta por institución (`tenant-ui.css`). |
| Actor | ACT-01 a ACT-06 |
| Origen | O1 |
| Evidencia | `../backend/src/app.js` (`/` → `/landing.html`), `../frontend/landing.html`, `../frontend/leyes.html`, `../frontend/js/global-layout.js` |
| Estado | IMPLEMENTADO, NO VERIFICADO |
| Justificación / Criterio | Navegación consistente. CA-039 |
| Dependencias | — |
| Observaciones | `leyes.html` no constituye asesoría jurídica. |

### REQ-F-040 — Pasarela de pagos real

| Atributo | Valor |
|---|---|
| Descripción | Integrar un proveedor real (widget/tokenización) para `PAYMENT_MODE=sandbox` y `prod`. |
| Actor | ACT-03, ACT-08 |
| Origen | O2 (`../backend/README.md`: "El widget de una pasarela real permanece para la fase 5") |
| Evidencia | `../backend/src/paymentProvider.js` (`crearPaymentProvider` lanza error para modos distintos de mock; el mock está prohibido con `NODE_ENV=production`) |
| Estado | DOCUMENTADO, NO IMPLEMENTADO |
| Justificación / Criterio | Operación comercial real. CA-040 |
| Dependencias | REQ-F-019, REQ-F-021 |
| Observaciones | Consecuencia [INF]: con `NODE_ENV=production` hoy el backend no arranca con ningún modo de pago. |

## Referencias

- [06_REQUERIMIENTOS_NO_FUNCIONALES.md](06_REQUERIMIENTOS_NO_FUNCIONALES.md), [07_REGLAS_DE_NEGOCIO.md](07_REGLAS_DE_NEGOCIO.md), [11_MATRIZ_DE_TRAZABILIDAD.md](11_MATRIZ_DE_TRAZABILIDAD.md)
- [../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md](../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md)
