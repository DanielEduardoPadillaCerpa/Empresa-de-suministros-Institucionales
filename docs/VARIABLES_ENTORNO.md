# Variables de entorno

Solo nombres y propósito; los valores reales viven en `backend/.env` (ignorado por git). Plantilla: `backend/.env.example`.

| Variable | Obligatoria | Propósito |
|---|---|---|
| `PORT` | No (8080) | Puerto HTTP |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT` | Sí | Conexión MySQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_EXPIRES_DIAS` | Sí | Sesiones. Ya no hay valor por defecto en el código; en producción el arranque falla si es corto o parece de ejemplo |
| `CRYPTO_KEY` | Sí | Cifrado AES-256-GCM de datos privados **y de los documentos de verificación**. Si cambia, lo cifrado antes no se puede leer |
| `MFA_TOKEN_PEPPER`, `N8N_MFA_WEBHOOK_URL`, `N8N_MFA_WEBHOOK_SECRET` | Sí | Código MFA por correo |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Solo para crear el primer administrador | Contraseña de 12 caracteres o más |
| `CORS_ORIGINS`, `TRUST_PROXY_HOPS` | En producción | Orígenes permitidos, proxy |
| `DOCUMENTOS_DIR` | Recomendada | Carpeta privada de documentos cifrados (por defecto `backend/storage/documentos`, ignorada por git) |
| `REGISTRO_LIMITE_POR_HORA` | No (10) | Registros por IP y por hora |
| `PAYMENT_MODE`, `PAYMENT_WEBHOOK_SECRET`, `RECEIPT_*`, `N8N_W*`, `SMTP_*`, `ASSISTANT_*`, `STOCK_MINIMO` | Según módulo | Sin cambios |
| `CRYPTO_KEYS`, `CRYPTO_KEY_ACTIVA` | **Sí en producción** para la verificación | Anillo AES-256-GCM versionado (`id:base64 de 32 bytes`). Sin él, los datos nuevos usan la clave heredada y la verificación de identidad queda deshabilitada. No borres una clave mientras haya datos cifrados con ella |
| `IDENT_HMAC_KEY` | **Sí** para la verificación | Clave HMAC (base64, 32 bytes o más), distinta de las de cifrado, para el índice del documento de identidad. Cambiarla invalida el índice |
| `VERIFICACION_VIGENCIA_DIAS` | No (365) | Vigencia de una verificación aprobada (máximo 730) |
| `N8N_W11_VERIFICATION_WEBHOOK_URL`, `N8N_W11_SECRET` | Para activar W11 | Eventos firmados hacia n8n |
| `N8N_W11_CALLBACK_SECRET` | Para recibir resultados de n8n | Secreto **distinto** para las respuestas de n8n; sin él se rechazan |
| `N8N_W11_MAINTENANCE_TOKEN` | Para el mantenimiento desde n8n | Token del endpoint de mantenimiento (también corre un job interno) |
| `SUPERADMIN_PASSWORD` | Solo al ejecutar `scripts/crear-superadmin.js` | Contraseña inicial (16 a 72 caracteres); bórrala después |
| `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME` | Solo pruebas | MySQL local de integración (el nombre debe contener `test`) |
| `TEST_RATE_LIMITS` | Solo pruebas | `1` activa los limitadores de registro y subida en `NODE_ENV=test` |
