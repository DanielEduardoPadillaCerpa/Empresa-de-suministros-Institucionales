# Requisitos de infraestructura

| Campo | Valor |
|---|---|
| ID documental | DOC-06-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Enumerar los componentes de infraestructura que el sistema necesita según el código y la configuración del repositorio.

## Alcance

Entornos de desarrollo/laboratorio (observado) y producción (propuesto). No hay evidencia de un entorno productivo actual.

## Componentes

| Componente | Requisito | Evidencia | Estado |
|---|---|---|---|
| Runtime | Node.js ≥ 18 declarado; **probado en Node v24.19.0** (Windows 11) | [../backend/README.md](../backend/README.md), corrida del 2026-10-16 | Node 18: PENDIENTE DE VALIDAR; Node 24.19: Verificado (solo `npm test`) |
| Gestor de paquetes | npm (con `package-lock.json`) | [../backend/package.json](../backend/package.json) | Verificado (`npm install` ya existente) |
| Base de datos | MySQL 8, InnoDB, utf8mb4; usuario con permisos DDL (las migraciones crean y alteran tablas al arrancar) | [../backend/src/db.js](../backend/src/db.js), [../backend/src/migraciones/](../backend/src/migraciones/) | PENDIENTE DE VALIDAR en producción |
| Conexiones MySQL | Máximo **4** usadas por el servidor (pool 3, ampliable a 4 con `DB_CONNECTION_LIMIT`, + 1 pool transaccional con `multipleStatements`). El plan gratuito de Clever Cloud permite **5** por usuario | db.js | IMPLEMENTADO, NO VERIFICADO (REQ-NF-007) |
| Fuente del padrón | Base MySQL de solo lectura con la tabla `personas_institucionales_prueba` (`PADRON_DB_URI`, o `MYSQL_ADDON_URI` si falta) | [../backend/src/seguridad/padron.js](../backend/src/seguridad/padron.js) | PENDIENTE DE VALIDAR |
| Almacenamiento de archivos | Carpeta privada y persistente `DOCUMENTOS_DIR` (por defecto `backend/storage/documentos`, excluida de git); en contenedores, un volumen | [../backend/src/verificacion.js](../backend/src/verificacion.js) | PENDIENTE DE VALIDAR |
| Correo | Servidor SMTP (nodemailer). Laboratorio: Mailpit (SMTP 1025, buzón web 8025). En producción sin `SMTP_HOST` el servidor no arranca | [../backend/src/seguridad/correo.js](../backend/src/seguridad/correo.js) | PENDIENTE DE VALIDAR |
| Automatización (opcional) | n8n `n8nio/n8n:1.110.1` en Docker, volumen `n8n_data`, puerto 5678 | [../n8n/docker-compose.yml](../n8n/docker-compose.yml) | NO DETERMINADO (workflows inactivos) |
| Pruebas de integración | MySQL 8 local en Docker, puerto 3307, base cuyo nombre contenga `test` | [../docs/PLAN_PRUEBAS.md](../docs/PLAN_PRUEBAS.md) | No ejecutado en esta auditoría |
| TLS/HTTPS | Proxy inverso o PaaS con HTTPS; `TRUST_PROXY_HOPS` acorde | [../backend/src/app.js](../backend/src/app.js) | PENDIENTE (REQ-NF-016) |
| Navegador | Navegador moderno con JavaScript; Bootstrap 5.3.3 y Chart.js 4.4.4 se cargan desde `cdn.jsdelivr.net` (requiere salida a Internet) | `../frontend/*.html` | IMPLEMENTADO, NO VERIFICADO |

## Puertos

| Puerto | Servicio | Observación |
|---|---|---|
| 8081 | Backend (API + frontend) | Valor de `PORT` en `.env.example`. **[OBS]** Si `PORT` no está definido, el código usa **8080** (`server.js`). El frontend asume 8081 (BUG-003) |
| 5678 | n8n | docker-compose |
| 1025 / 8025 | Mailpit SMTP / buzón web | Solo laboratorio |
| 3307 | MySQL de pruebas en Docker | Solo pruebas de integración |
| 3306 | MySQL | Puerto por defecto de `DB_PORT` |
| 5500 / 5501 | Live Server (opcional) | Permitidos por defecto en CORS fuera de producción |
| 8091 | Servidor de pruebas de interfaz | `backend/test/ui/servidor-prueba.js` |

## Dimensionamiento

**NO DETERMINADO.** No hay mediciones de carga. Solo existen tiempos de respuesta del laboratorio (2026-10-15, histórico; ver REQ-NF-006). **[INF]** La latencia está dominada por el viaje a MySQL (~150 ms desde el equipo de laboratorio); se recomienda **[REC]** desplegar el backend en la misma red que la base.

## Restricciones

- **[OBS]** Una sola instancia: captcha y limitadores de tasa viven en memoria del proceso (BUG-010, RSK-014).
- **[OBS]** Costo cero en laboratorio (REQ-NF-018).
- **[REC]** Antes de correr scripts que abren conexiones (`importar-padron`, `medir-rendimiento`, `migraciones`, `crear-*`), detener el servidor para no exceder el límite de 5 conexiones (RSK-004).

## Referencias

- [03_MANUAL_DE_INSTALACION.md](03_MANUAL_DE_INSTALACION.md)
- [06_CONFIGURACION_DE_BASE_DE_DATOS.md](06_CONFIGURACION_DE_BASE_DE_DATOS.md)
