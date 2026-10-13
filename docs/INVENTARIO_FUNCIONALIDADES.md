# Inventario de funcionalidades (2026-10-13, antes del cambio)

Estado comprobado con las suites existentes: Jest 101/101, `node:test` 32/32, integración MySQL 24/24 (ejecutadas el 2026-10-13 sobre el commit `07e7e37`).

| Área | Funcionalidad | Endpoints / páginas | Estado | Se conserva |
|---|---|---|---|---|
| Cuentas | Registro por pasos con tipo de institución | `POST /api/auth/registro`, `registro.html` | Funciona; pide demasiados datos | Se simplifica |
| Cuentas | Login + MFA + refresh + logout | `/api/auth/*`, `login.html` | Funciona | Sí |
| Cuentas | Mi cuenta: correo con MFA, contraseña, sesiones, solicitudes | `/api/mi-cuenta/*` | Funciona | Sí |
| Verificación | Solicitud, documentos cifrados, historial | `/api/verificacion/mi-solicitud*`, `mi-verificacion.html` | Funciona | Sí, se amplía |
| Verificación | Panel de revisión, decisiones, suspensión, restringidos | `/api/verificacion/admin/*`, `admin-verificaciones.html` | Funciona | Sí, se amplía |
| Staff | 7 permisos, alta de personal | `/api/verificacion/admin/permisos`, `/admin/personal` | Funciona; sin superadministrador | Se amplía |
| Catálogo | Listado, filtros, detalle, categorías | `/api/productos`, `/api/categorias`, `index.html`, `producto-detalle.html` | Funciona | Sí |
| Catálogo | Elegibilidad M:N, revisión legal | `/api/verificacion/admin/productos` | Funciona | Sí |
| Compra | Carrito (`localStorage`) | `cart.js` | Funciona | Sí |
| Compra | Checkout idempotente con reserva de stock | `POST /api/checkout`, `checkout.html` | Funciona; exige cuenta aprobada incluso para uso general | Se ajusta |
| Pagos | Proveedor mock, webhook firmado, expiración | `/api/pagos/*`, W4 | Funciona | Sí |
| Pedidos | Historial, cancelación, gestión admin | `/api/pedidos/*`, `mis-pedidos.html`, `admin-pedidos.html` | Funciona | Sí |
| Comprobantes | PDF y envío por correo | `/api/comprobantes/*`, W9 | Funciona | Sí |
| Asistente | Asistente de catálogo y escalado | `/api/asistente/*`, W6, W7 | Funciona | Sí |
| Reportes | Reportes de cliente y mensuales | `/api/reportes`, `/api/mis-reportes` | Funciona | Sí |
| Auditoría | Registro de acciones administrativas | `/api/auditoria` | Funciona; visible para cualquier admin | Se restringe por permiso |
| Automatización | Outbox firmado hacia n8n | `automationOutbox.js` | Funciona | Sí, se amplía (W11) |

## Funcionalidades inexistentes que pide el nuevo alcance

- Registro mínimo con la verificación diferida hasta que una compra la necesite.
- Captura protegida del identificador personal (cédula) con índice HMAC.
- Doble comprobación con métodos independientes y tabla de decisión.
- Autorización por operación (vinculada al carrito y de un solo uso) para productos restringidos.
- Superadministrador, cambio obligatorio de la credencial inicial y cuentas de prueba sintéticas.
- Orquestación de la verificación en n8n con respuestas autenticadas y protección contra repetición.
