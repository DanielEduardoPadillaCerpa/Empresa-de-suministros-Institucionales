# Arquitectura actual (antes de la verificación en la compra)

Fecha de inspección: 2026-10-13. Punto de recuperación: rama `feat/verificacion-en-compra`, commit `07e7e37` ("punto de recuperación antes de la verificación en compra").

## Componentes verificados

| Componente | Estado comprobado | Evidencia |
|---|---|---|
| Frontend | HTML estático + Bootstrap 5.3 (CDN) + JS sin framework, servido por el propio backend | `frontend/*.html`, `frontend/js/*.js`, `app.js` (`express.static`) |
| Backend | Node.js 24 + Express 4 (CommonJS). `server.js` arranca `src/app.js` | `backend/server.js`, `backend/src/app.js` |
| Base de datos | MySQL. `backend/.env` apunta a Clever Cloud (producción). Pruebas en MySQL 8 local (Docker, puerto 3307, base `suministros_test`) | `src/db.js`, contenedor `suministros-test-mysql` |
| Migraciones | `migrar()` (DDL tolerante) + migraciones versionadas en `schema_migraciones` (`001_verificacion_institucional`) | `src/db.js`, `src/migraciones/` |
| Autenticación | bcrypt + JWT 2 h + refresh rotativo + MFA por correo (n8n W5) | ver [FLUJO_AUTENTICACION_ACTUAL.md](FLUJO_AUTENTICACION_ACTUAL.md) |
| Autorización | `autorizacion.js`: contexto leído de MySQL en cada decisión; 7 permisos de staff | `src/autorizacion.js` |
| Automatización | n8n 1.110 local (`empresa-n8n`, puerto 5678). Backend → n8n por *outbox* firmado HMAC; n8n → backend con `x-automation-token` | `src/automationOutbox.js`, `src/automationAuth.js`, `n8n/workflows/W1..W10` |
| Correo | Mailpit local (1025/8025) para desarrollo; SMTP real vía n8n | `.env`, `src/email.js` |
| Pagos | Proveedor `mock` (no hay pasarela real configurada) | `src/paymentProvider.js` |

## Workflows de n8n (copia del repositorio)

La API del n8n local respondió `401 unauthorized` con la `N8N_API_KEY` del `.env`, así que no se pudo comparar con lo desplegado. Los JSON del repositorio están todos con `active: false`.

| Workflow | Disparador | Función | Autenticación |
|---|---|---|---|
| W1 Alertas de pago | Webhook `empresa-alerta-pago` | Aviso al administrador | HMAC + ventana de 5 min |
| W2 Resumen diario | Programado | Lee `/api/automatizaciones/resumen-diario` | `x-automation-token` |
| W3 Stock bajo | Webhook | Aviso al administrador | HMAC |
| W4 Expirar pedidos | Cada minuto | `POST /api/automatizaciones/pedidos/expirar` | `x-automation-token` |
| W5 MFA | Webhook `mfa-login-code` | Envía el código de acceso | secreto compartido |
| W6 Asistente | Webhook | Escalado al administrador | HMAC + Bearer |
| W7 Resumen asistente | Programado | Lee resumen semanal | Bearer |
| W8 Cuenta | Webhook `account-events` | Avisos de seguridad y solicitudes | HMAC, lista blanca de eventos y claves exactas |
| W9 Comprobantes | Webhook | Envía comprobantes | secreto |
| W10 Contexto institucional | Subflujo | Resuelve ámbito institucional | interno |

Ningún workflow toma decisiones de autorización: todas están en el backend. Ese es el patrón que se conserva.

## Flujo de compra encontrado

1. Catálogo (`GET /api/productos`): `evaluarProducto()` decide visibilidad y nivel (vitrina o completo).
2. Carrito en `localStorage` (`cart.js`), solo ids y cantidades confiables en el servidor.
3. `POST /api/checkout` con `Idempotency-Key`: relee el contexto con `FOR UPDATE`, revalida productos, precios e inventario, crea pedido `pendiente_pago`, reserva stock y crea el intento de pago.
4. Webhook de pago firmado → pedido confirmado. `POST /api/pedidos` y `/api/pagos/procesar` están retirados (410).

## Modelo de cuentas encontrado

- `usuarios.rol ∈ {cliente, admin}`. No hay superadministrador.
- `clientes.estado_verificacion ∈ {borrador, pendiente, requiere_informacion, aprobado, rechazado, suspendido}`.
- Una cuenta en `borrador` **no ve precios ni compra nada**, ni siquiera productos de uso general.
- El registro exige 12 o más campos (NIT, entidad, dependencia, cargo, municipio, direcciones, teléfono…) antes de crear la cuenta.
