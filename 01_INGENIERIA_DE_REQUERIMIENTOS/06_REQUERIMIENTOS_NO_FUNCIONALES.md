# Requerimientos no funcionales

| Campo | Valor |
|---|---|
| ID documental | DOC-01-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Especificar los atributos de calidad (REQ-NF-001 a REQ-NF-018) que el sistema implementa o que la documentación previa exige.

## Alcance

Seguridad, rendimiento, disponibilidad, plataforma, mantenibilidad, usabilidad y cumplimiento. Origen: O1 existente, O2 documentado, O3 inferido, O4 mejora propuesta.

## Resumen

| ID | Categoría | Nombre | Prioridad [INF] | Estado | TC |
|---|---|---|---|---|---|
| REQ-NF-001 | Seguridad | Cifrado por campo y índices ciegos | Alta | IMPLEMENTADO Y VERIFICADO | TC-101 |
| REQ-NF-002 | Seguridad | Contraseñas bcrypt 10–72 | Alta | IMPLEMENTADO Y VERIFICADO | TC-102 |
| REQ-NF-003 | Seguridad | Validación de secretos al arrancar | Alta | IMPLEMENTADO Y VERIFICADO | TC-103 |
| REQ-NF-004 | Seguridad | Limitación de solicitudes por IP | Alta | IMPLEMENTADO Y VERIFICADO (parcial) | TC-104 |
| REQ-NF-005 | Seguridad | Cabeceras de seguridad | Media | PARCIALMENTE IMPLEMENTADO | TC-105 |
| REQ-NF-006 | Rendimiento | Tiempos de respuesta | Media | IMPLEMENTADO, NO VERIFICADO | TC-106 |
| REQ-NF-007 | Capacidad | Máximo 4 conexiones MySQL | Alta | IMPLEMENTADO, NO VERIFICADO | TC-107 |
| REQ-NF-008 | Privacidad | Minimización hacia n8n | Alta | IMPLEMENTADO Y VERIFICADO | TC-108 |
| REQ-NF-009 | Privacidad | Sin secretos en logs/respuestas | Alta | IMPLEMENTADO, NO VERIFICADO | TC-109 |
| REQ-NF-010 | Disponibilidad | Resiliencia (outbox, jobs) | Media | IMPLEMENTADO Y VERIFICADO (parcial) | TC-110 |
| REQ-NF-011 | Plataforma | Node ≥18, MySQL 8 | Media | IMPLEMENTADO, NO VERIFICADO | TC-111 |
| REQ-NF-012 | Mantenibilidad | Pruebas automatizadas | Alta | IMPLEMENTADO Y VERIFICADO | TC-112 |
| REQ-NF-013 | Usabilidad | Diseño adaptable | Baja | IMPLEMENTADO, NO VERIFICADO | TC-113 |
| REQ-NF-014 | Accesibilidad | Widget del asistente | Baja | IMPLEMENTADO Y VERIFICADO (parcial) | TC-114 |
| REQ-NF-015 | Seguridad | Sesión fuera de localStorage | Alta | PENDIENTE | TC-115 |
| REQ-NF-016 | Seguridad | HTTPS/TLS y HSTS | Alta | PENDIENTE | TC-116 |
| REQ-NF-017 | Cumplimiento | Ley 1581/2012 | Alta | PARCIALMENTE IMPLEMENTADO | TC-117 |
| REQ-NF-018 | Restricción | Costo cero y laboratorio | Alta | NO DETERMINADO | — |

## Detalle

### REQ-NF-001 — Cifrado por campo AES-256-GCM e índices ciegos HMAC
- **Descripción:** datos personales cifrados con AES-256-GCM, IV aleatorio de 12 bytes y AAD = nombre del campo, formato `v<versión>:<iv>:<tag>:<cifrado>` (`ENC_KEY`, rotación con `ENC_KEY_V<n>`); anillo `CRYPTO_KEYS` para verificación (`v2:`); índices HMAC (`HMAC_KEY`, `IDENT_HMAC_KEY`) para búsquedas por igualdad. Descifrado fallido lanza error, nunca devuelve el texto cifrado.
- **Origen:** O1, O2 (`../docs/REGISTRO_VERIFICADO.md` §3, `../docs/ARQUITECTURA_VERIFICACION.md` §5).
- **Evidencia:** `../backend/src/seguridad/cifradoCampos.js`, `../backend/src/crypto.js`.
- **Estado:** IMPLEMENTADO Y VERIFICADO — `registro-verificado.test.js` (cifrado*, índice ciego), `verificacion-compra.test.js` (cifrado v2, HMAC).
- **Criterio de aceptación:** CA-101. **Observaciones:** datos heredados con `CRYPTO_KEY` derivada de texto (BUG-013).

### REQ-NF-002 — Contraseñas
- **Descripción:** bcrypt nativo con respaldo bcryptjs; costo `BCRYPT_COST` (10 por defecto fuera de producción, 12 en producción, rango 4–15); longitud 10–72 y sin contener el usuario del correo.
- **Origen:** O1, O2 (`../docs/AUDITORIA_TECNICA.md` H11). **Evidencia:** `../backend/src/seguridad/contrasenas.js`, `../backend/src/registroInstitucional.js`.
- **Estado:** IMPLEMENTADO Y VERIFICADO (pruebas de registro). **CA-102.** Observación: BUG-017 (dos librerías).

### REQ-NF-003 — Configuración segura al arrancar
- **Descripción:** `validarConfiguracionSegura()` impide arrancar si `JWT_SECRET` tiene <32 caracteres o parece de ejemplo, o si `ENC_KEY`/`HMAC_KEY` no son válidas; en producción, `MFA_TOKEN_PEPPER` y `CRYPTO_KEY` débiles también bloquean. `CORS_ORIGINS` obligatorio en producción.
- **Origen:** O1, O2 (`../docs/AUDITORIA_TECNICA.md` A2). **Evidencia:** `../backend/src/configSegura.js`, `../backend/src/app.js`, `../backend/server.js`.
- **Estado:** IMPLEMENTADO Y VERIFICADO — `verificacion-compra.test.js` (configuración segura). **CA-103.**

### REQ-NF-004 — Limitación de solicitudes
- **Descripción:** `express-rate-limit` por IP: registro 10/h, login 10/15 min, MFA verificar 15/15 min, reenviar 10/h, captcha 120/15 min, asistente 20/min, contacto 5/15 min, subidas 30/h, autorización de compra 20/15 min, mi-cuenta (varios); reenvío de comprobante 3/h por BD.
- **Origen:** O1. **Evidencia:** `../backend/src/routes/*.js`.
- **Estado:** IMPLEMENTADO Y VERIFICADO (parcial: asistente y cambio de correo en `assistant.spec.js` y `mi-cuenta.spec.js`). **CA-104.** Observación: en memoria del proceso (BUG-010); `POST /api/atencion/calificacion` sin límite (BUG-002).

### REQ-NF-005 — Cabeceras de seguridad
- **Descripción:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy`; `x-powered-by` deshabilitado; cuerpos limitados (10 kb auth/panel, 100 kb general, 64 kb webhook). **Sin CSP ni HSTS.**
- **Origen:** O1. **Evidencia:** `../backend/src/app.js`. **Estado:** PARCIALMENTE IMPLEMENTADO. **CA-105.**

### REQ-NF-006 — Tiempos de respuesta
- **Descripción:** registro y login paso 1 < 600 ms; aprobar, rechazar y contador < 300 ms (desde el equipo de laboratorio con ~150 ms por viaje a MySQL).
- **Origen:** O2 (`../docs/REGISTRO_VERIFICADO.md` §5, metas y mediciones del 2026-10-15).
- **Evidencia:** `../backend/scripts/medir-rendimiento.js`.
- **Estado:** IMPLEMENTADO, NO VERIFICADO (evidencia histórica no reproducida; `npm run medir` usa la base real y no se ejecutó). **CA-106.**

### REQ-NF-007 — Conexiones a MySQL
- **Descripción:** pool principal `min(DB_CONNECTION_LIMIT, 4)` (3 por defecto) + pool transaccional de 1 conexión; el plan gratuito permite 5.
- **Origen:** O1, O2 (`../backend/README.md` §3). **Evidencia:** `../backend/src/db.js`.
- **Estado:** IMPLEMENTADO, NO VERIFICADO. **CA-107.** Observación [INF]: con `DB_CONNECTION_LIMIT=4` el total sería 5 (al límite); scripts con conexión propia pueden agotar el cupo (RSK-004).

### REQ-NF-008 — Minimización hacia n8n
- **Descripción:** W1 `{evento,pedido_id,estado,total,moneda,fecha}`; W2 agregado; W3 `{evento,fecha}`; W6 sin mensaje ni PII; W8 solo id/tipo para `admin.solicitud_cuenta`; W12 `{evento, solicitud_id, resultado}`; códigos y comprobantes ya no pasan por n8n. Excepción: W11 recibe NIT de persona jurídica (BUG-014).
- **Origen:** O1, O2 (`../backend/README.md`, `../docs/REGISTRO_VERIFICADO.md` §4).
- **Estado:** IMPLEMENTADO Y VERIFICADO — `automation.test.js`, `registro-verificado.test.js`, `verificacion-compra.test.js`, `assistant.spec.js` (W6), `mi-cuenta.spec.js` (nada a n8n). **CA-108.**

### REQ-NF-009 — Sin datos sensibles en registros ni respuestas
- **Descripción:** los logs registran códigos de error, no valores; la contraseña del admin inicial no se imprime; errores 500 genéricos.
- **Origen:** O1, O2 (`../docs/MODELO_AMENAZAS.md`). **Estado:** IMPLEMENTADO, NO VERIFICADO (evidencia histórica: prueba 17 de `compra-verificada.int.spec.js`). **CA-109.** Observación: en laboratorio sin SMTP los códigos MFA se imprimen en consola (`[correo-laboratorio]`), comportamiento intencional y bloqueado en producción.

### REQ-NF-010 — Resiliencia
- **Descripción:** `correo_outbox` (5 intentos) y `automation_outbox` (8 intentos) con backoff y recuperación de tareas atascadas; jobs internos de expiración (60 s) y mantenimiento de verificaciones (5 min) como respaldo de n8n; avisos W12 con 3 s de tiempo límite sin bloquear.
- **Origen:** O1. **Estado:** IMPLEMENTADO Y VERIFICADO (parcial) — `automation.test.js`, `paymentJobs.test.js`. **CA-110.**

### REQ-NF-011 — Plataforma
- **Descripción:** Node.js 18 o superior (`../backend/README.md`), probado en Node 24.19.0; MySQL 8 (pruebas históricas en Docker); navegadores con soporte de ES2017+ y Bootstrap 5.3.3.
- **Estado:** IMPLEMENTADO, NO VERIFICADO (Node 18 no probado; `package.json` no declara `engines`). **CA-111.**

### REQ-NF-012 — Pruebas automatizadas
- **Descripción:** `npm test` ejecuta Jest y `node:test`; `npm run test:integration` contra MySQL local.
- **Estado:** IMPLEMENTADO Y VERIFICADO — 2026-10-16: Jest 107/107, node:test 51/51. **CA-112.**

### REQ-NF-013 — Diseño adaptable
- **Descripción:** páginas sin barra horizontal en pantallas pequeñas (commit `2c44b40`). **Estado:** IMPLEMENTADO, NO VERIFICADO. **CA-113.**

### REQ-NF-014 — Accesibilidad del asistente
- **Estado:** IMPLEMENTADO Y VERIFICADO (parcial) — `assistant.spec.js` ("widget accesible del catálogo"). No hay evaluación WCAG del resto del sitio. **CA-114.**

### REQ-NF-015 — Sesión del navegador segura
- **Descripción [O4/O2]:** mover tokens a cookie `HttpOnly`, `Secure`, `SameSite` con protección CSRF. Documentado como pendiente en `../docs/REGISTRO_VERIFICADO.md` §8. **Estado:** PENDIENTE. **CA-115.**

### REQ-NF-016 — Transporte cifrado
- **Descripción [O2]:** HTTPS en producción, HSTS, enlaces de comprobante HTTPS (ya exigido fuera de localhost en `../backend/src/email.js`). **Estado:** PENDIENTE. **CA-116.**

### REQ-NF-017 — Cumplimiento Ley 1581/2012
- **Descripción:** autorizaciones previas (registro: `aceptaTratamiento`; identificador: `autorizaTratamiento`), finalidad, derechos del titular, plazos de conservación y borrado.
- **Origen:** O2 (`../docs/TRATAMIENTO_DATOS_PERSONALES.md`, `../docs/MATRIZ_NORMATIVA_COLOMBIA.md`).
- **Estado:** PARCIALMENTE IMPLEMENTADO — sin validación jurídica, sin borrado automático (BUG-015), aviso de privacidad no revisado. **CA-117.**

### REQ-NF-018 — Costo cero y laboratorio
- **Descripción:** usar solo servicios gratuitos (Clever Cloud plan gratuito, Mailpit, captcha propio, n8n autoalojado).
- **Origen:** O2 (`../docs/REGISTRO_VERIFICADO.md`: "Todo lo usado es gratuito"). **Estado:** NO DETERMINADO (restricción, no verificable por prueba).

## Referencias

- [05_REQUERIMIENTOS_FUNCIONALES.md](05_REQUERIMIENTOS_FUNCIONALES.md), [10_RESTRICCIONES_Y_LIMITACIONES.md](10_RESTRICCIONES_Y_LIMITACIONES.md)
- [../03_DISENO/10_DISENO_DE_SEGURIDAD.md](../03_DISENO/10_DISENO_DE_SEGURIDAD.md), [../05_PRUEBAS/06_PRUEBAS_DE_SEGURIDAD.md](../05_PRUEBAS/06_PRUEBAS_DE_SEGURIDAD.md)
