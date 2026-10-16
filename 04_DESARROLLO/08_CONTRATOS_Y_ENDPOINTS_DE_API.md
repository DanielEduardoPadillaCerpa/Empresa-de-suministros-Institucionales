# Contratos y endpoints de API

| Campo | Valor |
|---|---|
| ID documental | DOC-04-08 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Catálogo completo de los endpoints HTTP montados en `../backend/src/app.js`, con su contrato observable.

## Alcance

**[OBS]** 97 manejadores: 2 en `app.js` y 95 en 17 routers. Información extraída de la lectura del código (método, ruta, middlewares, validaciones y códigos `res.status`). No se ejecutaron llamadas HTTP en esta auditoría; los contratos cubiertos por pruebas unitarias aprobadas el 2026-10-16 se marcan ✔ en la columna «Prueba».

## 1. Convenciones generales

| Aspecto | Contrato |
|---|---|
| Formato | JSON (`Content-Type: application/json`). Excepciones: multipart en `POST/PUT /api/productos` y `POST /api/verificacion/mi-solicitud/documentos`; cuerpo *raw* en `POST /api/pagos/webhook/:proveedor`; PDF/binario en comprobantes y documentos |
| Autenticación de usuario | `Authorization: Bearer <access JWT>` (HS256, 2 h, `mfa:true`). `requiereAutenticacion` valida firma, `session_version`, `estado_cuenta='activa'` y `debe_cambiar_password` contra MySQL |
| Autorización staff | `requiereAdmin` (rol `admin` leído de BD) + `requierePermiso('<permiso>')` sobre `staff_permisos`; superadmin tiene implícitos todos menos `documentos.ver` e `identificadores.ver` |
| Autenticación de máquina | `x-automation-token` (W2, W4, W11 mantenimiento), `Authorization: Bearer` (resumen semanal del asistente), HMAC (`x-payment-signature`, firma W11 de vuelta) |
| Errores comunes | 400 validación / JSON inválido · 401 sin sesión o sesión revocada · 403 sin permiso, `CUENTA_NO_ACTIVA`, `PASSWORD_CHANGE_REQUIRED` · 404 inexistente u oculto · 409 conflicto de estado · 410 retirado/expirado · 413 cuerpo grande · 422 requisitos incumplidos · 429 `RATE_LIMITED` · 500/503 genéricos sin trazas |
| Límites de cuerpo | 10 kb en `/api/auth` y `/api/admin/solicitudes`; 100 kb resto; 64 kb webhook de pagos; 6 MB multipart de productos |

Leyenda de acceso: **Público** · **Usuario** (JWT) · **Opcional** (JWT si viene) · **Staff:`permiso`** (JWT + rol admin + permiso) · **Superadmin** · **Máquina**.

## 2. Raíz (`backend/src/app.js`)

| Método | Ruta | Acceso | Propósito | Respuesta | Archivo |
|---|---|---|---|---|---|
| GET | `/` | Público | Redirige a `/landing.html` (HTML) o estado JSON | 302 / 200 `{status, servicio}` | app.js:49 |
| GET | `/favicon.ico` | Público | Evita 404 | 204 | app.js:55 |

## 3. Autenticación — `/api/auth` (`routes/auth.js`, MOD-01/MOD-02)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/auth/captcha` | Público (120/15 min por IP) | — | 200 `{id, svg}` no-store; 429 | auth.js:158 | ✔ |
| GET | `/api/auth/registro/tipos` | Público | — | 200 `{tipos}` (caché 300 s) | auth.js:179 | — |
| POST | `/api/auth/registro` | Público (`REGISTRO_LIMITE_POR_HORA`/h) | `captchaId, captchaRespuesta`, tipo de institución, nombre completo, NIT, correo, contraseña (10–72), aceptaciones | **202** `{ok, estado:'solicitud_recibida', mensaje}` idéntico exista o no el correo; 400 `CAPTCHA_INVALIDO`/validación; 503 sin claves; 500 | auth.js:198 | ✔ |
| POST | `/api/auth/login` | Público (10/15 min) | `correo, password, captchaId, captchaRespuesta` | 202 `{mfaRequired, challengeId, expiresIn, correoEnmascarado}`; 400; 401 genérico; 403 `CUENTA_PENDIENTE`/`CUENTA_RECHAZADA`/`CUENTA_SUSPENDIDA` (solo tras contraseña válida); 429; 503 | auth.js:240 | ✔ |
| POST | `/api/auth/mfa/verificar` | Público (15/15 min) | `challengeId` (64 hex), `code` (6 dígitos) | 200 `{token, refreshToken, expiraEn, correo, id, clienteId, rol, institucionId, estadoVerificacion?, tipoInstitucion?, debeCambiarPassword, mfaVerified}`; 400; 401 (con intentos restantes); 410 expirado; 429 agotado; 503 | auth.js:280 | ✔ |
| POST | `/api/auth/mfa/reenviar` | Público (10/h) | `challengeId` | 200 `{ok, expiresIn, correoEnmascarado}`; 400; 410; 429 (espera 60 s / máx. 5) | auth.js:394 | ✔ |
| POST | `/api/auth/mfa/cancelar` | Público | `challengeId` | 200 `{ok}`; 400 | auth.js:450 | — |
| POST | `/api/auth/refresh` | Público (posee refresh) | `refreshToken` | 200 nuevo par rotado; 400; 401 | auth.js:470 | — |
| POST | `/api/auth/logout` | Público | `refreshToken` | 200 `{ok}` (revoca) | auth.js:534 | — |

## 4. Solicitudes de registro — `/api/admin/solicitudes` (`routes/solicitudesRegistro.js`, MOD-02)

Todas exigen JWT válido; la autorización (rol admin, cuenta activa, sin cambio de contraseña pendiente y `clientes.gestionar` o superadmin) se evalúa en el mismo lote SQL.

| Método | Ruta | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|
| GET | `/api/admin/solicitudes/contador` | — | 200 `{pendientes}`; 401/403; 503 | solicitudesRegistro.js:99 | ✔ |
| GET | `/api/admin/solicitudes` | `?estado=pendiente\|aprobada\|rechazada&limite=1..200` | 200 `{solicitudes:[{id, correo, tipoInstitucion, estado, resultado, creadoEn, decididaEn}]}` (sin NIT ni nombre) | solicitudesRegistro.js:118 | ✔ |
| GET | `/api/admin/solicitudes/:id` | — | 200 detalle descifrado + padrón + `resultadoAhora`; 400; 404; auditado `ver_solicitud_registro` | solicitudesRegistro.js:151 | ✔ |
| POST | `/api/admin/solicitudes/:id/aprobar` | `{confirmar?: true}` | 200 `{ok, id, estado:'aprobada'}`; 409 `CONFIRMACION_REQUERIDA` / `YA_DECIDIDA`; 400; 401/403 | solicitudesRegistro.js:252 | ✔ |
| POST | `/api/admin/solicitudes/:id/rechazar` | `{motivo}` 5–500 | 200 `{ok, id, estado:'rechazada'}`; 400; 409 | solicitudesRegistro.js:281 | ✔ |

## 5. Mi cuenta — `/api/mi-cuenta` (`routes/miCuenta.js`, MOD-03) — todas Usuario

| Método | Ruta | Acceso extra | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/mi-cuenta` | — | — | 200 perfil propio descifrado; 403 sin perfil; 404 | miCuenta.js:145 | ✔ |
| PATCH | `/api/mi-cuenta` | — | `nombreFuncionario`, `telefono`, `direccionEntrega`, `direccionInstalacion` (allowlist estricta) | 200; 400; 403; 404 | miCuenta.js:166 | ✔ |
| POST | `/api/mi-cuenta/correo/solicitar` | — | `{nuevoCorreo, passwordActual}` | 202 `{challengeId…}`; 401; 403; 409 genérico | miCuenta.js:210 | ✔ |
| POST | `/api/mi-cuenta/correo/confirmar` | — | `{challengeId, code}` | 200 (revoca sesiones); 401; 409; 410; 429 | miCuenta.js:292 | ✔ |
| POST | `/api/mi-cuenta/password` | Permitida con cambio pendiente | `{passwordActual, passwordNueva}` (≥10) | 200 (revoca sesiones); 400; 401; 403 sin MFA en 15 min | miCuenta.js:391 | ✔ |
| POST | `/api/mi-cuenta/sesiones/cerrar-todas` | — | — | 200; 500 | miCuenta.js:458 | ✔ |
| POST | `/api/mi-cuenta/solicitud-cambio` | — | `{campo: nit\|nombreUnidad\|eliminacion\|correccion, detalle}` | 201 `{ok, solicitudId}` (aviso W8 solo id y tipo) | miCuenta.js:483 | ✔ |
| GET | `/api/mi-cuenta/solicitudes` | Staff:`clientes.gestionar` | — | 200 lista | miCuenta.js:520 | ✔ |
| PATCH | `/api/mi-cuenta/solicitudes/:id` | Staff:`clientes.gestionar` | `{estado: aprobada\|rechazada, respuesta…}` | 200; 400; 404 | miCuenta.js:537 | ✔ |

> **[OBS] BUG-004 / BUG-005:** ninguna pantalla del frontend consume estos endpoints, salvo `POST /password` (`cambiar-password.html`).

## 6. Catálogo — `/api/productos` y `/api/categorias` (MOD-06)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/productos` | Opcional | `?categoria_id`, `?incluir_inactivos=1` (solo staff) | 200 lista filtrada por `evaluarProducto` (vitrina sin precio para invitado); 400 | productos.js:96 | ✔ (reglas) |
| GET | `/api/productos/bajo-inventario` | Staff:`catalogo.gestionar` | `?umbral` (defecto `STOCK_MINIMO`=10) | 200 | productos.js:146 | — |
| GET | `/api/productos/:id` | Opcional | — | 200; **404 si no existe o no es visible** | productos.js:165 | — |
| POST | `/api/productos` | Staff:`catalogo.gestionar` | JSON o multipart (imagen JPG/PNG/WEBP/GIF ≤5 MB): `nombre, descripcion, precio, cantidad_disponible, estado, restringido, categoria_id, macrocategoria, institucion_id, metadatos` | 201 `{id, nombre}`; 400; 403 restringido sin `productos.cumplimiento`; 413 | productos.js:189 | — |
| PUT | `/api/productos/:id` | Staff:`catalogo.gestionar` | Igual | 200; 400; 403 cambio de restricción/institución sin cumplimiento; 404 | productos.js:248 | — |
| DELETE | `/api/productos/:id` | Staff:`catalogo.gestionar` | — | 200; 404 | productos.js:325 | — |
| GET | `/api/categorias` | Público | — | 200 | categorias.js:9 | — |
| GET | `/api/categorias/:id` | Público | — | 200; 404 | categorias.js:20 | — |
| POST | `/api/categorias` | Staff:`catalogo.gestionar` | `{nombre, descripcion}` | 201 `{id}` | categorias.js:32 | — |
| PUT | `/api/categorias/:id` | Staff:`catalogo.gestionar` | `{nombre, descripcion}` | 200 | categorias.js:48 | — |
| DELETE | `/api/categorias/:id` | Staff:`catalogo.gestionar` | — | 200 | categorias.js:64 | — |

## 7. Checkout y pagos (MOD-07)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/checkout/perfil` | Usuario (30/min) | — | 200 perfil para prellenar, `no-store`; 403; 404 | checkout.js:103 | ✔ |
| POST | `/api/checkout` | Usuario | Cabecera `Idempotency-Key` `[A-Za-z0-9_-]{16,128}`; `{items:[{id,cantidad}] (1–100), enviarComprobante: bool, datosComprador, direccionEntrega (3–1000), metodo='mock', autorizacionCompra?}`; rechaza datos de tarjeta | **201** `{pedido_id, estado del pago, proveedor, widget_token, widget_url, expiración}`; 200 repetición idempotente; 400; 403 `CUENTA_NO_ACTIVA` / `REQUIERE_AUTORIZACION_COMPRA` / sin autorización; 409 producto no disponible, sin inventario o clave reutilizada | checkout.js:180 | — |
| POST | `/api/pagos/webhook/:proveedor` | Máquina (HMAC `x-payment-timestamp` + `x-payment-signature`, ventana 5 min) | Cuerpo *raw*; solo `proveedor=mock` | 200 `{ok}` (aceptado o duplicado); 400 importe/evento; 401 firma; 404; 409 `event_id` reutilizado | pagos.js:160 | — |
| POST | `/api/pagos/dev/simular-webhook` | Usuario; deshabilitado en producción o `PAYMENT_MODE≠mock` | `{pedido_id}` | 200; 400; 404; 409; 504 timeout simulado | pagos.js:177 | — |
| GET | `/api/pagos/:pedidoId/estado` | Usuario (solo pedidos propios) | — | 200 `{pedido_id, estado_pedido, estado_pago, monto_centavos, moneda, expira_en}`; 400; 404 | pagos.js:215 | ✔ |
| POST | `/api/pagos/procesar` | Usuario | — | **410 retirado** | pagos.js:243 | — |

## 8. Pedidos — `/api/pedidos` (MOD-08)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo |
|---|---|---|---|---|---|
| POST | `/api/pedidos` | Usuario | — | **410 retirado** (usar `/api/checkout`) | pedidos.js:17 |
| GET | `/api/pedidos/todos` | Staff:`pedidos.gestionar` | — | 200 todos los pedidos | pedidos.js:25 |
| GET | `/api/pedidos` | Usuario | — | 200 historial propio | pedidos.js:49 |
| PUT | `/api/pedidos/:id/cancelar` | Usuario (propio) | — | 200 (libera reserva); 400 no cancelable; 403 ajeno; 404; 409 | pedidos.js:74 |
| PUT | `/api/pedidos/:id` | Staff:`pedidos.gestionar` | `{estado: pendiente\|confirmado\|preparado\|enviado\|entregado\|cancelado}` | 200; 400; 404; 409 (estados de pago solo por webhook) | pedidos.js:135 |
| GET | `/api/pedidos/:clienteId` | Staff:`pedidos.gestionar` | — | 200 compras del cliente | pedidos.js:202 |

## 9. Comprobantes — `/api/comprobantes` (MOD-09)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/comprobantes/:pedidoId` | Usuario dueño **o** `?token=` firmado (24 h) | `?format=pdf`, `?download=1` | 200 JSON o PDF (sin cabecera Authorization siempre PDF); 400; 401; 404 | comprobantes.js:109 | ✔ (token) |
| POST | `/api/comprobantes/:pedidoId/reenviar` | Usuario dueño | — | 202 en cola; 400; 403 sin consentimiento; 404; 429 (3/h) | comprobantes.js:161 | — |

## 10. Clientes — `/api/clientes` (MOD-10)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/clientes` | Staff:`clientes.gestionar` | — | 200 lista descifrada | clientes.js:12 | — |
| GET | `/api/clientes/:id` | Staff:`clientes.gestionar` | — | 200; 404 | clientes.js:37 | — |
| POST | `/api/clientes` | Staff:`clientes.gestionar` | `nombreUnidad, nit, nombreFuncionario, correo, telefono, direcciones` | 201 `{id, nombreUnidad, nit}`; 400 | clientes.js:61 | ✔ |
| PUT | `/api/clientes/:id` | Staff:`clientes.gestionar` (+`restringidos.autorizar` para `autorizacionGeneral`) | Mismos campos + `autorizacionGeneral` | 200; 403; 404; 409 cuenta no aprobada | clientes.js:103 | ✔ |
| DELETE | `/api/clientes/:id` | Staff:`clientes.gestionar` | — | 200; 404 | clientes.js:164 | — |
| POST | `/api/clientes/:id/dato-sensible` | Usuario dueño o admin | `{numeroConsultaAntecedentes, autorizacionSensible:true}` | 201; 400; 403; 404 | clientes.js:190 | ✔ |

## 11. Verificación institucional — `/api/verificacion` (MOD-04)

«Staff» = `requiereAutenticacion` + `requiereAdmin` (verificacion.js:664) + el permiso indicado.

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo |
|---|---|---|---|---|---|
| GET | `/mi-solicitud` | Usuario comprador | — | 200 estado, documentos, comprobaciones (vista del titular); 403 staff; 404 | verificacion.js:267 |
| POST | `/mi-solicitud/documentos` | Usuario (30/h) | multipart `tipoDocumento` + archivo PDF/PNG/JPEG ≤5 MB, máx. 10 | 201 `{id, tipo, mime}`; 400; 409 | verificacion.js:341 |
| GET | `/mi-solicitud/documentos/:id` | Usuario dueño | — | 200 archivo (`attachment`, `nosniff`); 404 | verificacion.js:416 |
| DELETE | `/mi-solicitud/documentos/:id` | Usuario dueño | — | 200; 404; 409 en revisión | verificacion.js:433 |
| POST | `/mi-solicitud/identificador` | Usuario (30/h) | `{tipoDocumento: CC\|CE, numero, autorizaTratamiento:true}` (solo esas claves) | 200/201; 400; 409 | verificacion.js:460 |
| POST | `/mi-solicitud/enviar` | Usuario | `Idempotency-Key` opcional, `{operacion: compra\|catalogo_restringido}` | 200/202; 400; 409 transición o reenvíos agotados; 422 `requisitos` | verificacion.js:507 |
| POST | `/mi-solicitud/clasificacion` | Usuario | Datos de la organización por tipo | 200/202; 400; 409 | verificacion.js:588 |
| GET | `/admin/mis-permisos` | Staff (cualquiera) | — | 200 permisos efectivos | verificacion.js:666 |
| GET | `/admin/solicitudes` | Staff:`verificacion.ver` | `?estado&tipo&desde&hasta&q&cambio` | 200; 400 | verificacion.js:674 |
| GET | `/admin/solicitudes/:clienteId` | Staff:`verificacion.ver` | — | 200 detalle; 404 | verificacion.js:749 |
| GET | `/admin/documentos/:id` | Staff:`documentos.ver` | — | 200 archivo (auditado; si la auditoría falla no se entrega); 404 | verificacion.js:841 |
| POST | `/admin/solicitudes/:clienteId/comprobaciones/:componente` | Staff:`verificacion.ver` + permiso del componente | `{resultado, referencia, observacion}` | 200; 403; 404; 409 | verificacion.js:862 |
| POST | `/admin/solicitudes/:clienteId/identificador/revelar` | Staff:`identificadores.ver` | `{justificacion}` 20–500 | 200 número completo (auditado); 400; 404 | verificacion.js:912 |
| POST | `/admin/solicitudes/:clienteId/decision` | Staff:`verificacion.decidir` | `{decision: aprobar\|rechazar\|solicitar_informacion, motivo}` | 200; 400; 404; 409; 422 / `COMPROBACIONES_INCOMPLETAS` | verificacion.js:932 |
| POST | `/admin/solicitudes/:clienteId/cambio-tipo` | Staff:`verificacion.decidir` | `{decision: aprobar\|rechazar, motivo}` | 200; 400; 409; 422 | verificacion.js:1011 |
| POST | `/admin/solicitudes/:clienteId/suspension` | Staff:`cuentas.suspender` | `{accion: suspender\|reactivar, motivo ≥10}` | 200; 400; 404; 409 | verificacion.js:1072 |
| POST | `/admin/solicitudes/:clienteId/restringidos` | Staff:`restringidos.autorizar` | `{autorizar: bool, motivo ≥10}` | 200; 400; 404; 409 no aprobada / vencida | verificacion.js:1118 |
| GET | `/admin/productos` | Staff:`productos.cumplimiento` | `?revision` | 200; 400 | verificacion.js:1159 |
| PUT | `/admin/productos/:id/cumplimiento` | Staff:`productos.cumplimiento` | restricción, institución, elegibles, `revision_legal`, motivo ≥10 | 200; 400; 404 | verificacion.js:1203 |
| GET | `/admin/permisos` | Staff:`staff.permisos` | — | 200 personal y permisos | verificacion.js:1262 |
| PUT | `/admin/permisos/:usuarioId` | Staff:`staff.permisos` | `{permisos:[…]}` | 200; 400; 403 reservados; 404; 409 auto-retiro | verificacion.js:1303 |
| POST | `/admin/personal` | Staff:`staff.permisos` | `{correo, password temporal 12–72, permisos}` | 201 `{usuarioId}`; 400; 403; 409 duplicado | verificacion.js:1350 |
| GET | `/admin/diagnostico` | Superadmin | — | 200 migraciones, outbox, conteos y configuración presente (sin valores) | verificacion.js:1389 |
| POST | `/compra/autorizacion` | Usuario (limitado) | `{items}` del carrito | 201 `{autorizacion, expiraEnMinutos}` + código al correo; 400; 403 `CUENTA_NO_ACTIVA`/`REQUIERE_VERIFICACION`; 409 | verificacion.js:1445 |
| POST | `/compra/autorizacion/confirmar` | Usuario (limitado) | `{autorizacion (64 hex), codigo (6)}` | 200; 400; 401/409/410 según estado | verificacion.js:1522 |

Rutas completas: prefijo `/api/verificacion` (p. ej. `/api/verificacion/admin/diagnostico`).

## 12. Asistente y atención (MOD-11)

| Método | Ruta | Acceso | Entrada | Respuesta / errores | Archivo | Prueba |
|---|---|---|---|---|---|---|
| POST | `/api/asistente/mensaje` | Opcional (20/min por IP) | `{mensaje ≤500, conversacionId?, productoActualId?}` | 200 `{respuesta…, escalar, origen, conversacionId}`; 400; 429 | asistente.js:230 | ✔ |
| GET | `/api/asistente/sugerencias` | Público | — | 200 `{sugerencias}` | asistente.js:231 | ✔ |
| GET | `/api/asistente/pendientes/resumen-semanal` | Máquina (`Authorization: Bearer ASSISTANT_WEEKLY_SUMMARY_TOKEN`, ≥32) | — | 200 `{periodo_dias, total, por_dia}`; 401; 503 | asistente.js:248 | ✔ |
| POST | `/api/atencion/mensaje` | Público (20/min) | Igual que asistente (motor local, sin n8n) | 200 | atencion.js:18 | ✔ |
| POST | `/api/atencion/solicitudes` | Público (5/15 min), *honeypot* `website` | `{tipoSolicitud, tipoEntidad, entidad, nit 9–10 díg., correo, criticidad, mensaje 20–2000, autorizacionDatos:'true'}` | 201 `{ok, radicado:'SI-00000000'}`; 400 | atencion.js:32 | ✔ |
| POST | `/api/atencion/calificacion` | Público (20/15 min por IP; BUG-002 corregido) | `{conversacionId?, calificacion 1–5, comentario ≤1000, escaladoAHumano}` | 201 `{id}`; 400 | atencion.js:77 | ✔ |

## 13. Reportes, contacto y auditoría (MOD-11, MOD-12, MOD-13)

Actualizado el 2026-10-16 (corrección de BUG-001, BUG-002, BUG-004, BUG-005 y BUG-028). "Admin" = rol admin leído de la base + permiso indicado (o superadministrador).

| Método | Ruta | Acceso | Entrada | Respuesta | Archivo |
|---|---|---|---|---|---|
| GET | `/api/reportes/mensual` | Admin: `clientes.gestionar` | — | 200 `{clientesAtendidos, escaladosAHumano, calificacionPromedio, sugerencias, pedidosPorEstado, productosMasVendidos, reportesClientes:{total, nuevos, calificacionPromedio}}`; 401; 403 | reportes.js:29 |
| GET | `/api/reportes/clientes/contador` | Admin: `clientes.gestionar` | — | 200 `{nuevos}` | reportes.js:82 |
| GET | `/api/reportes/clientes` | Admin: `clientes.gestionar` | `?estado=nuevo|en_revision|atendido|todos`, `?clienteId`, `?limite ≤200`, `?antesDeId` | 200 `{reportes:[{id, clienteId, comentario, calificacion, fecha, estado, respuestaAdmin, atendidoEn, atendidoPor, cliente:{entidad, funcionario, correo, tipoInstitucion}}], hayMas}`; 400 | reportes.js:96 |
| PATCH | `/api/reportes/clientes/:id` | Admin: `clientes.gestionar` | `{estado, respuesta? ≤1000}` (estricto) | 200; 400; 404. Audita `gestionar_reporte_cliente` sin el texto; con respuesta avisa al cliente por correo sin el texto | reportes.js:168 |
| GET | `/api/mis-reportes` | Usuario | — | 200 reportes propios con `estado`, `respuesta_admin`, `atendido_en` | misreportes.js:53 |
| POST | `/api/mis-reportes` | Usuario con cliente (10/h por IP) | `{comentario ≤2000, calificacion 1–5}` | 201 `{id}`; 400; 429. Avisa a `ADMIN_NOTIFICATION_EMAIL` sin el comentario | misreportes.js:72 |
| PUT | `/api/mis-reportes/:id` | Usuario dueño, reporte `nuevo` | Igual | 200; 400; 403; 404; 409 `REPORTE_EN_GESTION` | misreportes.js:98 |
| DELETE | `/api/mis-reportes/:id` | Usuario dueño, reporte `nuevo` | — | 200; 403; 404; 409 | misreportes.js:116 |
| GET | `/api/admin/contacto/contador` | Admin: `clientes.gestionar` | — | 200 `{recibidas}` | adminContacto.js:30 |
| GET | `/api/admin/contacto` | Admin: `clientes.gestionar` | `?estado=recibida|en_gestion|cerrada|todas`, `?tipo`, `?limite`, `?antesDeId` | 200 `{solicitudes:[{id, radicado, tipoSolicitud, tipoEntidad, entidad, nit, correo, criticidad, mensaje, estado, respuestaAdmin, …}], hayMas}` (NIT y correo descifrados; audita `ver_solicitudes_contacto`) | adminContacto.js:42 |
| PATCH | `/api/admin/contacto/:id` | Admin: `clientes.gestionar` | `{estado, respuesta? ≤1000, notificar?}` | 200 `{ok, estado, notificada}`; 400; 404. Con `notificar` envía la respuesta al correo del remitente | adminContacto.js:110 |
| GET | `/api/mi-cuenta/mis-solicitudes` | Usuario | — | 200 solicitudes propias con respuesta | miCuenta.js:522 |
| GET | `/api/mi-cuenta/solicitudes` | Admin: `clientes.gestionar` | — | 200 (incluye `correo`, `nombre_unidad`, `resuelta_por_correo`) | miCuenta.js:542 |
| PATCH | `/api/mi-cuenta/solicitudes/:id` | Admin: `clientes.gestionar` | `{estado, respuesta?}` | 200; 404. Avisa al titular por correo sin la respuesta | miCuenta.js:562 |
| GET | `/api/auditoria` | Admin: `auditoria.ver` | `?entidad`, `?accion`, `?correo` (prefijo, comodines literales), `?desde`/`?hasta` (AAAA-MM-DD), `?limite ≤500`, `?antesDeId` | 200 arreglo de registros; 400 | auditoria.js:15 |
| GET | `/api/auditoria/filtros` | Admin: `auditoria.ver` | — | 200 `{entidades, acciones}` | auditoria.js:69 |

Pantallas: `admin-reportes-clientes.html`, `admin-contacto.html` (pestañas Contacto y Datos de cuenta), `admin-auditoria.html`, `mi-cuenta.html`, `mis-reportes.html` y `reportes.html`. Migración `004_seguimiento_reportes_contacto` (columnas de estado y respuesta).

## 14. Automatizaciones — `/api/automatizaciones` (MOD-14)

| Método | Ruta | Acceso | Entrada | Respuesta | Archivo | Prueba |
|---|---|---|---|---|---|---|
| GET | `/api/automatizaciones/resumen-diario` | Máquina `x-automation-token` = `N8N_W2_DAILY_SUMMARY_TOKEN` | — | 200 `{evento:'resumen_diario', total (centavos, cadena), moneda:'COP', fecha}`; 401; 503 | automatizaciones.js:10 | ✔ |
| POST | `/api/automatizaciones/pedidos/expirar` | Máquina `N8N_W4_EXPIRY_TOKEN` | — | 200 `{ok}` | automatizaciones.js:34 | ✔ |
| POST | `/api/automatizaciones/verificaciones/resultado` | Máquina: HMAC con `N8N_W11_CALLBACK_SECRET` + nonce (60/min) | `{ref, componente:'entidad', metodo, resultado, fuente, consultadoEn, nonce}` | 200; 400 esquema; 401 firma; 404 ref; 409 nonce/estado | automatizaciones.js:60 | — |
| POST | `/api/automatizaciones/verificaciones/mantenimiento` | Máquina `N8N_W11_MAINTENANCE_TOKEN` | — | 200 `{ok, …conteos}` | automatizaciones.js:81 | — |

## 15. Hallazgos sobre la API

| ID | Hallazgo | Recomendación [REC] |
|---|---|---|
| BUG-001 | **Corregido 2026-10-16.** `GET /api/reportes/mensual` sin autenticación expone métricas y comentarios | Exigir `requiereAutenticacion` + `requiereAdmin` + permiso (p. ej. `pedidos.gestionar` o uno nuevo `reportes.ver`) |
| BUG-002 | **Corregido 2026-10-16.** `POST /api/atencion/calificacion` sin límite | Añadir `express-rate-limit` y validar `conversacionId` existente |
| — | Rutas retiradas que responden 410: `POST /api/pedidos`, `POST /api/pagos/procesar` | Mantener o eliminar tras confirmar que ningún cliente las usa (`frontend/js/cart.js` solo las menciona en un comentario) |
| — | El diagnóstico informa `mfaN8n` (configuración de W5), que ya no interviene en el envío MFA | Retirar o renombrar el indicador |

## Referencias

- [API/README.md](API/README.md) · [Ejemplos_Seguros/README.md](Ejemplos_Seguros/README.md)
- [../03_DISENO/08_DISENO_DE_API.md](../03_DISENO/08_DISENO_DE_API.md)
- [../docs/ARQUITECTURA_OBJETIVO.md](../docs/ARQUITECTURA_OBJETIVO.md) · [../docs/ARQUITECTURA_VERIFICACION.md](../docs/ARQUITECTURA_VERIFICACION.md)
