# Mapa pantalla → endpoint

| Campo | Valor |
|---|---|
| ID documental | DOC-04-API-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Mostrar qué archivos del frontend consumen cada endpoint, para evaluar el impacto de un cambio de API.

## Alcance

**[OBS]** Obtenido buscando literales `/api/...` en `../../frontend/*.html` y `../../frontend/js/*.js`. Las rutas con parámetros aparecen con su prefijo (p. ej. `/api/clientes/`).

| Archivo | Endpoints usados |
|---|---|
| `frontend/landing.html` | `/api/productos` |
| `frontend/index.html` | `/api/productos`, `/api/categorias` |
| `frontend/producto-detalle.html` | `/api/productos/:id`, `/api/categorias` |
| `frontend/login.html` | `/api/auth/login`, `/api/auth/mfa/verificar`, `/api/auth/mfa/reenviar`, `/api/auth/mfa/cancelar` |
| `frontend/js/captcha.js` | `/api/auth/captcha` |
| `frontend/js/registro-wizard.js` | `/api/auth/registro`, `/api/auth/registro/tipos` |
| `frontend/registro.html` | `/api/auth/registro`, `/api/clientes`, `/api/clientes/:id` (modo edición de ficha por administrador) |
| `frontend/js/auth.js` | `/api/auth/refresh`, `/api/auth/logout` |
| `frontend/cambiar-password.html` | `/api/mi-cuenta/password` |
| `frontend/js/checkout-autofill.js` | `/api/checkout/perfil` |
| `frontend/checkout.html` | `/api/checkout`, `/api/pagos/dev/simular-webhook`, `/api/pagos/:id/estado`, `/api/comprobantes/:id` (JSON, PDF, reenviar), `/api/verificacion/compra/autorizacion`, `/api/verificacion/compra/autorizacion/confirmar` |
| `frontend/historial.html` | `/api/pedidos`, `/api/pedidos/:id/cancelar`, `/api/comprobantes/:id` |
| `frontend/mis-pedidos.html` | `/api/pedidos` |
| `frontend/js/cart.js` | `/api/pedidos` (solo en un comentario; el pedido se crea por checkout) |
| `frontend/mis-reportes.html` | `/api/mis-reportes`, `/api/mis-reportes/:id` |
| `frontend/mi-verificacion.html` | `/api/auth/registro/tipos`, `/api/verificacion/mi-solicitud` (+ `/documentos`, `/documentos/:id`, `/identificador`, `/enviar`, `/clasificacion`) |
| `frontend/contacto.html` | `/api/atencion/solicitudes` |
| `frontend/js/chatbot.js` | `/api/asistente/mensaje`, `/api/asistente/sugerencias`, `/api/atencion/calificacion` |
| `frontend/js/reportes.js` | `/api/reportes/mensual` |
| `frontend/admin-dashboard.html` | `/api/categorias`, `/api/clientes`, `/api/pedidos/todos`, `/api/productos`, `/api/verificacion/admin/solicitudes` |
| `frontend/admin-clientes.html` | `/api/clientes`, `/api/clientes/:id`, `/api/pedidos/:clienteId` |
| `frontend/admin-pedidos.html` | `/api/pedidos/todos`, `/api/pedidos/:id` |
| `frontend/admin-productos.html` | `/api/productos`, `/api/productos/:id`, `/api/categorias` |
| `frontend/admin-solicitudes.html` | `/api/admin/solicitudes`, `/api/admin/solicitudes/:id`, `/api/admin/solicitudes/:id/aprobar\|rechazar` |
| `frontend/js/admin-solicitudes-contador.js` | `/api/admin/solicitudes/contador` |
| `frontend/admin-verificaciones.html` | `/api/auth/registro/tipos`, `/api/verificacion/admin/*` (solicitudes, documentos, mis-permisos, permisos, personal, productos, diagnostico) |

## Endpoints sin consumidor en el frontend [OBS]

`GET/PATCH /api/mi-cuenta`, `/api/mi-cuenta/correo/*`, `/api/mi-cuenta/sesiones/cerrar-todas`, `/api/mi-cuenta/solicitud-cambio`, `/api/mi-cuenta/solicitudes*` (BUG-004, BUG-005); `GET /api/productos/bajo-inventario`; `/api/auditoria`; `/api/atencion/mensaje` (ruta heredada); endpoints de máquina (`/api/automatizaciones/*`, `/api/pagos/webhook/*`, resumen semanal).

## Referencias

- [README.md](README.md) · [../08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../08_CONTRATOS_Y_ENDPOINTS_DE_API.md)
- [../../03_DISENO/09_DISENO_DE_INTERFACES_Y_NAVEGACION.md](../../03_DISENO/09_DISENO_DE_INTERFACES_Y_NAVEGACION.md)
