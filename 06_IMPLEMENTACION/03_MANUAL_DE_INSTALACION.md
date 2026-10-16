# Manual de instalación

| Campo | Valor |
|---|---|
| ID documental | DOC-06-03 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir la instalación del sistema a partir del código del repositorio.

## Alcance

Instalación de backend + frontend (servido por el backend), base de datos y servicios auxiliares. Para el entorno de desarrollo detallado ver [../04_DESARROLLO/05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md](../04_DESARROLLO/05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md).

## Estado de verificación de los pasos

| Paso | Estado |
|---|---|
| `npm install` en `backend/` | Verificado (dependencias ya instaladas; versiones listadas en el catálogo) |
| `npm test` | Verificado el 2026-10-16 (Jest 107/107, node:test 51/51) |
| Todos los demás pasos | PENDIENTE DE VALIDAR en esta auditoría |

## Prerrequisitos

1. Node.js (≥18 declarado; probado 24.19.0) y npm.
2. Acceso a una base MySQL 8 con un usuario con permisos de creación y alteración de tablas.
3. Git.
4. Opcional: Docker (Mailpit, n8n, MySQL de pruebas).

## Pasos

1. **Obtener el código.**
   ```bash
   git clone <URL del repositorio>
   cd <carpeta>
   git checkout <rama o etiqueta aprobada>   # hoy: feature/verificacion-seguridad (sin etiqueta, BUG-018)
   ```
2. **Instalar dependencias** (Verificado):
   ```bash
   cd backend
   npm install
   ```
3. **Crear el archivo de configuración**: copiar `backend/.env.example` a `backend/.env` y completar los valores según [04_MANUAL_DE_CONFIGURACION.md](04_MANUAL_DE_CONFIGURACION.md). `backend/.env` está excluido de git y no debe subirse nunca.
4. **Generar las claves del registro verificado** (PENDIENTE DE VALIDAR):
   ```bash
   npm run claves:generar
   ```
   Ejecuta `node scripts/generar-claves.js --escribir`: agrega a `backend/.env` solo las claves que falten (`ENC_KEY`, `HMAC_KEY`, `JWT_SECRET`) y guarda un respaldo del archivo. Sin `ENC_KEY`/`HMAC_KEY` válidas o con `JWT_SECRET` débil el servidor **no arranca**. Guardar una copia de `ENC_KEY` fuera del equipo (RSK-001).
5. **Correo de laboratorio** (opcional, PENDIENTE DE VALIDAR): levantar Mailpit en Docker y apuntar `SMTP_HOST`/`SMTP_PORT` a él. Sin SMTP, fuera de producción, los mensajes se imprimen en la consola del servidor con la marca `[correo-laboratorio]`.
6. **Arrancar** (PENDIENTE DE VALIDAR):
   ```bash
   npm start
   ```
   Al arrancar, `server.js`: valida la configuración segura, el proveedor de pago y el correo; ejecuta `migrar()` (crea tablas, siembra categorías y productos de ejemplo, aplica migraciones 001–003 y crea el administrador inicial si se definieron `ADMIN_EMAIL` y `ADMIN_PASSWORD` de 12+ caracteres); inicia los trabajos de correo, outbox de n8n, expiración de pedidos, verificaciones y sincronización del padrón.
   > **Advertencia:** las migraciones se aplican solas contra la base de `.env`. Hacer un respaldo previo ([09](09_PLAN_DE_RESPALDO_Y_RESTAURACION.md)) y no apuntar el desarrollo a la base de producción (RSK-003).
7. **Abrir** `http://localhost:8081/` (redirige a `landing.html`). No abrir los HTML con `file://` (origen nulo rechazado por CORS).
8. **Crear el superadministrador** si se requiere: ver [12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md](12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md).

## Instalación de n8n (opcional, PENDIENTE DE VALIDAR)

```bash
docker compose -p n8n -f n8n/docker-compose.yml up -d n8n
```
Requiere `n8n/.env` (excluido de git). Ver [07_CONFIGURACION_DE_INTEGRACIONES.md](07_CONFIGURACION_DE_INTEGRACIONES.md).

## Correcciones a la documentación previa (BUG-008)

- `backend/README.md` indica que solo se crean tres tablas: en realidad `migrar()` crea más de 30 tablas (ver [06_CONFIGURACION_DE_BASE_DE_DATOS.md](06_CONFIGURACION_DE_BASE_DE_DATOS.md)).
- La referencia a `.vscode/settings.json` no corresponde a ningún archivo del repositorio.
- MFA y comprobantes ya no requieren n8n (W5/W9): se envían por SMTP con nodemailer.

## Desinstalación

Detener el proceso Node, eliminar la carpeta del proyecto. La base de datos, `DOCUMENTOS_DIR` y las claves **no** se eliminan automáticamente; su destrucción debe seguir la política de conservación (PENDIENTE, BUG-015).

## Referencias

- [../backend/README.md](../backend/README.md)
- [../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md)
- [../README.md](../README.md)
