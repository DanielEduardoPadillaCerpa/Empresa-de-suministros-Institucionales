# Guía de instalación del entorno de desarrollo

| Campo | Valor |
|---|---|
| ID documental | DOC-04-05 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Preparar un equipo de desarrollo para trabajar con el proyecto sin tocar datos reales.

## Alcance

Derivada de `../backend/package.json`, `../backend/.env.example`, `../backend/server.js`, `../n8n/docker-compose.yml` y de la documentación previa (`../README.md`, `../backend/README.md`, `../docs/PLAN_PRUEBAS.md`, `../docs/REGISTRO_VERIFICADO.md`).

**Grado de validación [OBS]:** el 2026-10-16 solo se ejecutó `npm test` sobre dependencias ya instaladas (Node v24.19.0, Windows 11). Los pasos marcados *PENDIENTE DE VALIDACIÓN* no se ejecutaron en esta auditoría.

## 1. Requisitos

| Componente | Versión | Obligatorio | Evidencia |
|---|---|---|---|
| Node.js + npm | ≥18 según README; probado con 24.19.0 | Sí | `../backend/README.md`, ejecución 2026-10-16 |
| Git | Cualquiera reciente | Sí | — |
| MySQL 8 | Base **local o de pruebas** | Sí para ejecutar el servidor | `../backend/src/db.js` |
| Docker | Cualquiera reciente | Para MySQL de pruebas, Mailpit y n8n | `../docs/PLAN_PRUEBAS.md`, `../n8n/docker-compose.yml` |
| Mailpit (SMTP 1025, buzón 8025) | Opcional | Recomendado para ver los códigos MFA | `../backend/.env.example` |
| Navegador moderno | — | Sí | Bootstrap 5.3.3 por CDN (requiere Internet) |

> **Advertencia [OBS]:** no apunte el `.env` de desarrollo a la base de Clever Cloud. Cada arranque ejecuta migraciones; con `npm run dev` (`node --watch`) cada guardado reinicia y migra. Así ocurrió el incidente del 2026-10-13 (`../docs/AUDITORIA_TECNICA.md` §7). Además, el plan gratuito permite 5 conexiones y el servidor usa 4.

## 2. Pasos

1. Clonar el repositorio y cambiar a la rama de trabajo:
   ```bash
   git clone https://github.com/DanielEduardoPadillaCerpa/Empresa-de-suministros-Institucionales.git
   cd Empresa-de-suministros-Institucionales
   git checkout feature/verificacion-seguridad
   ```
   *PENDIENTE DE VALIDACIÓN* (no se clonó de nuevo en la auditoría).
2. Instalar dependencias del backend:
   ```bash
   cd backend
   npm install        # o npm ci para respetar package-lock.json
   ```
   `bcrypt` es nativo; si su compilación falla, `src/seguridad/contrasenas.js` usa `bcryptjs` como respaldo **[OBS]**.
3. Crear la base MySQL local de desarrollo (ejemplo con Docker; valores entre `<>` a definir por el desarrollador):
   ```bash
   docker run -d --name suministros-dev-mysql -e MYSQL_ROOT_PASSWORD=<definir> \
     -e MYSQL_DATABASE=suministros_dev -e MYSQL_USER=<definir> -e MYSQL_PASSWORD=<definir> \
     -p 3306:3306 mysql:8.0
   ```
   *PENDIENTE DE VALIDACIÓN*. Para las pruebas de integración se usa otra base (puerto 3307, nombre con `test`), ver [06_GUIA_DE_EJECUCION_LOCAL.md](06_GUIA_DE_EJECUCION_LOCAL.md).
4. Crear `backend/.env` a partir de la plantilla y completar los valores:
   ```bash
   cp .env.example .env
   npm run claves:generar     # agrega ENC_KEY, HMAC_KEY y JWT_SECRET si faltan (respaldo previo)
   ```
   Mínimo para arrancar **[OBS]** (`configSegura.js`): `JWT_SECRET` (≥32, aleatorio), `ENC_KEY` y `HMAC_KEY` (64 hex, distintas), `DB_*`. Recomendado: `MFA_TOKEN_PEPPER`, `CRYPTO_KEYS`/`CRYPTO_KEY_ACTIVA`, `IDENT_HMAC_KEY`, `RECEIPT_LINK_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (≥12) para crear el primer administrador. Detalle en [11_VARIABLES_DE_ENTORNO.md](11_VARIABLES_DE_ENTORNO.md) y plantilla comentada en [Configuracion/env.ejemplo.documentado.txt](Configuracion/env.ejemplo.documentado.txt).
5. (Opcional) Mailpit:
   ```bash
   docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
   ```
   Con `SMTP_HOST=localhost`, `SMTP_PORT=1025`. Sin SMTP, fuera de producción, el correo se imprime en consola como `[correo-laboratorio]` **[OBS]**. *PENDIENTE DE VALIDACIÓN* (imagen y comando no presentes en el repositorio).
6. (Opcional) Padrón de laboratorio: definir `PADRON_DB_URI` hacia una base con la tabla `personas_institucionales_prueba` (solo lectura). Sin ella, la verificación devuelve `padron_no_disponible` **[INF]** y las solicitudes quedan igualmente pendientes.
7. (Opcional) n8n: `docker compose -p n8n -f n8n/docker-compose.yml up -d n8n` con `n8n/.env` propio (no versionado). Ver [10_INTEGRACIONES_Y_AUTOMATIZACIONES.md](10_INTEGRACIONES_Y_AUTOMATIZACIONES.md).
8. Verificar la instalación ejecutando las pruebas unitarias (no requieren base de datos):
   ```bash
   npm test
   ```
   Resultado esperado **[OBS 2026-10-16]**: Jest 107/107 y `node:test` 51/51.

## 3. Editor y herramientas

- **[OBS]** No hay configuración de linter/formatter en el repositorio (sin `.eslintrc`, `.prettierrc` ni `.editorconfig`); la documentación previa menciona `.vscode/settings.json` (Live Server en 5501), pero ese archivo no existe (BUG-008).
- **[REC]** Usar VS Code con la extensión Live Server solo si se sirve `frontend/` aparte; los orígenes 5500/5501 ya están permitidos por defecto en CORS.

## Referencias

- [06_GUIA_DE_EJECUCION_LOCAL.md](06_GUIA_DE_EJECUCION_LOCAL.md) · [07_DEPENDENCIAS_Y_VERSIONES.md](07_DEPENDENCIAS_Y_VERSIONES.md) · [14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md](14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md)
- [../06_IMPLEMENTACION/03_MANUAL_DE_INSTALACION.md](../06_IMPLEMENTACION/03_MANUAL_DE_INSTALACION.md)
- [../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md)
