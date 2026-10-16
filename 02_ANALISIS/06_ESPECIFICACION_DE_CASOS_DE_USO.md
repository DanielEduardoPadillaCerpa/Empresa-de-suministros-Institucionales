# Especificación de casos de uso

| Campo | Valor |
|---|---|
| ID documental | DOC-02-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Especificar cada caso de uso (UC-001 a UC-023) con actor, precondiciones, flujo básico, flujos alternativos, excepciones con los códigos HTTP reales y postcondiciones.

## Alcance

Los códigos y mensajes provienen de las rutas en `../backend/src/routes/`. Las rutas citadas sin prefijo son relativas a `backend/src/`. Los flujos son **[OBS]**; la redacción de los pasos del usuario en pantalla es **[INF]** cuando no se inspeccionó el HTML en detalle. Formato de excepciones: `código — condición`.

Excepción común a todas las rutas autenticadas (`requiereAutenticacion`, `routes/auth.js`): `401` sin token, token inválido/expirado, sin `mfa: true` o `session_version` distinta; `403 CUENTA_NO_ACTIVA` si `estado_cuenta ≠ activa`; `403 PASSWORD_CHANGE_REQUIRED` si hay contraseña inicial pendiente (salvo `GET /api/mi-cuenta` y `POST /api/mi-cuenta/password`); `503` si no se puede validar contra la base. Rutas con permiso (`requierePermiso`): `403` sin el permiso (incluye `permisoRequerido`), `503` si falla la consulta.

---

## UC-001 Solicitar cuenta

| Elemento | Descripción |
|---|---|
| Actor | ACT-01 Visitante (o ACT-02 con cuenta rechazada) |
| Secundarios | ACT-09 Fuente del padrón (vía copia `padron_institucional`), ACT-10 SMTP, ACT-07 n8n (W12) |
| REQ | REQ-F-001, REQ-F-002; RN-001, RN-002, RN-004, RN-006, RN-023 |
| Precondiciones | `ENC_KEY` y `HMAC_KEY` configuradas; captcha obtenido (`GET /api/auth/captcha`) |
| Flujo básico | 1. El visitante abre `registro.html`; el formulario se arma con `GET /api/auth/registro/tipos`. 2. Elige tipo de institución, escribe nombre completo, NIT, correo, contraseña (10–72, sin contener el usuario del correo), acepta términos y tratamiento, resuelve el captcha. 3. `POST /api/auth/registro`. 4. El servidor valida captcha (un solo uso) y esquema `zod`. 5. En paralelo: hash bcrypt, búsqueda del correo, verificación de la terna en el padrón. 6. Inserta en un lote transaccional cliente (`borrador`), usuario (`pendiente`), historial y `solicitudes_registro` con NIT y nombre cifrados. 7. Aviso W12 `registro.recibido` en segundo plano. 8. Responde `202` "Solicitud recibida". |
| Alternativo A1 | El correo ya existe y no está rechazado: no crea nada, envía al titular "Intento de registro con tu correo" y responde el mismo `202`. |
| Alternativo A2 | El correo pertenece a una cuenta `rechazada`: actualiza contraseña, nombre y tipo, pone la cuenta en `pendiente` y crea una nueva solicitud. |
| Alternativo A3 | El padrón no responde: la solicitud se crea con resultado `padron_no_disponible`. |
| Excepciones | `400 CAPTCHA_INVALIDO` — captcha incorrecto, vencido o reutilizado · `400` — validación (errores por campo) · `429 RATE_LIMITED` — más de `REGISTRO_LIMITE_POR_HORA` (10) por IP/hora · `503` — claves de cifrado no configuradas · `500` — fallo al guardar · `413` — cuerpo > 10 kb |
| Postcondiciones | Usuario `pendiente`; solicitud `pendiente` con `resultado_verificacion`; no se concede acceso. |

## UC-002 Revisar y decidir solicitud de registro

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `clientes.gestionar`, o ACT-06 |
| REQ | REQ-F-004; RN-003 |
| Precondiciones | Sesión con MFA; rol admin leído de la base; cuenta activa; sin contraseña inicial pendiente |
| Flujo básico | 1. `admin-solicitudes.html` consulta `GET /api/admin/solicitudes/contador` (cada 12 s mientras la pestaña está visible) y `GET /api/admin/solicitudes?estado=pendiente` (lista sin NIT ni nombre, máx. 200). 2. El admin abre el detalle `GET /api/admin/solicitudes/:id`: NIT y nombre descifrados, nombre del padrón y verificación repetida; queda auditoría `ver_solicitud_registro`. 3. Aprueba `POST /:id/aprobar`. 4. Un solo lote SQL valida al administrador y actualiza solicitud (`aprobada`) y usuario (`activa`). 5. Responde `200`; auditoría `aprobar_registro`, aviso W12, correo al solicitante. |
| Alternativo A1 | Resultado ≠ `coincide`: aprobar exige `{ "confirmar": true }`. |
| Alternativo A2 | Rechazo `POST /:id/rechazar` con motivo (5–500): solicitud y usuario `rechazada`; correo con el motivo; la auditoría no guarda el motivo. |
| Excepciones | `400` — id inválido o motivo fuera de rango · `401` — sesión inválida o revocada · `403` — no admin, contraseña inicial pendiente o sin permiso · `404` — solicitud inexistente · `409 YA_DECIDIDA` — otro admin decidió · `409 CONFIRMACION_REQUERIDA` — no coincide y sin confirmación · `503` — base no disponible |
| Postcondiciones | Cuenta activa (puede iniciar sesión) o rechazada (puede volver a solicitar). |

## UC-003 Iniciar sesión con MFA

| Elemento | Descripción |
|---|---|
| Actor | Cualquier usuario con cuenta |
| Secundarios | ACT-10 SMTP |
| REQ | REQ-F-005, REQ-F-006; RN-005 |
| Precondiciones | Captcha obtenido; `MFA_TOKEN_PEPPER` configurado |
| Flujo básico | 1. `POST /api/auth/login` con correo, contraseña y captcha. 2. Compara contra el hash real o uno de relleno. 3. Si la cuenta está activa crea un reto (código de 6 dígitos, solo HMAC guardado, 5 min) y envía el correo en segundo plano. 4. `202 { mfaRequired, challengeId, expiresIn, correoEnmascarado }`. 5. El usuario envía `POST /api/auth/mfa/verificar` con `challengeId` y `code`. 6. Se emiten access token (2 h) y refresh token (7 días); se marca `correo_verificado_en`. |
| Alternativo A1 | Reenvío `POST /api/auth/mfa/reenviar` tras 60 s, máximo 5 reenvíos: nuevo código y nueva vigencia. |
| Alternativo A2 | Cancelar `POST /api/auth/mfa/cancelar`: el reto pasa a `cancelado` (`200 { ok: true }`). |
| Alternativo A3 | `debeCambiarPassword: true` en la respuesta: el frontend lleva a `cambiar-password.html` (UC-005). |
| Excepciones | Login: `400 CAPTCHA_INVALIDO` · `400` correo/contraseña vacíos o > 72 · `401` credenciales incorrectas · `403 CUENTA_PENDIENTE` / `CUENTA_RECHAZADA` / `CUENTA_SUSPENDIDA` (solo tras validar la contraseña) · `429` más de 10 intentos/15 min por IP o 5 retos/15 min por usuario · `503` fallo al crear el reto. Verificar: `400` formato · `401` código incorrecto (indica intentos restantes) o reto inexistente/no pendiente/cuenta no activa · `410` código expirado · `429` intentos agotados (reto `bloqueado`) o 15 verificaciones/15 min por IP · `503` pepper mal configurado · `500`. Reenviar: `400`, `410` reto vencido, `429` espera o reenvíos agotados, `503`. |
| Postcondiciones | Sesión válida; reto `verificado`; correo verificado. |

## UC-004 Renovar y cerrar sesión

| Elemento | Descripción |
|---|---|
| Actor | Usuario autenticado (frontend `js/auth.js`) |
| REQ | REQ-F-007, REQ-F-008 |
| Flujo básico | 1. `POST /api/auth/refresh` con el refresh token. 2. Se busca por SHA-256, no revocado; se revoca y se emite uno nuevo (rotación) y un access token nuevo. 3. Para salir: `POST /api/auth/logout` revoca el refresh token y responde `{ ok: true }`. |
| Alternativo A1 | Cerrar todas las sesiones (UC-006) incrementa `session_version`: los access tokens previos dejan de valer en la siguiente petición. |
| Excepciones | Refresh: `400` falta el token · `401` inválido, revocado, cuenta no activa, sin MFA registrado o expirado · `500`. Logout: `500`. |
| Postcondiciones | Un refresh token solo sirve una vez. |

## UC-005 Cambiar contraseña

| Elemento | Descripción |
|---|---|
| Actor | Usuario autenticado; obligatorio con `debe_cambiar_password` |
| REQ | REQ-F-009, REQ-F-012; RN-021 |
| Precondiciones | MFA completado en los últimos 15 minutos (`refresh_tokens.mfa_verificado_en`) |
| Flujo básico | 1. `cambiar-password.html` envía `POST /api/mi-cuenta/password` con contraseña actual y nueva. 2. Valida, guarda el nuevo hash, quita `debe_cambiar_password`, incrementa `session_version`, revoca refresh tokens y envía aviso de seguridad por correo. 3. El usuario vuelve a iniciar sesión. |
| Excepciones | `400` nueva igual a la actual o inválida · `401` contraseña actual incorrecta · `403` sin MFA reciente · `429` límite del limitador · `500` |
| Postcondiciones | Todas las sesiones revocadas. |

## UC-006 Gestionar mi cuenta

| Elemento | Descripción |
|---|---|
| Actor | ACT-03 / ACT-04 |
| REQ | REQ-F-010 a REQ-F-013; RN-021 |
| Observación | **Sin pantalla** en el frontend (BUG-004); solo API. |
| Flujo básico (perfil) | `GET /api/mi-cuenta` devuelve el perfil descifrado del `clienteId` de la sesión; `PATCH /api/mi-cuenta` acepta solo `nombreFuncionario`, `telefono`, `direccionEntrega`, `direccionInstalacion`, audita los nombres de campos sin valores. |
| Flujo cambio de correo | 1. `POST /correo/solicitar` con contraseña actual y correo nuevo: reto `cambio_correo` con destino cifrado; código al correo nuevo. 2. `POST /correo/confirmar` con el código: actualiza `usuarios.correo` y `clientes.correo` en una transacción, revoca sesiones, avisa al correo anterior. |
| Flujo sesiones | `POST /sesiones/cerrar-todas`: revoca refresh tokens e incrementa `session_version`. |
| Flujo solicitudes de datos | `POST /solicitud-cambio` (campo `nit`, `nombreUnidad`, `eliminacion` o `correccion`); se encola a W8 solo id y tipo. Un admin con `clientes.gestionar` consulta `GET /solicitudes` y resuelve `PATCH /solicitudes/:id`. |
| Excepciones | `400` campos fuera de la allowlist, HTML o teléfono no colombiano · `401` credenciales o código inválidos · `403` sin perfil de cliente o sin contraseña actual · `404` perfil o solicitud inexistente · `409` correo no disponible (respuesta genérica) · `410` código expirado · `429` limitadores o intentos agotados · `500` (revierte si falla la auditoría transaccional) |
| Postcondiciones | Datos actualizados y auditados; sesiones revocadas cuando cambian credenciales. |

## UC-007 Consultar catálogo y detalle

| Elemento | Descripción |
|---|---|
| Actor | Todos |
| REQ | REQ-F-014, REQ-F-015; RN-007, RN-008 |
| Flujo básico | 1. `index.html` llama `GET /api/categorias` y `GET /api/productos[?categoria=]` (autenticación opcional). 2. Para cada producto, `evaluarProducto()` decide visible/nivel/compra con el contexto leído de MySQL. 3. `producto-detalle.html` llama `GET /api/productos/:id`. |
| Alternativos | Visitante o cuenta no activa: vitrina sin precio, inventario ni metadatos. Staff: ve todo, incluidos inactivos (`incluirInactivosSiAdmin`), sin comprar. |
| Excepciones | `400` categoría inválida · `404` producto inexistente, oculto, restringido no elegible o de otra institución (respuesta idéntica) · `500` |
| Postcondiciones | Ninguna (consulta). |

## UC-008 Gestionar carrito

| Elemento | Descripción |
|---|---|
| Actor | ACT-01 a ACT-04 |
| REQ | REQ-F-018 |
| Flujo básico | `js/cart.js` guarda id de producto, cantidad y datos de presentación en `localStorage`; el precio mostrado no es confiable y el servidor lo recalcula (RN-013). |
| Alternativo | "Continuar" sin sesión redirige a `login.html?redirect=…`. |
| Excepciones | No hay llamadas al servidor; errores de almacenamiento del navegador quedan **NO DETERMINADO**. |
| Observación | El comentario de cabecera de `js/cart.js` menciona `POST /api/pedidos`, ruta retirada (410). **[INF]** comentario desactualizado. |

## UC-009 Realizar checkout y pago (mock)

| Elemento | Descripción |
|---|---|
| Actor | ACT-03 / ACT-04 |
| Secundario | ACT-08 Proveedor mock |
| REQ | REQ-F-019, 020, 021, 040; RN-013, RN-014 |
| Precondiciones | Cuenta activa vinculada a cliente; carrito no vacío |
| Flujo básico | 1. `checkout.html` prellena con `GET /api/checkout/perfil` (solo campos vacíos; `Cache-Control: no-store`). 2. `POST /api/checkout` con `Idempotency-Key` (16–128), `items`, `datosComprador`, `direccionEntrega`, `metodo`, `enviarComprobante`. 3. Transacción: contexto y productos `FOR UPDATE`, revalidación, reserva de inventario, pedido `pendiente_pago`, `detalle_pedido`, pago `creado`. 4. `201` con `pedido_id`, estado, `widget_token`, `widget_url`, expiración. 5. El navegador llama `POST /api/pagos/dev/simular-webhook`. 6. El servidor firma y procesa el evento: aprobado → pedido `pagado` + comprobante; rechazado → `rechazado` + liberación de reserva. 7. `GET /api/pagos/:pedidoId/estado` muestra el resultado. |
| Alternativo A1 | Misma `Idempotency-Key` y mismo contenido: `200` con el pedido ya creado. |
| Alternativo A2 | Carrito con restringidos: ver UC-014. |
| Alternativo A3 | Importe terminado en .02 queda `pendiente` hasta expirar (UC-023); .03 simula timeout (`504`). |
| Excepciones | `400` sin clave de idempotencia, datos de tarjeta en el cuerpo, carrito/método/comprador inválidos · `403` cuenta no vinculada o no habilitada (`CUENTA_NO_ACTIVA`), restringido sin autorización, `REQUIERE_AUTORIZACION_COMPRA` · `409` clave reutilizada con otro contenido, producto no disponible, inventario insuficiente · `429` perfil > 30/min · Pagos: `404` simulación en producción o pedido ajeno, `409` intento que ya no admite simulación, `504` timeout simulado · Webhook: `401` firma inválida, `409` evento repetido con otro contenido, `400` importe distinto, `404` pago o proveedor desconocido |
| Postcondiciones | Pedido con pago; inventario reservado o descontado; sin cobro real. |

## UC-010 Consultar historial y cancelar pedido

| Elemento | Descripción |
|---|---|
| Actor | ACT-03 / ACT-04 |
| REQ | REQ-F-023 |
| Flujo básico | `GET /api/pedidos` devuelve los pedidos del `clienteId` de la sesión; `PUT /api/pedidos/:id/cancelar` cancela si está en `pendiente` o `pendiente_pago` y libera la reserva. |
| Excepciones | `403` pedido ajeno · `404` inexistente · `400` estado que no permite cancelar · `409` cambió de estado durante la operación · `500` |
| Postcondiciones | Pedido `cancelado`. |

## UC-011 Obtener y reenviar comprobante

| Elemento | Descripción |
|---|---|
| Actor | ACT-03 / ACT-04 (o portador de enlace firmado) |
| REQ | REQ-F-025; RN-015 |
| Flujo básico | `GET /api/comprobantes/:pedidoId` (JSON) o `?format=pdf` (PDF "no es factura electrónica DIAN") con sesión del dueño o con token de enlace vigente; `POST /:pedidoId/reenviar` encola un nuevo correo. |
| Excepciones | `400` id inválido · `401` sin sesión ni enlace válido, o enlace vencido · `403` el comprador no eligió envío por correo · `404` comprobante inexistente o ajeno · `429` más de 3 reenvíos/hora · `500` |
| Postcondiciones | Entrada en `correo_outbox` y en `solicitudes_reenvio_comprobante`. |

## UC-012 Solicitar verificación institucional

| Elemento | Descripción |
|---|---|
| Actor | ACT-03 |
| Secundario | ACT-07 (W11, si está activo) |
| REQ | REQ-F-027; RN-009, RN-010 |
| Precondiciones | Cuenta de comprador; `CRYPTO_KEYS` e `IDENT_HMAC_KEY` configuradas para el identificador |
| Flujo básico | 1. `mi-verificacion.html` consulta `GET /api/verificacion/mi-solicitud`. 2. Ajusta clasificación `POST /mi-solicitud/clasificacion`. 3. Registra documento de identidad `POST /mi-solicitud/identificador` con `autorizaTratamiento: true` (CC o CE). 4. Sube evidencias `POST /mi-solicitud/documentos` (PDF/PNG/JPEG validados por contenido, cifrados, máx. por cliente). 5. Envía `POST /mi-solicitud/enviar` con `Idempotency-Key`. 6. Se crean la solicitud y tres comprobaciones; evento W11 por el outbox. |
| Alternativos | Descargar o eliminar un documento propio (`GET`/`DELETE /mi-solicitud/documentos/:id`). Cambio de tipo de una cuenta en borrador: `202` y queda en revisión. |
| Excepciones | `400` tipo/archivo/identificador/clave de idempotencia inválidos o sin autorización · `403` staff · `404` sin solicitud o documento · `409` estado no admite cambios, máximo de documentos, cambio de tipo ya en revisión, reenvíos agotados tras rechazo · `422` requisitos incompletos (lista `requisitos`) · `429` 30 subidas/hora · `503` protección de identificadores no configurada · `500` |
| Postcondiciones | `clientes.estado_verificacion = 'pendiente'`; solicitud `en_curso`. |

## UC-013 Revisar verificación y decidir

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `verificacion.ver` / `verificacion.decidir` / `verificacion.confirmar_institucion` |
| Secundario | ACT-07 (resultado `entidad`) |
| REQ | REQ-F-028; RN-010, RN-011, RN-012, RN-020 |
| Flujo básico | 1. `admin-verificaciones.html` lista `GET /api/verificacion/admin/solicitudes` con filtros. 2. Detalle `GET …/:clienteId`. 3. Registro de comprobaciones `POST …/:clienteId/comprobaciones/:componente`. 4. Decisión `POST …/:clienteId/decision` (aprobar, rechazar, solicitar información) con motivo ≥ 10. 5. Al aprobar: `verificado_hasta = hoy + VERIFICACION_VIGENCIA_DIAS`. |
| Alternativos | Descargar documento (`documentos.ver`, auditado); revelar identificador (`identificadores.ver`, justificación 20–500); resolver cambio de tipo; suspender/reactivar (`cuentas.suspender`); conceder/revocar restringidos (`restringidos.autorizar`). |
| Excepciones | `400` decisión o motivo inválidos · `403` sin el permiso del componente o de la acción · `404` solicitud, cuenta o documento inexistente · `409` transición no permitida, sin solicitud activa, cuenta no aprobada o verificación vencida para restringidos · `422` requisitos incompletos o `COMPROBACIONES_INCOMPLETAS` · `500` |
| Postcondiciones | Historial en `verificacion_historial` y `auditoria`; aviso al titular por el outbox. |

## UC-014 Autorizar compra con restringidos

| Elemento | Descripción |
|---|---|
| Actor | ACT-04 |
| REQ | REQ-F-029 |
| Flujo básico | 1. El checkout responde `403 REQUIERE_AUTORIZACION_COMPRA`. 2. `POST /api/verificacion/compra/autorizacion` con el carrito: se crea una autorización ligada al hash del carrito y se envía un código al correo; `201 { autorizacion, expiraEnMinutos }`. 3. `POST /compra/autorizacion/confirmar` con el código. 4. `POST /api/checkout` con `autorizacionCompra`: se consume en la transacción. |
| Excepciones | `400` carrito o código inválido · `403 CUENTA_NO_ACTIVA` o productos no habilitados (código = motivo) · `409` productos no disponibles o carrito sin restringidos · `429` 20 por IP/15 min · `503` fallo de envío del código · `500` · En checkout: `403` con motivo `carrito_distinto` |
| Postcondiciones | Autorización `consumida` y vinculada al pedido. |

## UC-015 Administrar catálogo y cumplimiento

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `catalogo.gestionar` (y `productos.cumplimiento`) |
| REQ | REQ-F-016, REQ-F-017 |
| Flujo básico | `admin-productos.html`: `POST/PUT/DELETE /api/productos`, `POST/PUT/DELETE /api/categorias`, `GET /api/productos/bajo-inventario`. Cumplimiento en `admin-verificaciones.html`: `GET /api/verificacion/admin/productos`, `PUT …/admin/productos/:id/cumplimiento`. |
| Excepciones | `400` nombre/precio faltantes, institución inválida, revisión inválida, sustento < 10 · `403` restricción o institución sin `productos.cumplimiento` · `404` producto inexistente · `500` |
| Postcondiciones | Catálogo actualizado; índice del asistente invalidado; auditoría. |

## UC-016 Gestionar pedidos (admin)

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `pedidos.gestionar` |
| REQ | REQ-F-024 |
| Flujo básico | `GET /api/pedidos/todos`; `GET /api/pedidos/:clienteId`; `PUT /api/pedidos/:id` con estado `pendiente`, `confirmado`, `preparado`, `enviado`, `entregado` o `cancelado`. |
| Excepciones | `400` estado inválido · `404` pedido inexistente · `409` el estado del pago solo cambia por evento verificado, o el pedido cambió · `500` |

## UC-017 Gestionar clientes (admin)

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `clientes.gestionar` |
| REQ | REQ-F-026 |
| Flujo básico | `GET/POST /api/clientes`, `GET/PUT/DELETE /api/clientes/:id`; campos privados cifrados. `POST /api/clientes/:id/dato-sensible` (titular o admin) con consentimiento expreso. |
| Excepciones | `400` campos obligatorios, sin autorización expresa, id inválido · `403` cambiar restringidos sin permiso de cumplimiento, dato sensible de otro cliente · `404` · `409` restringidos a cuenta no aprobada · `500` |

## UC-018 Gestionar personal, permisos y diagnóstico

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `staff.permisos`; ACT-06 |
| REQ | REQ-F-030; RN-017, RN-018 |
| Flujo básico | `GET /api/verificacion/admin/mis-permisos`; `GET …/admin/permisos`; `PUT …/admin/permisos/:usuarioId`; `POST …/admin/personal` (contraseña temporal 12–72, cambio obligatorio). Superadmin: `GET …/admin/diagnostico` (migraciones, colas, configuración presente sin valores). Creación de superadmin solo por comando. |
| Excepciones | `400` permisos o correo inválidos · `403` permisos reservados, sobre superadmin, o no superadmin en diagnóstico · `404` usuario inexistente · `409` quitarse `staff.permisos` o correo existente · `500` |

## UC-019 Consultar asistente y calificar atención

| Elemento | Descripción |
|---|---|
| Actor | Todos |
| Secundario | ACT-07 (W6 escalamiento) |
| REQ | REQ-F-031, REQ-F-032 |
| Flujo básico | `GET /api/asistente/sugerencias`; `POST /api/asistente/mensaje` (autenticación opcional) responde con productos visibles con precio para el contexto; `POST /api/atencion/calificacion` (1–5). |
| Excepciones | `400` mensaje > 500 caracteres, calificación fuera de rango, comentario > 1000 · `429` > 20 mensajes/min · `500` |
| Postcondiciones | Preguntas no resueltas en `asistente_pendientes`; calificación en `atenciones`. |

## UC-020 Radicar solicitud de contacto

| Elemento | Descripción |
|---|---|
| Actor | Cualquiera |
| REQ | REQ-F-032 |
| Flujo básico | `contacto.html` → `POST /api/atencion/solicitudes` con tipo (`pqrs`, `soporte`, `cotizacion`), tipo de entidad, entidad, NIT (9–10 dígitos), correo, criticidad, mensaje (20–2000) y `autorizacionDatos`. `201 { radicado: "SI-00000001" }`. |
| Excepciones | `400` campos inválidos, sin autorización o campo trampa `website` · `429` > 5/15 min · `500` |

## UC-021 Consultar reportes y registrar reporte de cliente

| Elemento | Descripción |
|---|---|
| Actores | ACT-05 (reporte mensual), ACT-03/04 (mis reportes) |
| REQ | REQ-F-033 |
| Flujo básico | `reportes.html` → `GET /api/reportes/mensual` (clientes atendidos, escalados, promedio, sugerencias ≤3, pedidos por estado, top 5). `mis-reportes.html` → CRUD `/api/mis-reportes`. |
| Excepciones | Mis reportes: `400` sin cliente vinculado, comentario vacío, calificación fuera de 1–5 · `403` reporte ajeno · `404` · `500`. Reporte mensual: `500`. |
| Defecto | **BUG-001**: el reporte mensual no exige autenticación. |

## UC-022 Consultar auditoría

| Elemento | Descripción |
|---|---|
| Actor | ACT-05 con `auditoria.ver` |
| REQ | REQ-F-034 |
| Flujo básico | `GET /api/auditoria?limite=&entidad=` (máx. 500, orden descendente). |
| Excepciones | `401`, `403`, `500` |
| Observación | Sin pantalla en el frontend **[OBS]**. |

## UC-023 Procesos automáticos

| Elemento | Descripción |
|---|---|
| Actores | ACT-11, ACT-07 |
| REQ | REQ-F-003, 022, 035, 036, 037 |
| Procesos | Migraciones al arrancar (`migrar()`); sincronización del padrón (al arrancar y cada 10 min); expiración de pedidos (60 s); mantenimiento de verificaciones (5 min); worker de correo (5 s, 5 intentos); worker de automatizaciones (5 s, 8 intentos, timeout 8 s); revisión de stock bajo (15 min, una alerta genérica al día, umbral `AUTOMATION_STOCK_LOW_THRESHOLD`). |
| Excepciones de endpoints n8n | `401` token o firma inválidos · `503` automatización no configurada · `400` esquema inexacto · `409` nonce repetido · `404` ref inexistente · `500` |

## Referencias

- [05_CASOS_DE_USO.md](05_CASOS_DE_USO.md), [07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md](07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md)
- [Contratos de API](../04_DESARROLLO/08_CONTRATOS_Y_ENDPOINTS_DE_API.md)
- [Criterios de aceptación](../01_INGENIERIA_DE_REQUERIMIENTOS/09_CRITERIOS_DE_ACEPTACION.md)
