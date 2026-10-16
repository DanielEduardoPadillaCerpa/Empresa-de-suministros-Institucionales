# Configuración de integraciones

| Campo | Valor |
|---|---|
| ID documental | DOC-06-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Indicar cómo configurar cada integración externa del sistema: SMTP, fuente del padrón, n8n, proveedor de pagos, datos.gov.co (vía n8n) y Ollama (opcional).

## Alcance

Configuración operativa. El detalle técnico de contratos está en [../04_DESARROLLO/10_INTEGRACIONES_Y_AUTOMATIZACIONES.md](../04_DESARROLLO/10_INTEGRACIONES_Y_AUTOMATIZACIONES.md). **Ninguna integración externa se probó en esta auditoría** (todo PENDIENTE DE VALIDAR), salvo la lógica de firmas y nodos cubierta por `npm test` (REQ-F-035, Verificado).

## 1. Correo (SMTP con nodemailer)

- Variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.
- Laboratorio: Mailpit en Docker (SMTP 1025, buzón `http://localhost:8025`). Sin SMTP disponible y fuera de producción, el mensaje se imprime en consola (`[correo-laboratorio]`); en producción es error.
- Envía: códigos MFA, códigos de cambio de correo y de autorización de compra, avisos de aprobación/rechazo de registro, avisos de seguridad y comprobantes.
- **[REC]** Configurar SPF/DKIM/DMARC con el proveedor. Dependencia con vulnerabilidades (BUG-006).

## 2. Fuente del padrón

`PADRON_DB_URI` (o `MYSQL_ADDON_URI`), `PADRON_SYNC_MINUTOS`. Solo lectura. Ver [06_CONFIGURACION_DE_BASE_DE_DATOS.md](06_CONFIGURACION_DE_BASE_DE_DATOS.md).

## 3. n8n (opcional)

### Instancia

- `docker compose -p n8n -f n8n/docker-compose.yml up -d n8n` (imagen `n8nio/n8n:1.110.1`, contenedor `empresa-n8n`, puerto 5678, volumen `n8n_data`, workflows montados en solo lectura en `/workflows`).
- `n8n/.env` (excluido de git) debe incluir, para los nodos Code que verifican HMAC:
  - `NODE_FUNCTION_ALLOW_BUILTIN=crypto`
  - `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`
  - los secretos de cada workflow (mismo valor que en el backend), `BACKEND_BASE_URL`, `ADMIN_ALERT_FROM`, `ADMIN_ALERT_TO`, `MFA_FROM_EMAIL`/`VERIFICATION_FROM_EMAIL`, `DATOS_GOV_APP_TOKEN` (opcional).
  - **[REC]** `EXECUTIONS_DATA_SAVE_ON_SUCCESS=none` y `EXECUTIONS_DATA_SAVE_ON_ERROR=none`.
- `N8N_ENCRYPTION_KEY` nunca debe cambiar (cifra las credenciales guardadas en n8n).
- Importar cada JSON por **Workflows → Import from File**, asignar credenciales SMTP en los nodos de correo y activar solo tras configurar secretos. **[OBS]** Los 12 exportados tienen `active: false`.

### Por workflow

| WF | Disparador | Variables backend | Variables n8n | Uso actual |
|---|---|---|---|---|
| W1 Alertas de pago | Webhook `empresa-alerta-pago` | `N8N_W1_PAYMENT_WEBHOOK_URL`, `N8N_W1_SECRET` | `N8N_W1_SECRET` | Opcional |
| W2 Resumen diario | Programado 08:00 America/Bogota → `GET /api/automatizaciones/resumen-diario` | `N8N_W2_DAILY_SUMMARY_TOKEN` | mismo token, `BACKEND_BASE_URL` | Opcional |
| W3 Stock bajo | Webhook `empresa-stock-bajo` | `N8N_W3_STOCK_WEBHOOK_URL`, `N8N_W3_SECRET`, `AUTOMATION_STOCK_LOW_THRESHOLD` | `N8N_W3_SECRET` | Opcional |
| W4 Expirar pedidos | Programado cada minuto → `POST /api/automatizaciones/pedidos/expirar` | `N8N_W4_EXPIRY_TOKEN` | mismo token | Redundante: el backend tiene job propio |
| W5 MFA por correo | Webhook `mfa-login-code` | — | — | **Sin uso** desde 2026-10-15 (nodemailer) |
| W6 Asistente escalado | Webhook `asistente-escalado` | `N8N_W6_ASSISTANT_ESCALATION_WEBHOOK_URL`, `N8N_W6_ASSISTANT_ESCALATION_SECRET` | secreto | Opcional |
| W7 Resumen semanal asistente | Programado → `GET /api/asistente/pendientes/resumen-semanal` (Bearer) | `ASSISTANT_WEEKLY_SUMMARY_TOKEN` | mismo token | Opcional |
| W8 Cuenta | Webhook `account-events` | `N8N_W8_ACCOUNT_WEBHOOK_URL`, `N8N_W8_ACCOUNT_SECRET` | `N8N_W8_ACCOUNT_SECRET` | Solo `admin.solicitud_cuenta` (id y tipo) |
| W9 Comprobantes | Webhook `receipt-email` | — | — | **Sin uso** desde 2026-10-15 |
| W10 Contexto institucional | Subflujo | — | — | Inactivo y no conectado |
| W11 Verificación de comprador | Webhook `verification-events` + programado cada 15 min | `N8N_W11_VERIFICATION_WEBHOOK_URL`, `N8N_W11_SECRET`, `N8N_W11_CALLBACK_SECRET` (distinto), `N8N_W11_MAINTENANCE_TOKEN` | los mismos + `DATOS_GOV_APP_TOKEN` | Opcional; envía NIT de persona jurídica (BUG-014, decisión pendiente) |
| W12 Avisos de registro | Webhook `registro-avisos` | `N8N_REGISTRO_WEBHOOK_URL`, `N8N_REGISTRO_SECRET` | `N8N_REGISTRO_SECRET` | Opcional; solo `{evento, solicitud_id, resultado}` |

Reglas: URLs de producción (`/webhook/…`, nunca `/webhook-test/`), HTTPS fuera de localhost, secretos/tokens ≥ 32 caracteres, distintos por workflow. **[OBS]** Si n8n está caído, el outbox reintenta con backoff y el negocio no se bloquea.

Verificación de estado: pestaña *Diagnóstico* del superadministrador (indica si `w11Eventos`, `w11Respuestas`, `w11Mantenimiento` están configurados). PENDIENTE DE VALIDAR.

## 4. Proveedor de pagos

Solo `PAYMENT_MODE=mock` con `PAYMENT_WEBHOOK_SECRET` (si falta, se genera uno temporal en memoria). Webhook `POST /api/pagos/webhook/mock` con `x-payment-timestamp` y `x-payment-signature` (HMAC-SHA256 sobre `timestamp.cuerpo`, ventana de 5 min). **No hay pasarela real** (REQ-F-040).

## 5. datos.gov.co (RUES/CHIP)

Consultado únicamente desde W11 (n8n), no desde el backend. Token opcional `DATOS_GOV_APP_TOKEN`. Ver [../docs/FLUJO_N8N_VERIFICACION.md](../docs/FLUJO_N8N_VERIFICACION.md).

## 6. Ollama (opcional)

`ASSISTANT_MODE=llm` con `OLLAMA_URL` (solo local) y `OLLAMA_MODEL`. Por defecto `rules`.

## 7. CDN del frontend

Bootstrap 5.3.3 y Chart.js 4.4.4 desde `cdn.jsdelivr.net`. **[REC]** Evaluar SRI o alojamiento local antes de definir una CSP.

## Referencias

- [../n8n/docker-compose.yml](../n8n/docker-compose.yml)
- [../docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
- [../docs/Flujos-n8n.docx](../docs/Flujos-n8n.docx)
- [../backend/README.md](../backend/README.md) (contiene instrucciones históricas de W5/W9 ya sin uso — BUG-008)
