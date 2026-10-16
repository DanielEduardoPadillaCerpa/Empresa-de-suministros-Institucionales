# Solución de problemas conocidos

| Campo | Valor |
|---|---|
| ID documental | DOC-04-14 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Guía rápida para diagnosticar los errores que el código y la documentación previa ya anticipan.

## Alcance

**[OBS]** Cada síntoma corresponde a un mensaje o condición presente en el código (archivo indicado) o en la documentación previa. Las soluciones son de entorno de desarrollo; no se reprodujeron en esta auditoría salvo indicación.

| # | Síntoma | Causa | Solución | Evidencia |
|---|---|---|---|---|
| P-01 | `[server] El puerto 8081 ya está en uso: hay OTRO backend corriendo` | `EADDRINUSE` | Cerrar el otro proceso (`netstat -ano \| findstr :8081` en Windows) o cambiar `PORT` | `backend/server.js` |
| P-02 | `[server] No se pudo iniciar … Configuración insegura: JWT_SECRET falta…` | `JWT_SECRET` <32, de ejemplo o ausente; `ENC_KEY`/`HMAC_KEY` ausentes o inválidas | `npm run claves:generar` y reiniciar | `backend/src/configSegura.js` |
| P-03 | El arranque falla con `CRYPTO_KEYS o CRYPTO_KEY_ACTIVA no son válidos` | Formato del anillo incorrecto | Formato `k1:<base64 de 32 bytes>`, `CRYPTO_KEY_ACTIVA=k1` | `configSegura.js`, `crypto.js` |
| P-04 | `ASSISTANT_MODE debe ser rules o llm` | Valor inválido | Corregir o eliminar la variable | `server.js` |
| P-05 | `CORS_ORIGINS debe configurarse … en producción` | `NODE_ENV=production` sin orígenes | Definir `CORS_ORIGINS` | `src/app.js` |
| P-06 | Error de CORS al abrir el HTML con doble clic | `file://` envía origen `null`, no permitido | Abrir `http://localhost:8081/` o Live Server 5500/5501 | `src/app.js`, `README.md` |
| P-07 | El frontend no conecta con la API | `API_BASE` fijo en `http://localhost:8081` | Ejecutar el backend con `PORT=8081` (BUG-003) | `frontend/js/auth.js` |
| P-08 | Errores de conexión `Too many connections` / `ER_CON_COUNT_ERROR` o esperas largas | Plan gratuito con 5 conexiones; servidor usa 4 | Detener el servidor antes de scripts; no subir `DB_CONNECTION_LIMIT` | `src/db.js`, memoria del proyecto |
| P-09 | Clientes heredados sin precios o productos restringidos sin venta tras migrar | Efecto de la migración 001/002 | Revisar en `admin-verificaciones.html`; ver `docs/AUDITORIA_TECNICA.md` §7 | `migraciones/001…` |
| P-10 | No llega el código MFA | Sin SMTP: el código se imprime en consola `[correo-laboratorio]`; Mailpit apagado | Revisar consola o `http://localhost:8025`; en producción sin `SMTP_HOST` el servidor no arranca | `src/seguridad/correo.js` |
| P-11 | `530 5.7.0 Must issue a STARTTLS command first` | SMTP en puerto 587 sin STARTTLS | 587 con `SMTP_SECURE=false` (STARTTLS) o 465 con `SMTP_SECURE=true` | `backend/README.md` |
| P-12 | `429 RATE_LIMITED` en login/registro durante pruebas | Limitadores en memoria (10 login/15 min por IP) | Esperar o reiniciar el servidor (no hay almacén compartido) | `routes/auth.js` |
| P-13 | `400 CAPTCHA_INVALIDO` | Captcha de un solo uso, vence en 5 min, se pierde al reiniciar el servidor | Pedir uno nuevo (`GET /api/auth/captcha`) | `seguridad/captcha.js` |
| P-14 | Login responde `403 CUENTA_PENDIENTE` | Solicitud aún no aprobada | Aprobar en `admin-solicitudes.html` | `routes/auth.js` |
| P-15 | `403 PASSWORD_CHANGE_REQUIRED` | Cuenta inicial (admin sembrado, superadmin, personal nuevo) | Cambiar contraseña en `cambiar-password.html` | `routes/auth.js` |
| P-16 | `401 La sesión fue revocada` | Cambio de correo/contraseña o cierre de sesiones (incrementa `session_version`) | Iniciar sesión de nuevo | `routes/auth.js` |
| P-17 | No se crea el administrador inicial | Falta `ADMIN_PASSWORD` o tiene <12 caracteres | Definirla y reiniciar | `src/db.js` |
| P-18 | Verificación devuelve `padron_no_disponible` | Fuente del padrón no configurada o caída | Revisar `PADRON_DB_URI`; forzar `npm run padron:importar` | `seguridad/padron.js` |
| P-19 | El registro responde 503 | `ENC_KEY`/`HMAC_KEY` no configuradas | Generar claves | `routes/auth.js` |
| P-20 | `POST /api/checkout` → 400 `Falta una clave de idempotencia válida` | Cabecera `Idempotency-Key` ausente o fuera de 16–128 | Enviar una clave aleatoria por intento | `routes/checkout.js` |
| P-21 | Eventos n8n quedan `pendiente`/`fallido` en `automation_outbox` | URL/secreto no configurados, URL HTTP no local, n8n caído | Configurar `N8N_W*`; revisar `ultimo_error_code` (p. ej. `AUTOMATION_WEBHOOK_URL_MUST_USE_HTTPS`) | `src/automationOutbox.js` |
| P-22 | Nodos Code de n8n fallan con `crypto` o `$env` | Restricciones del contenedor | `NODE_FUNCTION_ALLOW_BUILTIN=crypto`, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` | `n8n/generar-w12.js` |
| P-23 | `node probar-mfa-n8n.js` falla con `Cannot find module './src/mfaCourier'` | Script obsoleto (W5 retirado) | No usar (BUG-009) | `backend/probar-mfa-n8n.js` |
| P-24 | `npm run test:integration` se niega a ejecutar | Base no local o sin `test` en el nombre (protección intencional) | Usar MySQL Docker local en 3307 | `test/integration/ayudantes.js` |
| P-25 | La prueba de interfaz falla en la segunda corrida | Límite de login 10/15 min por IP | Reiniciar `servidor-prueba.js` entre corridas | `docs/PLAN_PRUEBAS.md` |
| P-26 | En la salida de `npm test` aparecen `[padron] … ECONNRESET` y `[n8n] … FETCH_FAILED` | Casos negativos simulados por las pruebas | Ninguna: las suites terminan aprobadas | ejecución 2026-10-16 |
| P-27 | `npm install` falla compilando `bcrypt` | Binario nativo no disponible para la plataforma | Instalar las herramientas de compilación de Node para la plataforma. **[INF]** `bcrypt` es dependencia obligatoria, por lo que la instalación falla; el respaldo a `bcryptjs` solo actúa en ejecución si `require('bcrypt')` lanza error. *PENDIENTE DE VALIDACIÓN* | `seguridad/contrasenas.js`, `package.json` |

## Referencias

- [../07_MANTENIMIENTO_Y_SOPORTE/03_GUIA_DE_DIAGNOSTICO.md](../07_MANTENIMIENTO_Y_SOPORTE/03_GUIA_DE_DIAGNOSTICO.md) · [../07_MANTENIMIENTO_Y_SOPORTE/07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md](../07_MANTENIMIENTO_Y_SOPORTE/07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md)
- [06_GUIA_DE_EJECUCION_LOCAL.md](06_GUIA_DE_EJECUCION_LOCAL.md)
