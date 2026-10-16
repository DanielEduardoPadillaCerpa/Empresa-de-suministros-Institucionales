# Pruebas de integración

| Campo | Valor |
|---|---|
| ID documental | DOC-05-05 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir las pruebas que integran el backend con MySQL real, con la interfaz (jsdom) y con servicios externos (SMTP, n8n), su estado y cómo ejecutarlas de forma segura.

## Alcance

- `backend/test/integration/verificacion.int.spec.js` (escenarios A–L) y `backend/test/integration/compra-verificada.int.spec.js` (criterios 1–20), con ayudantes en `backend/test/integration/ayudantes.js`.
- `backend/test/ui/servidor-prueba.js` y `backend/test/ui/ui-e2e.js`.
- Integraciones externas: SMTP (nodemailer), n8n, fuente del padrón, datos.gov.co (vía W11).

## 1. Estado al 2026-10-16

| Integración | Estado | Motivo |
|---|---|---|
| Backend ↔ MySQL (suite de integración) | **BLOQUEADO** | No había un MySQL 8 de pruebas en Docker disponible en esta auditoría; la suite no debe correrse contra Clever Cloud |
| Interfaz jsdom | **BLOQUEADO** | Requiere el servidor de prueba en :8091 y la base `suministros_ui_test` vacía |
| Backend ↔ SMTP | **BLOQUEADO** | No se envían correos reales en una auditoría documental; las suites unitarias simulan `nodemailer` |
| Backend ↔ n8n | **BLOQUEADO** | Instancia n8n y credenciales no disponibles; todos los workflows `active: false` |
| Backend ↔ fuente del padrón | **BLOQUEADO** | La fuente es una base remota de laboratorio |
| n8n ↔ datos.gov.co (W11) | **BLOQUEADO** | No se contactan servicios externos |

Evidencia histórica (no reproducida): integración **48/48** e interfaz **43/43** el 2026-10-13 en MySQL 8 Docker puerto 3307 ([`docs/RESULTADOS_PRUEBAS.md`](../docs/RESULTADOS_PRUEBAS.md)).

## 2. Cómo ejecutar la integración (entorno autorizado)

1. Levantar MySQL 8 local (valores entre `< >` los define el ejecutor; no registrarlos en documentos):
   ```bash
   docker run -d --name suministros-test-mysql -e MYSQL_ROOT_PASSWORD=<root> \
     -e MYSQL_DATABASE=suministros_test -e MYSQL_USER=test -e MYSQL_PASSWORD=<clave> -p 3307:3306 mysql:8.0
   ```
2. Definir en el entorno del proceso: `TEST_DB_HOST=127.0.0.1`, `TEST_DB_PORT=3307`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME=suministros_test`.
3. Desde `backend/`: `npm run test:integration`.
4. **Advertencia [OBS]:** la suite **borra todas las tablas** de la base indicada; por eso se niega a ejecutarse si la base no es local o su nombre no contiene `test`. Detener cualquier `npm run dev` apuntado a otra base para no aplicar migraciones donde no corresponde (incidente del 2026-10-13, [`docs/AUDITORIA_TECNICA.md`](../docs/AUDITORIA_TECNICA.md) §7).
5. Interfaz: terminal 1 `node test/ui/servidor-prueba.js`; terminal 2 `node test/ui/ui-e2e.js`. Reiniciar el servidor entre corridas (límite de 10 logins por IP cada 15 min).

## 3. Casos de integración que se desbloquean

TC-003, TC-008, TC-014.b, TC-015…TC-017, TC-019, TC-021, TC-023, TC-024, TC-027, TC-028.b, TC-029, TC-030, TC-032…TC-034, TC-037.b, TC-109, TC-205…TC-207, TC-211.

## 4. Integraciones externas (manuales)

| Integración | Procedimiento | Precaución |
|---|---|---|
| SMTP | Mailpit local (`SMTP_HOST=localhost`, puerto 1025) y revisar `http://localhost:8025` | No usar buzones reales |
| n8n W12 | Importar `n8n/workflows/W12-avisos-registro.json`, definir `N8N_REGISTRO_SECRET` igual en ambos lados, activar y registrar una solicitud sintética | Solo debe llegar `{evento, solicitud_id, resultado}` |
| n8n W1–W4, W6–W8, W11 | Según [`backend/README.md`](../backend/README.md) y [`docs/FLUJO_N8N_VERIFICACION.md`](../docs/FLUJO_N8N_VERIFICACION.md) | W5 y W9 están sin uso desde 2026-10-15 |

## Referencias

- [01_PLAN_DE_PRUEBAS.md](01_PLAN_DE_PRUEBAS.md) · [`../docs/PLAN_PRUEBAS.md`](../docs/PLAN_PRUEBAS.md) · [`../04_DESARROLLO/10_INTEGRACIONES_Y_AUTOMATIZACIONES.md`](../04_DESARROLLO/10_INTEGRACIONES_Y_AUTOMATIZACIONES.md)
