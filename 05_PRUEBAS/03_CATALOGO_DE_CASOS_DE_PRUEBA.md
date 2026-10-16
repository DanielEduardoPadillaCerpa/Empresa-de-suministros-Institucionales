# Catálogo de casos de prueba

| Campo | Valor |
|---|---|
| ID documental | DOC-05-03 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar todos los casos de prueba de la plataforma, vinculados a sus requerimientos, con el estado real al 2026-10-16.

## Alcance

- TC-001…TC-040 ↔ REQ-F-001…REQ-F-040 (funcionales; detalle de ejecución en [04_PRUEBAS_FUNCIONALES.md](04_PRUEBAS_FUNCIONALES.md)).
- TC-101…TC-117 ↔ REQ-NF-001…REQ-NF-017 (no funcionales).
- TC-201…TC-212 seguridad (detalle en [06_PRUEBAS_DE_SEGURIDAD.md](06_PRUEBAS_DE_SEGURIDAD.md)).

Reglas de estado: ver [02_ESTRATEGIA_Y_ALCANCE_DE_PRUEBAS.md §3](02_ESTRATEGIA_Y_ALCANCE_DE_PRUEBAS.md). "APROBADO" = cubierto por la corrida de `npm test` del 2026-10-16 (Jest 107/107, `node:test` 51/51; evidencia en [13_EVIDENCIAS/2026-10-16_resumen_npm_test.md](13_EVIDENCIAS/2026-10-16_resumen_npm_test.md)). "Evidencia histórica" = [`docs/RESULTADOS_PRUEBAS.md`](../docs/RESULTADOS_PRUEBAS.md) (2026-10-13), no reproducida.

Rutas de pruebas automatizadas relativas a `backend/test/`.

## 1. Resumen

| TC | REQ | Título | Estado |
|---|---|---|---|
| TC-001 | REQ-F-001 | Solicitar cuenta (registro verificado) | APROBADO |
| TC-002 | REQ-F-002 | Verificar terna contra el padrón cifrado | APROBADO |
| TC-003 | REQ-F-003 | Sincronizar el padrón desde la fuente | BLOQUEADO |
| TC-004 | REQ-F-004 | Gestionar solicitudes de registro | APROBADO |
| TC-005 | REQ-F-005 | Login paso 1 | APROBADO |
| TC-006 | REQ-F-006 | Segundo factor por correo | APROBADO (sub-caso cancelar NO EJECUTADO) |
| TC-007 | REQ-F-007 | Revocación por session_version y estado | APROBADO |
| TC-008 | REQ-F-008 | Refresh rotativo y logout | BLOQUEADO |
| TC-009 | REQ-F-009 | Cambio obligatorio de contraseña inicial | APROBADO |
| TC-010 | REQ-F-010 | Consultar y editar perfil propio (API) | APROBADO (API) — pantalla inexistente, BUG-004 |
| TC-011 | REQ-F-011 | Cambio de correo con código | APROBADO (API) — pantalla inexistente, BUG-004 |
| TC-012 | REQ-F-012 | Cambio de contraseña y cerrar sesiones | APROBADO |
| TC-013 | REQ-F-013 | Solicitudes de corrección/eliminación | APROBADO (API) — pantallas inexistentes, BUG-004/005 |
| TC-014 | REQ-F-014 | Catálogo según contexto | APROBADO (reglas); sub-caso HTTP BLOQUEADO |
| TC-015 | REQ-F-015 | Detalle y filtro por categoría | BLOQUEADO |
| TC-016 | REQ-F-016 | Administrar productos y categorías | BLOQUEADO |
| TC-017 | REQ-F-017 | Cumplimiento de productos | BLOQUEADO |
| TC-018 | REQ-F-018 | Carrito en localStorage | NO EJECUTADO |
| TC-019 | REQ-F-019 | Checkout idempotente con reserva | BLOQUEADO |
| TC-020 | REQ-F-020 | Prellenado del checkout | APROBADO |
| TC-021 | REQ-F-021 | Pago mock por webhook | BLOQUEADO (sub-caso consulta de estado APROBADO) |
| TC-022 | REQ-F-022 | Expiración de pedidos y liberación de reservas | APROBADO |
| TC-023 | REQ-F-023 | Historial y cancelación de pedido propio | BLOQUEADO |
| TC-024 | REQ-F-024 | Gestión de pedidos (admin) | BLOQUEADO |
| TC-025 | REQ-F-025 | Comprobantes y correos | APROBADO |
| TC-026 | REQ-F-026 | Gestión de clientes (controles de acceso) | APROBADO |
| TC-027 | REQ-F-027 | Solicitar verificación institucional | BLOQUEADO (sub-caso normalización/HMAC/cifrado APROBADO) |
| TC-028 | REQ-F-028 | Revisión con doble comprobación | APROBADO (tabla de decisión); sub-caso HTTP BLOQUEADO |
| TC-029 | REQ-F-029 | Autorización por compra de restringidos | BLOQUEADO (sub-caso hash del carrito APROBADO) |
| TC-030 | REQ-F-030 | Personal, permisos, superadmin, diagnóstico | BLOQUEADO |
| TC-031 | REQ-F-031 | Asistente de catálogo | APROBADO |
| TC-032 | REQ-F-032 | Calificación y solicitudes de contacto | BLOQUEADO |
| TC-033 | REQ-F-033 | Reportes | BLOQUEADO |
| TC-034 | REQ-F-034 | Auditoría | BLOQUEADO (sub-caso auditoría de campos APROBADO) |
| TC-035 | REQ-F-035 | Eventos firmados hacia n8n | APROBADO |
| TC-036 | REQ-F-036 | Workflows n8n operativos | BLOQUEADO |
| TC-037 | REQ-F-037 | Migraciones al arrancar y reversión | APROBADO (idempotencia); sub-caso reversión BLOQUEADO |
| TC-038 | REQ-F-038 | Multilenguaje | NO EJECUTADO |
| TC-039 | REQ-F-039 | Portada, normatividad, navegación | NO EJECUTADO |
| TC-040 | REQ-F-040 | Pasarela de pago real | PENDIENTE |
| TC-101 | REQ-NF-001 | Cifrado por campo e índices ciegos | APROBADO |
| TC-102 | REQ-NF-002 | Contraseñas bcrypt 10–72 | APROBADO |
| TC-103 | REQ-NF-003 | Validación de secretos al arrancar | APROBADO |
| TC-104 | REQ-NF-004 | Limitación de solicitudes por IP | APROBADO (parcial) |
| TC-105 | REQ-NF-005 | Cabeceras de seguridad | NO EJECUTADO |
| TC-106 | REQ-NF-006 | Tiempos de respuesta | BLOQUEADO |
| TC-107 | REQ-NF-007 | Máximo 4 conexiones MySQL | NO EJECUTADO |
| TC-108 | REQ-NF-008 | Minimización de datos hacia n8n | APROBADO |
| TC-109 | REQ-NF-009 | Sin secretos en logs y respuestas | BLOQUEADO |
| TC-110 | REQ-NF-010 | Resiliencia (outbox, jobs) | APROBADO (parcial) |
| TC-111 | REQ-NF-011 | Plataforma (Node, MySQL) | NO EJECUTADO |
| TC-112 | REQ-NF-012 | Suites automatizadas | APROBADO |
| TC-113 | REQ-NF-013 | Diseño adaptable | NO EJECUTADO |
| TC-114 | REQ-NF-014 | Accesibilidad del widget | APROBADO (parcial) |
| TC-115 | REQ-NF-015 | Sesión fuera de localStorage | PENDIENTE |
| TC-116 | REQ-NF-016 | HTTPS/TLS y HSTS | PENDIENTE |
| TC-117 | REQ-NF-017 | Cumplimiento Ley 1581 | BLOQUEADO |
| TC-201…TC-212 | — | Seguridad (ver §4) | 4 APROBADO · 4 NO EJECUTADO · 4 BLOQUEADO |

## 2. Casos funcionales

### TC-001 — Solicitar cuenta (registro verificado)
- **Objetivo:** comprobar que el registro crea una solicitud pendiente, exige captcha y aceptaciones y responde 202 genérico.
- **REQ:** REQ-F-001 · RN-001, RN-004, RN-006
- **Precondiciones:** `ENC_KEY`/`HMAC_KEY` configuradas (las pruebas las generan al vuelo); captcha emitido por `GET /api/auth/captcha`.
- **Datos:** nombre "Juan Camilo Rodríguez", NIT `999000001-2`, correo `juan.rodriguez@prueba.test`, contraseña sintética de 10–72 caracteres, tipo `policia`.
- **Pasos:** 1) obtener captcha; 2) `POST /api/auth/registro` sin captcha; 3) con campos ajenos; 4) válido; 5) repetir con el mismo correo.
- **Esperado:** 2) 400 `CAPTCHA_INVALIDO`; 3) 400; 4) 202 `solicitud_recibida`, `usuarios.estado_cuenta='pendiente'`; 5) misma respuesta 202.
- **Observado (2026-10-16):** las pruebas automatizadas correspondientes pasaron.
- **Estado:** APROBADO
- **Evidencia:** `account-registration-phase0.spec.js` («el registro válido crea una solicitud pendiente y responde 202 genérico», «un correo ya registrado recibe exactamente la misma respuesta», «sin captcha resuelto no se procesa el registro», «el registro exige aceptar los términos y el tratamiento de datos», «el registro rechaza datos ajenos al formulario…», «el registro no permite vincular la cuenta a un clienteId…», «el autorregistro rechaza cualquier intento de asignar autorización general»); `registro-verificado.test.js` («flujo: registro → pendiente → aprobación → login con MFA»).
- **Observaciones:** base simulada; el flujo contra MySQL real es histórico.

### TC-002 — Verificar terna NIT + nombre + institución
- **Objetivo:** comprobar los seis resultados de verificación y la normalización.
- **REQ:** REQ-F-002 · RN-002
- **Precondiciones:** padrón simulado con una persona `999000001` / Juan Camilo Rodríguez / policía.
- **Datos:** variantes de NIT (`999.000.001-2`, `999000001`), nombre en otro orden, institución `defensa`, NIT `123456789`.
- **Pasos:** invocar `verificarEnPadron` con cada variante; simular caída de la fuente.
- **Esperado:** `coincide`, `institucion_no_coincide`, `nombre_no_coincide`, `nit_no_existe`, `padron_no_disponible` según el caso.
- **Observado:** pasó.
- **Estado:** APROBADO
- **Evidencia:** `registro-verificado.test.js` («padrón: NIT + nombre + institución», «padrón: una caída de la base se marca como padron_no_disponible», «NIT: solo dígitos y sin dígito de verificación», «nombre: sin tildes, mayúsculas, solo letras y palabras ordenadas», «padrón: el detalle para el administrador trae el nombre del padrón descifrado»).
- **Observaciones:** el resultado `persona_inactiva` no tiene una prueba con nombre propio [OBS].

### TC-003 — Sincronizar el padrón desde la fuente
- **Objetivo:** comprobar la copia cifrada de `personas_institucionales_prueba` a `padron_institucional`, la huella y el marcado de inactivas.
- **REQ:** REQ-F-003
- **Precondiciones:** fuente MySQL de laboratorio (`PADRON_DB_URI`) y base destino de prueba.
- **Datos:** filas sintéticas en una fuente de prueba.
- **Pasos:** `npm run padron:importar`; modificar/eliminar una fila; volver a importar.
- **Esperado:** filas cifradas (`nit_hash`, `nombre_cifrado`), sin reescribir filas sin cambios, eliminadas → `inactiva`; la fuente no se modifica.
- **Observado:** No ejecutado en esta auditoría.
- **Estado:** BLOQUEADO (requiere fuente y base MySQL de prueba)
- **Evidencia:** `backend/scripts/importar-padron.js`, `backend/src/seguridad/padron.js`.
- **Observaciones:** no existe prueba automatizada de la sincronización.

### TC-004 — Gestionar solicitudes de registro
- **Objetivo:** listar, ver detalle, aprobar (con confirmación si no coincide), rechazar con motivo y contar pendientes.
- **REQ:** REQ-F-004 · RN-003
- **Precondiciones:** administrador con `clientes.gestionar` y MFA; una solicitud pendiente.
- **Datos:** solicitud sintética con resultado `nombre_no_coincide`.
- **Pasos:** `GET /api/admin/solicitudes`, `GET /:id`, `POST /:id/aprobar` sin y con `{confirmar:true}`, `POST /:id/rechazar` con motivo corto y válido, `GET /contador`.
- **Esperado:** lista sin NIT ni nombre; aprobar sin confirmar → 409 `CONFIRMACION_REQUERIDA`; con confirmar → 200; motivo <5 → 400; decisión repetida → 409 `YA_DECIDIDA`.
- **Observado:** pasó.
- **Estado:** APROBADO
- **Evidencia:** `registro-verificado.test.js` («flujo: una verificación que no coincide exige confirmación explícita; el rechazo lleva motivo», «flujo: captcha, validación y acceso al panel», «flujo: registro → pendiente → aprobación → login con MFA»).
- **Observaciones:** la pantalla `frontend/admin-solicitudes.html` no tiene prueba de interfaz.

### TC-005 — Login paso 1
- **Objetivo:** validar correo + contraseña + captcha, mensaje por estado de cuenta solo tras validar la contraseña.
- **REQ:** REQ-F-005 · RN-005, RN-023
- **Precondiciones:** cuentas sintéticas pendiente y activa.
- **Datos:** `juan.rodriguez@prueba.test`, contraseña correcta e incorrecta.
- **Pasos:** login con cuenta pendiente; con contraseña incorrecta; con cuenta activa.
- **Esperado:** pendiente → 403 `CUENTA_PENDIENTE`; incorrecta → 401 genérico; activa → 202 con `challengeId`.
- **Observado:** pasó.
- **Estado:** APROBADO
- **Evidencia:** `registro-verificado.test.js` («flujo: registro → pendiente → aprobación → login con MFA»); `mi-cuenta.spec.js` («el inicio de sesión acepta el correo nuevo y vuelve a solicitar MFA»).
- **Observaciones:** la igualdad de tiempos con el hash de relleno no se mide.

### TC-006 — Segundo factor por correo
- **Objetivo:** verificar, reenviar y cancelar el código MFA.
- **REQ:** REQ-F-006 · RN-005
- **Precondiciones:** reto MFA emitido; correo simulado.
- **Datos:** código capturado del correo simulado; código erróneo.
- **Pasos:** a) verificar con código correcto; b) `POST /api/auth/mfa/cancelar`; c) reenviar.
- **Esperado:** a) JWT + refresh, `mfaVerified: true`; b) reto cancelado; c) nuevo código por correo directo, nunca por n8n.
- **Observado:** a) y c) pasaron; b) no ejecutado.
- **Estado:** APROBADO (TC-006.b cancelar: NO EJECUTADO)
- **Evidencia:** `registro-verificado.test.js` (flujo login con MFA); `mi-cuenta.spec.js` («el código MFA se envía por correo directo, en segundo plano y nunca a n8n», «el reenvío MFA genera un código nuevo y lo envía por correo»).

### TC-007 — Revocación de sesión
- **Objetivo:** un JWT vigente deja de servir si sube `session_version` o la cuenta no está activa.
- **REQ:** REQ-F-007 · RN-021
- **Precondiciones:** sesión con MFA.
- **Pasos:** incrementar `session_version`; repetir petición autenticada.
- **Esperado:** 401 «La sesión fue revocada».
- **Observado:** pasó.
- **Estado:** APROBADO
- **Evidencia:** `mi-cuenta.spec.js` («un JWT anterior queda rechazado cuando aumenta session_version», «una versión de sesión obsoleta revoca también el access token»).
- **Observaciones:** el caso de cuenta suspendida con JWT vigente es histórico (integración I).

### TC-008 — Refresh rotativo y logout
- **Objetivo:** el refresh token se rota en cada uso y el logout lo revoca.
- **REQ:** REQ-F-008
- **Precondiciones:** base MySQL de pruebas, sesión con MFA.
- **Pasos:** `POST /api/auth/refresh` dos veces con el mismo token; `POST /api/auth/logout`; refrescar de nuevo.
- **Esperado:** primer uso 200 con token nuevo; reuso 401; tras logout 401.
- **Observado:** No ejecutado en esta auditoría.
- **Estado:** BLOQUEADO (requiere MySQL de pruebas)
- **Evidencia:** `backend/src/routes/auth.js` (rutas `/refresh`, `/logout`). Sin prueba automatizada específica.

### TC-009 — Cambio obligatorio de contraseña inicial
- **Objetivo:** con `debe_cambiar_password` solo se permite consultar la cuenta y cambiar la contraseña.
- **REQ:** REQ-F-009
- **Pasos:** sesión de usuario con contraseña inicial; pedir otra ruta; cambiar la contraseña.
- **Esperado:** 403 `PASSWORD_CHANGE_REQUIRED` en otras rutas.
- **Observado:** pasó.
- **Estado:** APROBADO
- **Evidencia:** `mi-cuenta.spec.js` («con contraseña inicial pendiente solo se permite cambiarla»).

### TC-010 — Perfil propio
- **Objetivo:** `GET`/`PATCH /api/mi-cuenta` solo sobre el cliente del JWT y con lista blanca de campos.
- **REQ:** REQ-F-010 · RN-021
- **Datos:** teléfono colombiano sintético, texto con HTML.
- **Esperado:** campos ajenos → 400 sin escribir; HTML → 400; teléfono normalizado; auditoría solo con nombres de campos.
- **Observado:** pasó.
- **Estado:** APROBADO (API)
- **Evidencia:** `mi-cuenta.spec.js` («GET devuelve únicamente el perfil asociado al cliente del JWT», «PATCH rechaza campos fuera de la allowlist…», «PATCH normaliza el teléfono y audita nombres de campos sin sus valores», «PATCH rechaza HTML, teléfonos no colombianos…»).
- **Observaciones:** no existe pantalla de Mi cuenta (BUG-004).

### TC-011 — Cambio de correo con código
- **Objetivo:** solicitud con contraseña actual, código al correo nuevo, confirmación que sincroniza correos y revoca sesiones.
- **REQ:** REQ-F-011
- **Esperado:** sin contraseña no se inicia; duplicado → respuesta genérica; código incorrecto/vencido/reutilizado no cambia nada; confirmación revoca sesiones y avisa al correo anterior; fallos intermedios revierten.
- **Observado:** pasó.
- **Estado:** APROBADO (API)
- **Evidencia:** `mi-cuenta.spec.js` (bloque «cambio de correo con verificación MFA», 8 pruebas, incluidas «confirmar sincroniza ambos correos…» y «si falla la auditoría transaccional, tampoco confirma el cambio de correo»).
- **Observaciones:** sin pantalla (BUG-004).

### TC-012 — Cambio de contraseña y cerrar sesiones
- **REQ:** REQ-F-012
- **Esperado:** sin MFA en los últimos 15 min → rechazo; con MFA → cambia y revoca sesiones; cerrar todas → refresh revocados y `session_version` +1.
- **Observado:** pasó.
- **Estado:** APROBADO
- **Evidencia:** `mi-cuenta.spec.js` («cambio de contraseña exige MFA reciente y revoca todas las sesiones», «sin MFA en los últimos 15 minutos no cambia la contraseña», «cerrar todas las sesiones revoca refresh y aumenta la versión de sesión»).
- **Observaciones:** "cerrar todas" no tiene pantalla; `cambiar-password.html` sin prueba de interfaz en esta corrida.

### TC-013 — Solicitudes de corrección/eliminación de datos
- **REQ:** REQ-F-013
- **Esperado:** n8n recibe solo id y tipo; solo admin con `clientes.gestionar` resuelve.
- **Observado:** pasó.
- **Estado:** APROBADO (API)
- **Evidencia:** `mi-cuenta.spec.js` («la solicitud de privacidad encola al n8n solo id y tipo», «solo un administrador con clientes.gestionar puede resolver solicitudes de cuenta», «un administrador sin clientes.gestionar no resuelve solicitudes de cuenta»).
- **Observaciones:** BUG-004 y BUG-005 (sin pantallas).

### TC-014 — Catálogo según contexto
- **REQ:** REQ-F-014 · RN-007, RN-008
- **Datos:** productos sintéticos general, de otra institución y restringido.
- **Esperado:** invitado sin precio, inventario, restricción ni metadatos; producto de otra institución no visible; asistente invitado no revela productos.
- **Observado:** reglas unitarias pasaron.
- **Estado:** APROBADO (reglas) · TC-014.b listado/detalle HTTP contra MySQL: BLOQUEADO (evidencia histórica: escenarios A–E)
- **Evidencia:** `tenancy.test.js` («un producto general es visible en todos los catálogos, no así uno de otro tenant», «la respuesta de invitado no expone precio, inventario, restricción ni metadatos»); `assistant.spec.js` («el asistente invitado no revela productos, precios ni disponibilidad»).

### TC-015 — Detalle y filtro por categoría
- **REQ:** REQ-F-015 · **Pasos:** `GET /api/productos?categoria=…`, `GET /api/productos/:id`. **Esperado:** filtro aplicado; detalle según contexto; inexistente → 404.
- **Observado:** No ejecutado en esta auditoría. **Estado:** BLOQUEADO (MySQL de pruebas). **Evidencia:** `backend/src/routes/productos.js`.

### TC-016 — Administrar productos y categorías
- **REQ:** REQ-F-016 · **Precondiciones:** staff con `catalogo.gestionar`. **Pasos:** crear, editar, retirar producto y categoría; `GET /api/productos/bajo-inventario`; repetir sin permiso.
- **Esperado:** con permiso 2xx; sin permiso 403; `restringido="false"` por FormData no marca restringido.
- **Observado:** No ejecutado en esta auditoría. **Estado:** BLOQUEADO. **Evidencia:** `routes/productos.js`, `routes/categorias.js`; histórico en `docs/AUDITORIA_TECNICA.md` (H7).

### TC-017 — Cumplimiento de productos
- **REQ:** REQ-F-017 · RN-008 · **Pasos:** `PUT /api/verificacion/admin/productos/:id/cumplimiento` con y sin `productos.cumplimiento`; cambiar `revision_legal`.
- **Esperado:** sin permiso 403; `pendiente`/`bloqueada` impiden la venta; elegibilidad M:N habilita otra institución.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO. **Evidencia:** histórico integración K, H.

### TC-018 — Carrito
- **REQ:** REQ-F-018 · **Pasos:** en navegador, agregar, cambiar cantidades, recargar. **Esperado:** el carrito persiste en `localStorage` con id y cantidad.
- **Observado:** No ejecutado en esta auditoría. **Estado:** NO EJECUTADO. **Evidencia:** `frontend/js/cart.js`.

### TC-019 — Checkout idempotente
- **REQ:** REQ-F-019 · RN-013 · **Datos:** carrito sintético; precio alterado en el cuerpo; `Idempotency-Key` aleatoria de 32 caracteres.
- **Pasos:** `POST /api/checkout` dos veces con la misma clave; con precio manipulado; sin clave.
- **Esperado:** mismo pedido en la repetición; total con precios de MySQL; sin clave → 400; inventario reservado.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO. **Evidencia:** histórico integración L, K, E.

### TC-020 — Prellenado del checkout
- **REQ:** REQ-F-020 · **Esperado:** requiere JWT, usa solo el `clienteId` autenticado, `Cache-Control: no-store`, rellena solo campos vacíos.
- **Observado:** pasó. **Estado:** APROBADO
- **Evidencia:** `assistant.spec.js` («perfil checkout requiere JWT, usa solo clienteId autenticado y responde no-store», «autocompleta solo campos vacíos y conserva dirección como texto seguro»).

### TC-021 — Pago mock
- **REQ:** REQ-F-021 · RN-014 · **Datos:** importes terminados en .00, .01, .02, .03.
- **Pasos:** checkout; `POST /api/pagos/dev/simular-webhook`; `GET /api/pagos/:pedidoId/estado`; webhook con firma inválida; evento repetido.
- **Esperado:** aprobado/rechazado/pendiente/timeout según centavos; firma inválida 401; duplicado 200 idempotente; estado solo del dueño.
- **Observado:** TC-021.b (estado requiere JWT y solo pedidos propios) pasó; el resto no ejecutado.
- **Estado:** BLOQUEADO (TC-021.b APROBADO)
- **Evidencia:** `assistant.spec.js` («consulta de estado de pedido requiere JWT», «el estado consulta únicamente pedidos del cliente autenticado»); `backend/src/routes/pagos.js`.

### TC-022 — Expiración de pedidos
- **REQ:** REQ-F-022 · RN-016 · **Esperado:** pago vencido → pedido y pago expirados y reservas liberadas en una transacción; ante error se revierte.
- **Observado:** pasó. **Estado:** APROBADO
- **Evidencia:** `paymentJobs.test.js` («expired payment changes status and releases the reserved quantities in one transaction», «expiration rolls back instead of silently losing a reserved product»).

### TC-023 — Historial y cancelación de pedido propio
- **REQ:** REQ-F-023 · **Pasos:** `GET /api/pedidos`; `PUT /api/pedidos/:id/cancelar` propio y ajeno. **Esperado:** solo pedidos propios; ajeno 404/403; reserva liberada.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO. **Evidencia:** `routes/pedidos.js`.

### TC-024 — Gestión de pedidos (admin)
- **REQ:** REQ-F-024 · **Pasos:** `GET /api/pedidos/todos`, `PUT /api/pedidos/:id` con y sin `pedidos.gestionar`. **Esperado:** sin permiso 403.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO. **Evidencia:** `routes/pedidos.js`.

### TC-025 — Comprobantes y correos
- **REQ:** REQ-F-025 · RN-015
- **Esperado:** pago aprobado encola aviso admin y correo al cliente solo con consentimiento; enlace válido solo para su pedido y hash; expirado rechazado; envío por SMTP directo, nunca webhook; URL base válida; en producción sin SMTP falla.
- **Observado:** pasó. **Estado:** APROBADO
- **Evidencia:** `receiptService.test.js` (2 pruebas), `receiptTokens.test.js` (2), `receiptEmail.test.js` (3).
- **Observaciones:** el PDF y el límite de 3 reenvíos por hora no tienen prueba con nombre propio en esta corrida.

### TC-026 — Gestión de clientes
- **REQ:** REQ-F-026
- **Esperado:** `POST /api/clientes` exige autenticación y permiso; cliente no crea clientes; restringidos solo con permiso y cuenta aprobada; dato sensible solo propio o admin y no concede compra.
- **Observado:** pasó. **Estado:** APROBADO
- **Evidencia:** `account-registration-phase0.spec.js` (10 pruebas sobre `/api/clientes` y `/dato-sensible`).

### TC-027 — Solicitar verificación institucional
- **REQ:** REQ-F-027 · **Datos:** CC sintética, PDF sintético. **Pasos:** subir documento, registrar identificador con `autorizaTratamiento: true`, enviar con `Idempotency-Key`.
- **Esperado:** archivo cifrado fuera de carpetas estáticas; identificador cifrado v2 + índice HMAC; envío idempotente.
- **Observado:** TC-027.b (normalización, índice HMAC, cifrado v2) pasó; HTTP no ejecutado.
- **Estado:** BLOQUEADO (TC-027.b APROBADO)
- **Evidencia:** `verificacion-compra.test.js` («normalización de identificadores…», «índice HMAC…», «cifrado v2…»).

### TC-028 — Revisión con doble comprobación
- **REQ:** REQ-F-028 · RN-011, RN-020
- **Esperado:** solo tres confirmaciones de personas distintas permiten aprobar; nada aprueba ni rechaza automáticamente.
- **Observado:** pasó la tabla de decisión.
- **Estado:** APROBADO (tabla) · TC-028.b flujo HTTP (decisión, suspensión, restringidos): BLOQUEADO
- **Evidencia:** `verificacion-compra.test.js` («tabla de decisión: solo tres confirmaciones de personas distintas permiten aprobar», «tabla de decisión: ningún resultado distinto de confirmado aprueba y nada rechaza automáticamente»).

### TC-029 — Autorización por compra de restringidos
- **REQ:** REQ-F-029 · **Esperado:** checkout con restringidos → 403 `REQUIERE_AUTORIZACION_COMPRA`; código al correo; autorización ligada al hash del carrito, un uso, 15 min.
- **Observado:** TC-029.b hash del carrito pasó. **Estado:** BLOQUEADO (TC-029.b APROBADO)
- **Evidencia:** `verificacion-compra.test.js` («hash del carrito: independiente del orden y de líneas repetidas, sensible a cantidades»); histórico `compra-verificada` 5, 6, 11.

### TC-030 — Personal, permisos, superadministrador y diagnóstico
- **REQ:** REQ-F-030 · RN-017, RN-018 · **Esperado:** staff limitado no concede permisos reservados ni se modifica a sí mismo; superadmin solo por comando con `--confirmar-base`; diagnóstico solo superadmin.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO. **Evidencia:** histórico `compra-verificada` 15, 16; `scripts/crear-superadmin.js`.

### TC-031 — Asistente de catálogo
- **REQ:** REQ-F-031 · **Esperado:** respuestas respaldadas por el catálogo, límites de precio, aclaraciones, memoria de conversación, rechazo de inyección, longitud ≤500, 20 mensajes/min, pendientes sin PII, resumen semanal con token, modo LLM solo Ollama local.
- **Observado:** pasó. **Estado:** APROBADO
- **Evidencia:** `assistant.spec.js` (bloques «motor reglas e índice inyectado», «API del asistente y aislamiento de datos», «widget accesible del catálogo»; incluye `test.each` «responde con datos respaldados a: %s»).

### TC-032 — Calificación y solicitudes de contacto
- **REQ:** REQ-F-032 · **Datos:** NIT `999000001`, correo `contacto@prueba.test`, mensaje ≥20 caracteres. **Esperado:** calificación 1–5 → 201; contacto válido → 201 con radicado `SI-########`, NIT y correo cifrados; honeypot `website` → 400; 6.ª solicitud en 15 min → 429.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO. **Evidencia:** `routes/atencion.js`. Ver BUG-002.

### TC-033 — Reportes
- **REQ:** REQ-F-033 · **Esperado:** reporte mensual solo para personal autorizado; mis-reportes solo del cliente autenticado.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO
- **Observaciones:** la inspección de `backend/src/routes/reportes.js` muestra que `GET /api/reportes/mensual` **no exige autenticación** (BUG-001); el resultado esperado no se cumpliría. Ver TC-208.

### TC-034 — Auditoría
- **REQ:** REQ-F-034 · **Esperado:** acciones administrativas registradas; `GET /api/auditoria` solo con `auditoria.ver`.
- **Observado:** TC-034.b (auditoría de nombres de campos sin valores en mi cuenta) pasó.
- **Estado:** BLOQUEADO (TC-034.b APROBADO). **Evidencia:** `mi-cuenta.spec.js` («PATCH normaliza el teléfono y audita nombres de campos sin sus valores»).

### TC-035 — Eventos firmados hacia n8n
- **REQ:** REQ-F-035 · RN-022 · **Esperado:** firmas HMAC válidas y detección de alteraciones; endpoints de automatización con su propio token; W8 solo tres eventos; W12 solo `{evento, solicitud_id, resultado}`; W11 valida forma y firma.
- **Observado:** pasó. **Estado:** APROBADO
- **Evidencia:** `automation.test.js` (4 pruebas); `registro-verificado.test.js` («n8n: solo viaja {evento, solicitud_id, resultado}…», «n8n W12: el nodo Code acepta la firma…»); `verificacion-compra.test.js` («W11 valida la firma…», «W11 clasifica la entidad…»).

### TC-036 — Workflows n8n operativos
- **REQ:** REQ-F-036 · **Pasos:** importar W1–W12 en la instancia, configurar credenciales y secretos, activar, disparar eventos sintéticos.
- **Esperado:** cada workflow recibe y procesa su evento; no guarda ejecuciones donde está configurado.
- **Observado:** No ejecutado. **Estado:** BLOQUEADO (instancia n8n y credenciales no disponibles; todos los JSON `active: false`).
- **Evidencia:** `automation.test.js` («n8n workflow exports are valid JSON and Code nodes parse») valida solo la sintaxis.

### TC-037 — Migraciones
- **REQ:** REQ-F-037 · **Esperado:** la migración de cuenta segura tolera columnas existentes; 001–003 se aplican una vez; reversión con `--confirmo-perdida-de-datos`.
- **Observado:** idempotencia pasó. **Estado:** APROBADO · TC-037.b reversión y reaplicación: BLOQUEADO (histórico `compra-verificada` 19)
- **Evidencia:** `db-account-migration.spec.js` («tolera columnas ya instaladas y vuelve a asegurar tabla y enum»).

### TC-038 — Multilenguaje
- **REQ:** REQ-F-038 · **Pasos:** cambiar idioma en cada página. **Esperado:** textos traducidos. **Observado:** No ejecutado. **Estado:** NO EJECUTADO
- **Observaciones:** por inspección, varias páginas nuevas tienen 0–1 atributos `data-i18n` (BUG-016).

### TC-039 — Portada, normatividad y navegación
- **REQ:** REQ-F-039 · **Pasos:** recorrer `landing.html`, `leyes.html` y menús. **Esperado:** enlaces válidos, sin errores de consola. **Observado:** No ejecutado. **Estado:** NO EJECUTADO.

### TC-040 — Pasarela de pago real
- **REQ:** REQ-F-040 · **Esperado:** con `PAYMENT_MODE=sandbox|prod` el proveedor real procesa pagos. **Observado:** No aplica ejecutar: no hay adaptador; el código falla de forma segura. **Estado:** PENDIENTE.

## 3. Casos no funcionales

| TC | REQ | Objetivo y resultado esperado | Evidencia | Observado | Estado |
|---|---|---|---|---|---|
| TC-101 | REQ-NF-001 | Formato `v<ver>:iv:tag:cifrado`, AAD por campo, detección de alteración, rotación; índice ciego distinto de SHA-256; cifrado v2 | `registro-verificado.test.js` («cifrado: …» ×4, «índice ciego…», «comparación en tiempo constante»); `verificacion-compra.test.js` («cifrado v2…», «índice HMAC…») | Pasó | APROBADO |
| TC-102 | REQ-NF-002 | Contraseña 10–72; bcrypt | Validación zod en `registroInstitucional.js`; pruebas de registro y login | Pasó (flujos de registro/login con BCRYPT_COST=4 en prueba) | APROBADO |
| TC-103 | REQ-NF-003 | En producción, secretos de ejemplo impiden arrancar | `verificacion-compra.test.js` («configuración segura: en producción rechaza secretos de ejemplo») | Pasó | APROBADO |
| TC-104 | REQ-NF-004 | 429 al superar límites | `assistant.spec.js` («limita a 20 mensajes por minuto por IP»); `mi-cuenta.spec.js` («el limitador responde 429…») | Pasó (login, MFA, registro y captcha no cubiertos) | APROBADO (parcial) |
| TC-105 | REQ-NF-005 | Respuestas con `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, COOP, `Permissions-Policy` | `backend/src/app.js` | No ejecutado en esta auditoría | NO EJECUTADO |
| TC-106 | REQ-NF-006 | Registro/login < 600 ms; aprobar/rechazar/contador < 300 ms | Histórico 2026-10-15 en `docs/REGISTRO_VERIFICADO.md` §5 | No ejecutado (usa base real) | BLOQUEADO |
| TC-107 | REQ-NF-007 | Pool ≤ 4 conexiones | `backend/src/db.js` (`Math.min(…, 4)` + pool transaccional de 1) | No ejecutado | NO EJECUTADO |
| TC-108 | REQ-NF-008 | n8n no recibe datos personales | `registro-verificado.test.js`, `mi-cuenta.spec.js` («…nada a n8n»), `assistant.spec.js` («el evento W6… nunca reenvía el mensaje ni un ID con PII»), `verificacion-compra.test.js` («solo NIT de persona jurídica sale hacia n8n») | Pasó | APROBADO |
| TC-109 | REQ-NF-009 | Sin contraseñas, códigos ni documentos en logs/respuestas | Histórico `compra-verificada` 17 | No ejecutado | BLOQUEADO |
| TC-110 | REQ-NF-010 | Reintentos/rollback; caída de n8n no bloquea | `automation.test.js`, `paymentJobs.test.js`, `registro-verificado.test.js` (aviso n8n fallido no bloquea) | Pasó | APROBADO (parcial) |
| TC-111 | REQ-NF-011 | Funciona en Node 18+ y MySQL 8 | Corrida en Node 24.19.0 | Node 18 no probado | NO EJECUTADO |
| TC-112 | REQ-NF-012 | `npm test` sin fallos | Corrida 2026-10-16 | 107/107 y 51/51 | APROBADO |
| TC-113 | REQ-NF-013 | Sin barra horizontal en 360–1920 px | commit `2c44b40` | No ejecutado | NO EJECUTADO |
| TC-114 | REQ-NF-014 | Widget del asistente accesible | `assistant.spec.js` («envía una consulta, muestra tarjeta DOM segura y sugerencias») | Pasó (sin auditoría WCAG completa) | APROBADO (parcial) |
| TC-115 | REQ-NF-015 | Sesión en cookie HttpOnly + CSRF | — | No implementado | PENDIENTE |
| TC-116 | REQ-NF-016 | HTTPS y HSTS | — | No implementado | PENDIENTE |
| TC-117 | REQ-NF-017 | Aviso, autorizaciones, plazos y borrado conformes a Ley 1581 | `docs/TRATAMIENTO_DATOS_PERSONALES.md` | Requiere validación jurídica | BLOQUEADO |

## 4. Casos de seguridad (resumen; detalle en [06_PRUEBAS_DE_SEGURIDAD.md](06_PRUEBAS_DE_SEGURIDAD.md))

| TC | Caso | Estado |
|---|---|---|
| TC-201 | Escalada horizontal (datos de otro cliente) | APROBADO (parcial) |
| TC-202 | Escalada vertical (admin sin permiso) | APROBADO |
| TC-203 | Enumeración de correos en el registro | APROBADO (registro; tiempos del login no medidos) |
| TC-204 | Fuerza bruta del código MFA de inicio de sesión | NO EJECUTADO |
| TC-205 | Manipulación de precio en el checkout | BLOQUEADO |
| TC-206 | Webhook de pago con firma inválida | BLOQUEADO |
| TC-207 | Repetición de respuestas de n8n (nonce) | BLOQUEADO |
| TC-208 | Acceso sin autenticación a reportes (BUG-001) | NO EJECUTADO (hallazgo por inspección) |
| TC-209 | XSS en paneles administrativos | NO EJECUTADO |
| TC-210 | Inyección SQL en filtros | NO EJECUTADO |
| TC-211 | Subida de archivos maliciosos | BLOQUEADO |
| TC-212 | Secretos débiles en producción | APROBADO |

## 5. Conteo por estado (casos principales)

| Estado | Funcionales (40) | No funcionales (17) | Seguridad (12) | Total (69) |
|---|---|---|---|---|
| APROBADO | 20 | 8 | 4 | 32 |
| BLOQUEADO | 16 | 3 | 4 | 23 |
| NO EJECUTADO | 3 | 4 | 4 | 11 |
| PENDIENTE | 1 | 2 | 0 | 3 |
| FALLIDO | 0 | 0 | 0 | 0 |

Nota: 69 casos principales (40 + 17 + 12). Los sub-casos (TC-006.b, TC-014.b, TC-021.b, TC-027.b, TC-028.b, TC-029.b, TC-034.b, TC-037.b) se describen en cada caso y no se suman.

## Referencias

- [12_MATRIZ_DE_COBERTURA.md](12_MATRIZ_DE_COBERTURA.md) · [09_REGISTRO_DE_DEFECTOS.md](09_REGISTRO_DE_DEFECTOS.md) · [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md)
- [`../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md`](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md)
- Pruebas: [`../backend/test/`](../backend/test/)
