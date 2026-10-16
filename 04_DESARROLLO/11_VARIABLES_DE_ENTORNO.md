# Variables de entorno

| Campo | Valor |
|---|---|
| ID documental | DOC-04-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Listar todas las variables de entorno que el sistema declara o lee, con su propósito, obligatoriedad y módulo. **No contiene valores.**

## Alcance

**[OBS]** Fuentes: `../backend/.env.example` (72 variables) y búsqueda de `process.env.X` / `process.env[variable]` en `backend/server.js`, `backend/src`, `backend/scripts` y `n8n/*.js`. Variables de n8n leídas con `$env.X` en los workflows se listan en §4. Los valores reales viven en `backend/.env` y `n8n/.env` (excluidos de Git, **acceso restringido**). Plantilla comentada: [Configuracion/env.ejemplo.documentado.txt](Configuracion/env.ejemplo.documentado.txt).

Leyenda de obligatoriedad: **Arranque** = sin ella el servidor no inicia · **Prod** = obligatoria con `NODE_ENV=production` · **Función** = necesaria para que una función específica opere · **Opcional** = tiene valor por defecto o es prescindible · **Sin uso** = declarada en `.env.example` pero no leída por el código actual.

## 1. Backend — servidor, base de datos y sesión

| Variable | Obligatoriedad | Propósito / regla | Módulo |
|---|---|---|---|
| `NODE_ENV` | Opcional | `production` activa validaciones estrictas, deshabilita simulación de pagos y correo por consola; `test` desactiva limitadores y jobs | MOD-16 |
| `PORT` | Opcional | Puerto HTTP (código: 8080; `.env.example`: 8081; el frontend espera 8081, BUG-003) | MOD-16 |
| `CORS_ORIGINS` | Prod | Lista separada por comas; sin ella en producción `crearApp` lanza error | MOD-16 |
| `TRUST_PROXY_HOPS` | Opcional (0) | Saltos de proxy confiables (entero ≥0) | MOD-16 |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Arranque | Conexión MySQL (`DB_NAME` también usado por scripts para `--confirmar-base`) | MOD-15 |
| `DB_CONNECTION_LIMIT` | Opcional (3, máx. 4) | Tamaño del pool principal | MOD-15 |
| `JWT_SECRET` | Arranque | ≥32 caracteres, no de ejemplo; firma HS256 | MOD-01 |
| `JWT_EXPIRES_IN` | Opcional (`2h`) | Vigencia del access token | MOD-01 |
| `REFRESH_EXPIRES_DIAS` | Opcional (7) | Vigencia del refresh token | MOD-01 |
| `MFA_TOKEN_PEPPER` | Prod (aviso fuera) | Pepper HMAC de códigos MFA y de compra | MOD-01 |
| `BCRYPT_COST` | Opcional (10 / 12 en prod) | Costo bcrypt (4–15) | MOD-01 |
| `REGISTRO_LIMITE_POR_HORA` | Opcional (10) | Registros por IP y hora | MOD-02 |
| `TEST_RATE_LIMITS` | Solo pruebas | `1` activa limitadores en `NODE_ENV=test` | Pruebas |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Función (primer admin) | Crea el primer administrador si no hay ninguno; contraseña ≥12; cambio obligatorio | MOD-15 |
| `SUPERADMIN_PASSWORD` | Solo script | Contraseña inicial para `crear-superadmin.js` (≥16); borrar después | MOD-05 |

## 2. Backend — cifrado y claves

| Variable | Obligatoriedad | Propósito / regla | Módulo |
|---|---|---|---|
| `ENC_KEY` | Arranque | 64 hex (32 bytes); cifrado por campo del registro verificado | MOD-16 |
| `ENC_KEY_VERSION` | Opcional (1) | Versión de `ENC_KEY` activa | MOD-16 |
| `ENC_KEY_V<n>` | Función (rotación) | Claves anteriores para descifrar datos viejos (lectura dinámica) | MOD-16 |
| `HMAC_KEY` | Arranque | 64 hex, distinta de `ENC_KEY`; índices ciegos | MOD-16 |
| `CRYPTO_KEY` | Prod si no hay `CRYPTO_KEYS` | Clave heredada (texto rellenado a 32 bytes, BUG-013); conservar mientras haya datos con ella | MOD-16 |
| `CRYPTO_KEYS`, `CRYPTO_KEY_ACTIVA` | Función (verificación de identidad) | Anillo `id:base64(32 bytes)` y clave activa | MOD-16 |
| `IDENT_HMAC_KEY` | Función | Índice HMAC del documento de identidad (≥32 bytes base64) | MOD-04 |
| `RECEIPT_LINK_SECRET` | Función | Firma de enlaces de comprobante (≥32) | MOD-09 |
| `PAYMENT_WEBHOOK_SECRET` | Opcional en mock | Firma de webhooks; en mock se genera aleatorio por proceso si falta | MOD-07 |

## 3. Backend — integraciones y funciones

| Variable | Obligatoriedad | Propósito / regla | Módulo |
|---|---|---|---|
| `PAYMENT_MODE` | Opcional (`mock`) | `sandbox`/`prod` fallan (no implementados) | MOD-07 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Prod (`SMTP_HOST`) | Envío de correo; sin SMTP fuera de producción se imprime en consola | MOD-09 |
| `ADMIN_NOTIFICATION_EMAIL` | Función | Destinatario del aviso administrativo de comprobantes | MOD-09 |
| `RECEIPT_LINK_BASE_URL` | Función | URL base del enlace (HTTPS salvo localhost) | MOD-09 |
| `PADRON_DB_URI` | Función | Fuente del padrón (solo lectura) | MOD-02 |
| `MYSQL_ADDON_URI` | Función (alternativa) | Fuente del padrón si no hay `PADRON_DB_URI` | MOD-02 |
| `PADRON_SYNC_MINUTOS` | Opcional (10) | Periodo de sincronización | MOD-02 |
| `DOCUMENTOS_DIR` | Recomendada (defecto `backend/storage/documentos`) | Carpeta privada de documentos cifrados | MOD-04 |
| `VERIFICACION_VIGENCIA_DIAS` | Opcional (365, máx. 730) | Vigencia de una verificación aprobada | MOD-04 |
| `AUTOMATION_STOCK_LOW_THRESHOLD` | Opcional | Umbral de alerta W3 | MOD-14 |
| `STOCK_MINIMO` | Opcional (10) | Umbral de inventario bajo (no está en `.env.example`) | MOD-06 |
| `ASSISTANT_MODE` | Opcional (`rules`) | `rules` o `llm`; otro valor impide arrancar | MOD-11 |
| `OLLAMA_URL`, `OLLAMA_MODEL` | Función (modo llm) | Solo Ollama local | MOD-11 |
| `ASSISTANT_WEEKLY_SUMMARY_TOKEN` | Función (W7) | Bearer ≥32 del resumen semanal | MOD-11 |
| `N8N_W1_PAYMENT_WEBHOOK_URL`, `N8N_W1_SECRET` | Función (W1) | URL y secreto HMAC | MOD-14 |
| `N8N_W2_DAILY_SUMMARY_TOKEN` | Función (W2) | Token del resumen diario | MOD-14 |
| `N8N_W3_STOCK_WEBHOOK_URL`, `N8N_W3_SECRET` | Función (W3) | URL y secreto | MOD-14 |
| `N8N_W4_EXPIRY_TOKEN` | Función (W4) | Token de expiración | MOD-14 |
| `N8N_W6_ASSISTANT_ESCALATION_WEBHOOK_URL`, `N8N_W6_ASSISTANT_ESCALATION_SECRET` | Función (W6) | URL y secreto | MOD-14 |
| `N8N_W8_ACCOUNT_WEBHOOK_URL`, `N8N_W8_ACCOUNT_SECRET` | Función (W8) | URL y secreto | MOD-14 |
| `N8N_W11_VERIFICATION_WEBHOOK_URL`, `N8N_W11_SECRET` | Función (W11) | Eventos firmados hacia n8n | MOD-14 |
| `N8N_W11_CALLBACK_SECRET` | Función (W11) | Secreto **distinto** para respuestas de n8n | MOD-14 |
| `N8N_W11_MAINTENANCE_TOKEN` | Función (W11) | Token del mantenimiento | MOD-14 |
| `N8N_REGISTRO_WEBHOOK_URL`, `N8N_REGISTRO_SECRET` | Opcional (W12) | Sin URL o con secreto <32 no se envía nada | MOD-14 |
| `N8N_MFA_WEBHOOK_URL` | Sin uso funcional | Solo lo consulta el diagnóstico y `probar-mfa-n8n.js` | MOD-14 |
| `N8N_MFA_WEBHOOK_SECRET`, `N8N_RECEIPT_WEBHOOK_URL`, `N8N_RECEIPT_WEBHOOK_SECRET` | Sin uso | W5/W9 retirados (2026-10-15) | — |
| `N8N_CHAT_WEBHOOK_URL`, `N8N_API_TOKEN` | Sin uso | No leídas por el código | — |
| `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME` | Solo pruebas de integración | MySQL local (nombre con `test`) | Pruebas |

## 4. n8n (`n8n/.env`, leídas con `$env` en los workflows)

| Variable | Workflows |
|---|---|
| `BACKEND_BASE_URL` | W2, W4, W11 |
| `ADMIN_ALERT_FROM`, `ADMIN_ALERT_TO` | W1, W2, W3, W11 |
| `N8N_W1_SECRET`, `N8N_W3_SECRET`, `N8N_W2_DAILY_SUMMARY_TOKEN`, `N8N_W4_EXPIRY_TOKEN` | W1, W3, W2, W4 (iguales a las del backend) |
| `N8N_W6_ASSISTANT_ESCALATION_SECRET`, `AUTOMATION_FROM_EMAIL`, `ADMIN_EMAIL` | W6, W7 |
| `ASSISTANT_WEEKLY_SUMMARY_URL`, `ASSISTANT_WEEKLY_SUMMARY_TOKEN` | W7 |
| `N8N_W8_ACCOUNT_SECRET` | W8 (leída en su nodo Code) |
| `N8N_W11_SECRET`, `N8N_W11_CALLBACK_SECRET`, `N8N_W11_MAINTENANCE_TOKEN`, `DATOS_GOV_APP_TOKEN`, `VERIFICATION_FROM_EMAIL`/`MFA_FROM_EMAIL` | W11 |
| `N8N_REGISTRO_SECRET` | W12 |
| `MFA_FROM_EMAIL` | W5 (sin uso) |
| `NODE_FUNCTION_ALLOW_BUILTIN=crypto`, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, `EXECUTIONS_DATA_SAVE_ON_SUCCESS`, `EXECUTIONS_DATA_SAVE_ON_ERROR`, `N8N_ENCRYPTION_KEY` | Configuración del contenedor (la última nunca debe cambiar) |

## 5. Reglas de manejo

1. Generar cada secreto aleatorio e independiente (`npm run claves:generar` o `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. Nunca versionar `.env`, nunca pegarlos en chats, capturas, frontend ni n8n salvo los secretos compartidos estrictamente necesarios.
3. Guardar respaldo seguro de `ENC_KEY`, `HMAC_KEY`, `CRYPTO_KEYS`, `IDENT_HMAC_KEY` fuera del equipo (RSK-001).
4. Rotar `JWT_SECRET` cierra todas las sesiones; rotar `HMAC_KEY`/`IDENT_HMAC_KEY` invalida los índices.

## 6. Discrepancias con documentación previa

- `../docs/VARIABLES_ENTORNO.md` marca `N8N_MFA_WEBHOOK_URL`/`SECRET` como obligatorias: ya no lo son (BUG-008).
- `ENC_KEY`, `HMAC_KEY`, `SMTP_*`, `PADRON_*`, `N8N_REGISTRO_*` y `STOCK_MINIMO` no aparecen en `../docs/VARIABLES_ENTORNO.md`.

## Referencias

- [Configuracion/README.md](Configuracion/README.md) · [../06_IMPLEMENTACION/04_MANUAL_DE_CONFIGURACION.md](../06_IMPLEMENTACION/04_MANUAL_DE_CONFIGURACION.md)
- [../docs/VARIABLES_ENTORNO.md](../docs/VARIABLES_ENTORNO.md)
