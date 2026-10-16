# Manual de configuración

| Campo | Valor |
|---|---|
| ID documental | DOC-06-04 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir, por grupos, las variables de entorno del backend y su efecto, **sin valores**. La plantilla es [../backend/.env.example](../backend/.env.example); los valores reales viven en `backend/.env` (excluido de git) o en el gestor de secretos del entorno.

## Alcance

Variables leídas por `../backend/server.js`, `../backend/src/**` y `../backend/scripts/**`. Referencia detallada para desarrollo: [../04_DESARROLLO/11_VARIABLES_DE_ENTORNO.md](../04_DESARROLLO/11_VARIABLES_DE_ENTORNO.md).

## Reglas generales

- **[OBS]** `server.js` carga `backend/.env` con ruta explícita.
- **[OBS]** `configSegura.js` impide arrancar en **cualquier** entorno si `JWT_SECRET` falta, tiene menos de 32 caracteres o parece de ejemplo (patrones como `cambia`, `replace_`, `example`, `secreto`, `password`), o si `ENC_KEY`/`HMAC_KEY` no son válidas. En producción también bloquean `MFA_TOKEN_PEPPER` y `CRYPTO_KEY` débiles.
- **[REC]** Un secreto distinto por propósito, generado aleatoriamente (`npm run claves:generar` o `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Reiniciar el backend tras cualquier cambio.

## Grupos de variables

| Grupo | Variables | Obligatoriedad | Notas |
|---|---|---|---|
| Servidor | `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS` | `CORS_ORIGINS` obligatoria con `NODE_ENV=production` | `PORT` por defecto 8080 en código; la plantilla usa 8081. `TRUST_PROXY_HOPS` entero ≥ 0 |
| Base de datos | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT` | Sí | `DB_CONNECTION_LIMIT` se recorta a máx. 4; por defecto 3 |
| Sesión | `JWT_SECRET`, `JWT_EXPIRES_IN` (2h), `REFRESH_EXPIRES_DIAS` (7) | `JWT_SECRET` sí | Rotar `JWT_SECRET` cierra todas las sesiones |
| Cifrado registro verificado | `ENC_KEY`, `ENC_KEY_VERSION`, `ENC_KEY_V<n>`, `HMAC_KEY` | Sí (sin ellas no arranca) | 32 bytes en hex, distintas. Rotación: nueva `ENC_KEY` + `ENC_KEY_VERSION=2` + anterior en `ENC_KEY_V1` |
| Cifrado heredado y verificación en compra | `CRYPTO_KEY`, `CRYPTO_KEYS`, `CRYPTO_KEY_ACTIVA`, `IDENT_HMAC_KEY` | `CRYPTO_KEY` para datos heredados; `CRYPTO_KEYS`+`IDENT_HMAC_KEY` para habilitar la verificación de identidad | Sin el anillo, los datos nuevos usan la clave heredada y la verificación en compra queda deshabilitada |
| Contraseñas | `BCRYPT_COST` | No | 10 por defecto fuera de producción, 12 en producción |
| MFA | `MFA_TOKEN_PEPPER` | Sí | HMAC de los códigos |
| Administrador inicial | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Solo para crear el primero | Contraseña ≥ 12 caracteres; cambio obligatorio en el primer acceso |
| Superadministrador | `SUPERADMIN_PASSWORD` | Solo al ejecutar el script | ≥ 16 caracteres; borrar después |
| Correo | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | `SMTP_HOST` obligatoria en producción | Fuera de producción sin SMTP se imprime en consola |
| Pagos y comprobantes | `PAYMENT_MODE` (`mock`), `PAYMENT_WEBHOOK_SECRET`, `RECEIPT_LINK_SECRET`, `RECEIPT_LINK_BASE_URL`, `ADMIN_NOTIFICATION_EMAIL` | Según uso | `sandbox`/`prod` impiden arrancar (REQ-F-040) y `mock` está prohibido con `NODE_ENV=production`: hoy no es posible arrancar en modo producción (ver [05](05_GUIA_DE_DESPLIEGUE.md)). Enlace base HTTPS fuera de localhost |
| Padrón | `PADRON_DB_URI` (o `MYSQL_ADDON_URI`), `PADRON_SYNC_MINUTOS` (10) | Para el registro verificado | Solo lectura sobre la fuente |
| Registro | `REGISTRO_LIMITE_POR_HORA` (10) | No | Por IP |
| Documentos | `DOCUMENTOS_DIR` | Recomendada | Carpeta privada, fuera de `frontend/` y `backend/img/` |
| Verificación | `VERIFICACION_VIGENCIA_DIAS` (365, máx. 730) | No | |
| n8n (outbox y endpoints) | `N8N_W1_PAYMENT_WEBHOOK_URL`, `N8N_W1_SECRET`, `N8N_W2_DAILY_SUMMARY_TOKEN`, `N8N_W3_STOCK_WEBHOOK_URL`, `N8N_W3_SECRET`, `N8N_W4_EXPIRY_TOKEN`, `N8N_W6_ASSISTANT_ESCALATION_WEBHOOK_URL`, `N8N_W6_ASSISTANT_ESCALATION_SECRET`, `N8N_W8_ACCOUNT_WEBHOOK_URL`, `N8N_W8_ACCOUNT_SECRET`, `N8N_W11_VERIFICATION_WEBHOOK_URL`, `N8N_W11_SECRET`, `N8N_W11_CALLBACK_SECRET`, `N8N_W11_MAINTENANCE_TOKEN`, `N8N_REGISTRO_WEBHOOK_URL`, `N8N_REGISTRO_SECRET`, `ASSISTANT_WEEKLY_SUMMARY_TOKEN`, `AUTOMATION_STOCK_LOW_THRESHOLD` | Opcionales | Sin URL/secreto el evento no se envía o el endpoint responde 503. Tokens ≥ 32 caracteres |
| n8n sin uso | `N8N_MFA_WEBHOOK_URL`, `N8N_MFA_WEBHOOK_SECRET`, `N8N_RECEIPT_WEBHOOK_URL`, `N8N_RECEIPT_WEBHOOK_SECRET`, `N8N_CHAT_WEBHOOK_URL`, `N8N_API_TOKEN` | **No** | La plantilla las declara "sin uso" desde 2026-10-15. Corrige a `docs/VARIABLES_ENTORNO.md`, que las marca obligatorias (BUG-008) |
| Asistente | `ASSISTANT_MODE` (`rules`/`llm`), `OLLAMA_URL`, `OLLAMA_MODEL` | No | Otro valor de `ASSISTANT_MODE` impide arrancar |
| Pruebas | `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME`, `TEST_RATE_LIMITS` | Solo pruebas | Base local cuyo nombre contenga `test` |

## Configuración del frontend

- **[OBS]** `../frontend/js/auth.js` fija `API_BASE = 'http://localhost:8081'` (BUG-003). Desplegar en otro dominio exige modificar ese valor (cambio de código, fuera de este documento) o servir el frontend en ese mismo origen y puerto. **PENDIENTE** de corrección.

## Verificación de la configuración

- Arranque sin errores `[server] No se pudo iniciar` ni `Configuración insegura`. PENDIENTE DE VALIDAR.
- El superadministrador puede consultar *Diagnóstico* (`GET /api/verificacion/admin/diagnostico`), que muestra qué configuraciones están presentes **sin sus valores**. PENDIENTE DE VALIDAR.

## Referencias

- [../docs/VARIABLES_ENTORNO.md](../docs/VARIABLES_ENTORNO.md)
- [08_CONFIGURACION_DE_SEGURIDAD.md](08_CONFIGURACION_DE_SEGURIDAD.md)
- [../backend/src/configSegura.js](../backend/src/configSegura.js)
