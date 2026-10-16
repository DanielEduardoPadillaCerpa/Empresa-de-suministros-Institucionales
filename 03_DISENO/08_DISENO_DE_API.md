# Diseño de API

| Campo | Valor |
|---|---|
| ID documental | DOC-03-08 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir las convenciones de la API HTTP (DIS-003), su modelo de autenticación y autorización y el mapa de recursos por router. El contrato detallado endpoint por endpoint está en [../04_DESARROLLO/08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../04_DESARROLLO/08_CONTRATOS_Y_ENDPOINTS_DE_API.md).

## Alcance

Todas las rutas montadas en `backend/src/app.js` bajo `/api`.

## 1. Convenciones [OBS]

| Aspecto | Convención |
|---|---|
| Estilo | REST pragmático sobre JSON; algunas acciones como subrecursos verbales (`/:id/aprobar`, `/:id/rechazar`, `/mfa/verificar`, `/compra/autorizacion/confirmar`) |
| Versionado | **Inexistente**: no hay prefijo `/v1` ni cabecera de versión. Los cambios de contrato se documentaron en `docs/CHANGELOG.md` |
| Formato | `Content-Type: application/json`; excepciones: `POST /api/pagos/webhook/:proveedor` (cuerpo raw ≤ 64 kb, firma sobre bytes), subida de documentos (multipart en `/api/verificacion/mi-solicitud/documentos`), PDF en `GET /api/comprobantes/:pedidoId?format=pdf` |
| Tamaño de cuerpo | 10 kb en `/api/auth` y `/api/admin/solicitudes`; 100 kb en el resto |
| Idioma | Mensajes de error en español: `{ "error": "…" }`, a veces con `code` (p. ej. `RATE_LIMITED`, `CAPTCHA_INVALIDO`, `CUENTA_PENDIENTE`, `PASSWORD_CHANGE_REQUIRED`, `CONFIRMACION_REQUERIDA`) y `errores` por campo |
| Nombres | Rutas en español (`/mi-cuenta`, `/pedidos`); propiedades JSON mixtas (camelCase y snake_case, p. ej. `pedido_id`, `estado_pago` en pagos) |
| Caché | `Cache-Control: no-store` en respuestas con datos personales o de sesión (captcha, perfil de checkout, solicitudes) |
| Idempotencia | `Idempotency-Key` (16–128) en `POST /api/checkout` y opcional en `POST /api/verificacion/mi-solicitud/enviar` |
| CORS | Lista blanca `CORS_ORIGINS` (por defecto orígenes localhost 5500, 5501, 8765, 8081); cabeceras permitidas `Content-Type`, `Authorization`, `Idempotency-Key` |

## 2. Autenticación y autorización

| Mecanismo | Uso | Implementación |
|---|---|---|
| `Authorization: Bearer <JWT>` (HS256, 2 h, `mfa:true`, `sv`) | Usuarios | `requiereAutenticacion` en `routes/auth.js`: valida firma, MFA, `session_version`, `estado_cuenta='activa'` y relee `rol` de MySQL |
| `autenticacionOpcional` | Catálogo y asistente | Si hay cabecera se valida; si no, contexto de invitado |
| `requiereAdmin` + `requierePermiso('<permiso>')` | Rutas administrativas | `rol='admin'` y permiso en `staff_permisos` (o superadmin, salvo permisos de datos personales) |
| Autorización en un viaje | `/api/admin/solicitudes` | `solicitudesRegistro.js` valida JWT y luego admin + `clientes.gestionar` dentro del mismo lote SQL |
| `x-automation-token` | n8n → W2, W4, mantenimiento W11 | `automationAuth.js`, comparación en tiempo constante, ≥32 caracteres |
| `Authorization: Bearer <token>` de servicio | Resumen semanal del asistente (W7) | `ASSISTANT_WEEKLY_SUMMARY_TOKEN` |
| HMAC + timestamp + nonce | Resultado de W11 (`N8N_W11_CALLBACK_SECRET`) | `verificacionCompra.aplicarResultadoN8n` |
| HMAC `x-payment-signature` + `x-payment-timestamp` | Webhook de pago mock | `paymentProvider.js`, tolerancia 5 min |
| Token firmado en enlace | Descarga de comprobante sin sesión | `receiptTokens.js` (HMAC, 24 h) |
| Ninguna | Rutas públicas: captcha, tipos de registro, registro, login, MFA, refresh, logout, productos/categorías (lectura), asistente, atención, **reportes mensual (BUG-001)** | — |

## 3. Códigos de estado usados [OBS]

| Código | Significado en la API | Frecuencia aproximada en `routes/` |
|---|---|---|
| 200/201/202 | Éxito; 202 en registro y login paso 1 (acción pendiente) | — |
| 400 | Validación fallida, JSON inválido | 83 apariciones |
| 401 | Sin sesión, sesión revocada, firma inválida | 19 |
| 403 | Sin permiso, cuenta no activa, cambio de contraseña obligatorio | 32 |
| 404 | No existe **o no es visible** para el solicitante (anti-enumeración) | 39 |
| 409 | Conflicto de estado (ya decidida, idempotencia, revisión legal pendiente) | 33 |
| 410 | Endpoint retirado (`POST /api/pedidos`, `POST /api/pagos/procesar`) o reto MFA vencido | 5 |
| 413 | Cuerpo demasiado grande (manejador global) | — |
| 422 | Entidad no procesable (casos puntuales) | 4 |
| 429 | Límite de tasa | 14 |
| 500/503/504 | Error interno genérico sin trazas; servicio no configurado o BD no disponible; timeout del proveedor mock | — |

## 4. Mapa de recursos por router

| Router | Recursos y operaciones principales | Acceso | Módulo |
|---|---|---|---|
| `/api/auth` | captcha, registro/tipos, registro, login, mfa/{verificar,reenviar,cancelar}, refresh, logout | Público (con límites) | MOD-01/02 |
| `/api/admin/solicitudes` | contador, lista, detalle, `/:id/aprobar`, `/:id/rechazar` | admin + `clientes.gestionar` | MOD-02 |
| `/api/mi-cuenta` | perfil GET/PATCH, correo/{solicitar,confirmar}, password, sesiones/cerrar-todas, solicitud-cambio; solicitudes (admin) | JWT; admin + `clientes.gestionar` | MOD-03 |
| `/api/verificacion` | mi-solicitud (documentos, identificador, enviar, clasificación); admin/* (solicitudes, comprobaciones, decisión, cambio-tipo, suspensión, restringidos, documentos, productos, permisos, personal, diagnóstico); compra/autorizacion | JWT; permisos específicos; superadmin | MOD-04 |
| `/api/productos`, `/api/categorias` | Listado/detalle (contexto), CRUD, bajo-inventario | Opcional; `catalogo.gestionar` | MOD-06 |
| `/api/checkout` | POST pedido+pago, GET perfil | JWT | MOD-07 |
| `/api/pagos` | webhook/:proveedor, dev/simular-webhook, `/:pedidoId/estado`, procesar (410) | Firma; JWT | MOD-07 |
| `/api/pedidos` | propios, todos, por cliente, cancelar, actualizar, POST (410) | JWT; `pedidos.gestionar` | MOD-08 |
| `/api/comprobantes` | `/:pedidoId` (JSON/PDF), `/:pedidoId/reenviar` | JWT o token de enlace | MOD-09 |
| `/api/clientes` | CRUD, `/:id/dato-sensible` | `clientes.gestionar`; titular | MOD-10 |
| `/api/asistente`, `/api/atencion` | mensaje, sugerencias, resumen semanal; solicitudes de contacto, calificación | Público con límites; token de servicio | MOD-11 |
| `/api/reportes`, `/api/mis-reportes` | mensual; CRUD de reportes del cliente | **Público (BUG-001)**; JWT | MOD-12 |
| `/api/auditoria` | lista con filtro `entidad` y `limite` ≤ 500 | `auditoria.ver` | MOD-13 |
| `/api/automatizaciones` | resumen-diario, pedidos/expirar, verificaciones/{resultado,mantenimiento} | Token o HMAC | MOD-14 |

## 5. Decisiones de diseño relevantes

- **[OBS]** Respuestas genéricas para impedir enumeración: registro siempre 202; login 401 idéntico para correo inexistente y contraseña errónea; productos no visibles responden 404.
- **[OBS]** Los errores 500 no exponen trazas (`app.js`, manejador global).
- **[REC]** Introducir versionado (`/api/v1`) antes de exponer la API a terceros y publicar una especificación OpenAPI generada desde este inventario.

## Referencias

- [../04_DESARROLLO/08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../04_DESARROLLO/08_CONTRATOS_Y_ENDPOINTS_DE_API.md) · [10_DISENO_DE_SEGURIDAD.md](10_DISENO_DE_SEGURIDAD.md)
- [../backend/src/app.js](../backend/src/app.js) · [../backend/src/routes/](../backend/src/routes/)
- [../backend/README.md](../backend/README.md) (tabla de endpoints previa, parcialmente desactualizada — BUG-008)
