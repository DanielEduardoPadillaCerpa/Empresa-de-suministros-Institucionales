# API — fichas por router

| Campo | Valor |
|---|---|
| ID documental | DOC-04-API-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Índice de los 17 routers montados en `../../backend/src/app.js`, con enlace a su contrato detallado y documentos complementarios de esta carpeta.

## Alcance

El contrato completo (método, ruta, acceso, entrada, respuesta, errores y archivo:línea) está en [../08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../08_CONTRATOS_Y_ENDPOINTS_DE_API.md). Aquí: ficha resumida por router, [mapa-frontend-api.md](mapa-frontend-api.md) (qué pantalla llama a qué endpoint) y [matriz-permisos-endpoints.md](matriz-permisos-endpoints.md).

## Routers

| Prefijo | Archivo | Endpoints | Módulo | Middleware de acceso | Sección en 08 |
|---|---|---|---|---|---|
| `/api/auth` | [auth.js](../../backend/src/routes/auth.js) | 9 | MOD-01/02 | Limitadores por IP; captcha en registro y login | §3 |
| `/api/admin/solicitudes` | [solicitudesRegistro.js](../../backend/src/routes/solicitudesRegistro.js) | 5 | MOD-02 | JWT propio + autorización en lote SQL (`clientes.gestionar`) | §4 |
| `/api/mi-cuenta` | [miCuenta.js](../../backend/src/routes/miCuenta.js) | 9 | MOD-03 | `router.use(requiereAutenticacion)` | §5 |
| `/api/productos` | [productos.js](../../backend/src/routes/productos.js) | 6 | MOD-06 | `autenticacionOpcional` / `catalogo.gestionar` | §6 |
| `/api/categorias` | [categorias.js](../../backend/src/routes/categorias.js) | 5 | MOD-06 | Público / `catalogo.gestionar` | §6 |
| `/api/checkout` | [checkout.js](../../backend/src/routes/checkout.js) | 2 | MOD-07 | `requiereAutenticacion` | §7 |
| `/api/pagos` | [pagos.js](../../backend/src/routes/pagos.js) | 4 | MOD-07 | HMAC (webhook) / JWT | §7 |
| `/api/pedidos` | [pedidos.js](../../backend/src/routes/pedidos.js) | 6 | MOD-08 | JWT / `pedidos.gestionar` | §8 |
| `/api/comprobantes` | [comprobantes.js](../../backend/src/routes/comprobantes.js) | 2 | MOD-09 | JWT o token firmado | §9 |
| `/api/clientes` | [clientes.js](../../backend/src/routes/clientes.js) | 6 | MOD-10 | `clientes.gestionar` | §10 |
| `/api/verificacion` | [verificacion.js](../../backend/src/routes/verificacion.js) | 25 | MOD-04 | JWT / staff + permisos / superadmin | §11 |
| `/api/asistente` | [asistente.js](../../backend/src/routes/asistente.js) | 3 | MOD-11 | Opcional / Bearer | §12 |
| `/api/atencion` | [atencion.js](../../backend/src/routes/atencion.js) | 3 | MOD-11 | Público (BUG-002) | §12 |
| `/api/reportes` | [reportes.js](../../backend/src/routes/reportes.js) | 1 | MOD-12 | **Ninguno (BUG-001)** | §13 |
| `/api/mis-reportes` | [misreportes.js](../../backend/src/routes/misreportes.js) | 4 | MOD-12 | JWT | §13 |
| `/api/auditoria` | [auditoria.js](../../backend/src/routes/auditoria.js) | 1 | MOD-13 | `auditoria.ver` | §13 |
| `/api/automatizaciones` | [automatizaciones.js](../../backend/src/routes/automatizaciones.js) | 4 | MOD-14 | `x-automation-token` / HMAC + nonce | §14 |

Total: 95 endpoints en routers + 2 en `app.js` = **97**.

## Referencias

- [../08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../08_CONTRATOS_Y_ENDPOINTS_DE_API.md) · [../Ejemplos_Seguros/README.md](../Ejemplos_Seguros/README.md)
- [../../03_DISENO/08_DISENO_DE_API.md](../../03_DISENO/08_DISENO_DE_API.md)
