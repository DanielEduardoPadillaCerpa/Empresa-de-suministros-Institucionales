# Auditoría técnica — Suministros Institucionales

Fecha: 2026-10-13. Alcance: repositorio completo, con foco en la seguridad del registro de clientes y la autorización de compra.

Este documento reúne lo que el plan pedía en cinco archivos (`AUDITORIA_TECNICA`, `ARQUITECTURA_ACTUAL`, `MODELO_DATOS_ACTUAL`, `INVENTARIO_FUNCIONALIDADES`, `RIESGOS_Y_DEUDA_TECNICA`) para no duplicar contenido. La arquitectura y el modelo resultantes están en [ARQUITECTURA_OBJETIVO.md](ARQUITECTURA_OBJETIVO.md) y [MODELO_DATOS.md](MODELO_DATOS.md).

## 1. Arquitectura encontrada (verificada)

| Capa | Tecnología | Archivos |
|---|---|---|
| Frontend | HTML estático + Bootstrap 5.3.3 (CDN) + JS sin framework | `frontend/*.html`, `frontend/js/*.js` |
| Backend | Node.js 24 + Express 4, CommonJS | `backend/server.js`, `backend/src/**` |
| Base de datos | MySQL (Clever Cloud según `.env`), `mysql2/promise`, consultas parametrizadas | `backend/src/db.js` |
| Autenticación | bcrypt + JWT (2 h) + refresh token rotativo (hash SHA-256 en BD) + MFA por correo vía webhook n8n | `backend/src/routes/auth.js`, `src/mfaCourier.js`, `src/mfaCodes.js` |
| Automatización | n8n (W1–W10), outbox con firma HMAC | `n8n/workflows/*.json`, `src/automationOutbox.js` |
| Pagos | Proveedor `mock` con webhook firmado e idempotencia | `src/paymentProvider.js`, `src/routes/pagos.js`, `src/routes/checkout.js` |
| Pruebas | Jest + supertest (BD simulada) y `node:test` | `backend/test/*` |

- Punto de entrada: `backend/server.js`, puerto `PORT` (8081 en `.env`). El backend también sirve `frontend/` como estáticos.
- Migraciones: `migrar()` en `db.js` con `CREATE TABLE IF NOT EXISTS` y `ALTER` tolerantes; no había control de versiones de esquema.
- Sesión: JWT en `localStorage` (`si_auth`). `requiereAutenticacion` valida firma, `mfa === true` y `session_version` contra la BD en cada petición (revocación efectiva).
- MFA: código de 6 dígitos, HMAC con *pepper*, 5 min, 5 intentos, 60 s entre reenvíos, invalidado al usarse. Correcto y conservado sin cambios funcionales.

## 2. Modelo de datos encontrado

Tablas: `clientes` (datos privados cifrados AES-256-GCM, `autorizacion_general`), `datos_sensibles`, `usuarios` (`rol ENUM('cliente','admin')`, `session_version`), `refresh_tokens`, `retos_mfa`, `categorias`, `productos` (`institucion_id` único, `restringido`, `metadatos`), `pedidos`, `detalle_pedido`, `pagos`, `eventos_pago`, `comprobantes`, `correo_outbox`, `automation_outbox`, `solicitudes_cuenta`, `solicitudes_contacto`, `auditoria` (`accion ENUM('crear','editar','eliminar')`), `faq_asistente`, `asistente_pendientes`, `atenciones`, `reportes_cliente`.

## 3. Inventario de funcionalidades (estado antes del cambio)

| Funcionalidad | Estado | Observación |
|---|---|---|
| Registro de cliente | Funcionaba | Un solo formulario para todos; sin tipo de institución ni estados |
| Login + MFA + refresh + logout | Funcionaba | Conservado |
| Catálogo, detalle, filtros | Funcionaba | Segmentado por dominio de correo (ver riesgos) |
| Carrito (localStorage) y checkout | Funcionaba | Revalida stock y precio en servidor |
| Pagos mock, comprobantes, outbox | Funcionaba | Sin cambios |
| Asistente de catálogo | Funcionaba | Mismo criterio de dominio |
| Paneles admin (clientes, productos, pedidos, dashboard, reportes) | Funcionaba | Un único rol `admin` con todas las facultades |
| Mi cuenta (cambio de correo con MFA, contraseña, solicitudes) | Funcionaba | Conservado |

## 4. Hallazgos de seguridad del registro y la autorización

| # | Severidad | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| H1 | Alta | La institución se deducía solo del dominio del correo; cualquier correo no mapeado obtenía `corporativo` con precios y compra, sin revisión humana | `tenancy.js` `resolverInstitucion`, usado por `productos.js`, `checkout.js`, `asistente.js` | Corregido |
| H2 | Alta | No existían estados de verificación: registrarse equivalía a estar habilitado | `auth.js` `/registro` | Corregido |
| H3 | Alta | Visitantes veían nombre, imagen y descripción de **todos** los productos, incluidos restringidos (chalecos y placas balísticas) | `productos.js` GET `/` + `datosPublicosInvitado` sin filtro | Corregido |
| H4 | Media | El catálogo y el checkout confiaban en `institucionId` del JWT; un cambio de estado no surtía efecto hasta que expirara el token | `productos.js`, `checkout.js` | Corregido (se lee de MySQL en cada decisión) |
| H5 | Media | Cualquier admin podía conceder la autorización de productos restringidos desde la edición general del cliente | `clientes.js` PUT | Corregido (permiso `restringidos.autorizar` + cuenta aprobada) |
| H6 | Media | Registro sin límite de solicitudes | `auth.js` | Corregido (10/h por IP, configurable) |
| H7 | Media | `restringido` llegaba como texto `"false"` por FormData y `!!"false"` lo marcaba como restringido | `productos.js` PUT/POST | Corregido (`aBooleano`) |
| H8 | Media | El administrador inicial usaba la contraseña por defecto `CambiaEstaClave123` y la **imprimía en consola** | `db.js` `sembrarAdminPorDefecto` | Corregido (exige `ADMIN_PASSWORD` ≥ 12, no se registra) |
| H9 | Baja | NIT sin validación de formato ni dígito de verificación | `auth.js` | Corregido (algoritmo DIAN) |
| H10 | Baja | `backend/.env` sin estar en `.gitignore` (riesgo de publicar secretos con `git add .`) | `.gitignore` | Corregido |
| H11 | Info | Contraseña mínima de 8 caracteres | `auth.js` | Subida a 10–72 y sin contener el usuario del correo |

## 5. Riesgos y deuda técnica que siguen abiertos

- **`nodemailer` ≤ 10.0.5 con vulnerabilidades altas** (`npm audit`). La corrección exige una versión mayor; requiere probar el envío de comprobantes antes de actualizar.
- **JWT en `localStorage`**: un XSS permitiría robar la sesión. Mitigado por el escape sistemático en las páginas nuevas; migrar a cookie `HttpOnly` + CSRF es un cambio de arquitectura no abordado.
- **Sin antivirus**: los documentos se validan por firma de contenido y se rechazan PDF con contenido activo, pero no hay escaneo antimalware (ClamAV u otro) disponible.
- **Sin cabeceras de seguridad globales** (CSP, HSTS): el backend sirve los estáticos sin `helmet`. Recomendado al desplegar detrás de un proxy.
- **Las páginas nuevas no están traducidas** en `i18n.js` (solo español).
- `automation-outbox` mostró un `ER_LOCK_DEADLOCK` transitorio al arrancar en la BD de pruebas (código preexistente; se reintenta en el siguiente ciclo).
- Un pago ya iniciado antes de suspender una cuenta puede completarse por webhook (el pedido se creó cuando la cuenta estaba autorizada).

## 6. Lo que no se pudo verificar

- El entorno de producción real (Clever Cloud) no se probó con escrituras; ver el incidente de la sección 7.
- El envío real de correo MFA por n8n (se usó un receptor local en las pruebas).
- La existencia de APIs públicas para validar la pertenencia a Policía, Fuerzas Militares, Bomberos, etc.: no se encontró ninguna utilizable; la verificación es documental + correo institucional + revisión humana.

## 7. Incidente durante el trabajo: migración aplicada en la base de Clever Cloud

Durante la implementación estaba corriendo `node --watch server.js` (iniciado por el usuario a las 09:44 con `backend/.env` apuntando a Clever Cloud). Cada guardado reinició el servidor, y a partir de las 09:58 ese arranque ejecutó la migración `001_verificacion_institucional` sobre la base real. Comprobación de solo lectura: el servidor en `:8081` responde `/api/auth/registro/tipos` y el catálogo consulta `productos_elegibilidad` sin error.

La migración solo **agrega** tablas, columnas e índices y no borra filas, pero cambia el comportamiento:

1. Los clientes existentes quedaron en `borrador` y **ya no ven precios ni pueden comprar** hasta completar su verificación.
2. Los productos con `restringido = TRUE` quedaron con `revision_legal = 'pendiente'` (no se venden).
3. `auditoria.accion` pasó de `ENUM` a `VARCHAR(40)` (valores conservados).
4. Los administradores existentes recibieron los siete permisos de staff.

Opciones (decisión del negocio): mantenerlo y pedir a los clientes que completen su verificación; aprobar desde el panel a los clientes ya conocidos; o revertir con `node scripts/migraciones.js revertir 001_verificacion_institucional --confirmo-perdida-de-datos` y volver al código anterior (respaldo en `.respaldo-pre-verificacion/`).

## 8. Segunda auditoría (2026-10-13): registro mínimo y verificación en la compra

Punto de recuperación: rama `feat/verificacion-en-compra`, commit `07e7e37`. Documentos relacionados: [ARQUITECTURA_ACTUAL.md](ARQUITECTURA_ACTUAL.md), [FLUJO_AUTENTICACION_ACTUAL.md](FLUJO_AUTENTICACION_ACTUAL.md), [INVENTARIO_FUNCIONALIDADES.md](INVENTARIO_FUNCIONALIDADES.md).

| # | Severidad | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| A1 | Alta | La clave AES se deriva rellenando o truncando el texto de `CRYPTO_KEY` (no es una clave aleatoria de 32 bytes). El valor del `.env` local es un texto legible. `descifrar()` devuelve el valor original si falla, lo que oculta manipulaciones. | `src/crypto.js` | Corregido para datos nuevos: anillo de claves versionado (`v2:`) con clave aleatoria obligatoria. Los datos antiguos siguen legibles; rotarlos requiere un script y una ventana de mantenimiento. |
| A2 | Alta | `JWT_SECRET` tiene un valor por defecto en el código y el del `.env` es un texto legible. No se valida al arrancar. | `routes/auth.js` | Corregido: en producción el arranque falla con secretos cortos o de ejemplo. Hay que rotar el secreto real (lo hace el equipo de operación). |
| A3 | Media | `N8N_MFA_WEBHOOK_SECRET` del `.env` es un texto legible. | `.env` | Pendiente de rotación por operación; ahora se valida en producción. |
| A4 | Media | `backend/generarHash.js` contiene una contraseña fija. | archivo | Excluido del repositorio (`.gitignore`); no lo usa el código. |
| A5 | Media | El servidor local usa la base de producción sin `NODE_ENV=production` y sin `PAYMENT_MODE`, así que queda en modo mock y `/api/pagos/dev/simular-webhook` está habilitado contra datos reales. | `.env`, `routes/pagos.js` | Documentado; se recomienda `NODE_ENV=production` o una base de desarrollo. |
| A6 | Media | Las rutas administrativas heredadas usan `requiereAdmin` (rol del token): cualquier admin, aunque no tenga permisos, gestiona productos, pedidos, clientes y auditoría. No existe un superadministrador y quien tiene `staff.permisos` puede crear administradores con todos los permisos. | `routes/productos.js`, `categorias.js`, `pedidos.js`, `clientes.js`, `auditoria.js` | Corregido: permisos `catalogo.gestionar`, `pedidos.gestionar`, `clientes.gestionar`, `auditoria.ver`, y superadministrador. |
| A7 | Media | El administrador sembrado desde variables no tiene que cambiar su contraseña. | `db.js` | Corregido (`debe_cambiar_password`). |
| A8 | Media | El registro exige 12 o más datos (NIT, cargo, dependencia, ubicación, teléfono) antes de crear la cuenta, en contra del principio de minimización. | `registroInstitucional.js` | Corregido: registro mínimo. |
| A9 | Media | Una cuenta sin verificar no puede comprar ni siquiera productos de uso general; la verificación institucional es requisito para cualquier compra. | `autorizacion.js`, `checkout.js` | Corregido: la verificación se pide solo cuando la operación la requiere. |
| A10 | Baja | La API de n8n local rechaza la `N8N_API_KEY` (401): no se pudo comparar lo desplegado con el repositorio. | prueba del 2026-10-13 | Pendiente de credencial. |
