# Variables de entorno

Solo nombres y propósito; los valores reales viven en `backend/.env` (ignorado por git). Plantilla: `backend/.env.example`.

| Variable | Obligatoria | Propósito |
|---|---|---|
| `PORT` | No (8080) | Puerto HTTP |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT` | Sí | Conexión MySQL |
| `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_EXPIRES_DIAS` | Sí | Sesiones |
| `CRYPTO_KEY` | Sí | Cifrado AES-256-GCM de datos privados **y de los documentos de verificación**. Si cambia, lo cifrado antes no se puede leer |
| `MFA_TOKEN_PEPPER`, `N8N_MFA_WEBHOOK_URL`, `N8N_MFA_WEBHOOK_SECRET` | Sí | Código MFA por correo |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Solo para crear el primer administrador | Contraseña de 12 caracteres o más |
| `CORS_ORIGINS`, `TRUST_PROXY_HOPS` | En producción | Orígenes permitidos, proxy |
| `DOCUMENTOS_DIR` | Recomendada | Carpeta privada de documentos cifrados (por defecto `backend/storage/documentos`, ignorada por git) |
| `REGISTRO_LIMITE_POR_HORA` | No (10) | Registros por IP y por hora |
| `PAYMENT_MODE`, `PAYMENT_WEBHOOK_SECRET`, `RECEIPT_*`, `N8N_W*`, `SMTP_*`, `ASSISTANT_*`, `STOCK_MINIMO` | Según módulo | Sin cambios |
| `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME` | Solo pruebas | MySQL local de integración (el nombre debe contener `test`) |
| `TEST_RATE_LIMITS` | Solo pruebas | `1` activa los limitadores de registro y subida en `NODE_ENV=test` |
