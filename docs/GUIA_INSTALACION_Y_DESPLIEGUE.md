# Guía de instalación y despliegue

## Desarrollo local

```bash
cd backend
npm install
cp .env.example .env      # completa DB_*, JWT_SECRET, CRYPTO_KEY, MFA_TOKEN_PEPPER, N8N_MFA_*, ADMIN_EMAIL/ADMIN_PASSWORD
npm start                 # o npm run dev (node --watch)
```

Abre `http://localhost:8081/`. Al arrancar, `migrar()` crea o actualiza el esquema y aplica las migraciones versionadas pendientes (`schema_migraciones`).

> **Cuidado con `npm run dev` y la base real.** Con `node --watch`, cada cambio guardado reinicia el servidor y ejecuta las migraciones contra la base de `.env`. Para desarrollar, apunta `.env` a una base local o de pruebas, nunca a Clever Cloud.

Si no existe ningún administrador, se crea uno con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres). Sin esa variable no se crea, y la contraseña nunca se escribe en los registros.

## Despliegue

1. **Respaldo** de la base (`mysqldump`) antes de desplegar.
2. Variables nuevas: `DOCUMENTOS_DIR` (carpeta privada y persistente; en contenedores, un volumen) y, opcionalmente, `REGISTRO_LIMITE_POR_HORA`. Ver [VARIABLES_ENTORNO.md](VARIABLES_ENTORNO.md).
3. `DOCUMENTOS_DIR` no debe estar dentro de `frontend/` ni de `backend/img/`, y debe incluirse en la política de respaldo: sin esos archivos los documentos no se pueden recuperar, y sin `CRYPTO_KEY` tampoco se pueden descifrar.
4. Arrancar el servidor: la migración `001_verificacion_institucional` se aplica sola. Verificar con `node scripts/migraciones.js estado`.
5. Revisar en `admin-verificaciones.html` las cuentas heredadas (estado `borrador`) y los productos en revisión `pendiente`.
6. Detrás de un proxy: `TRUST_PROXY_HOPS=1`, HTTPS obligatorio y, recomendado, cabeceras CSP/HSTS.

## Reversión

```bash
node scripts/migraciones.js revertir 001_verificacion_institucional --confirmo-perdida-de-datos
```

Luego desplegar el código anterior (respaldo local: `.respaldo-pre-verificacion/backend-frontend-2026-10-13.tgz`).

## Pruebas

Ver [PLAN_PRUEBAS.md](PLAN_PRUEBAS.md). Resumen: `npm test` (unitarias) y `npm run test:integration` (requiere el MySQL de pruebas en Docker).
