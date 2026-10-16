# Plan de pruebas

| Campo | Valor |
|---|---|
| ID documental | DOC-05-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir qué se prueba en la plataforma Suministros Institucionales, con qué suites, en qué entornos, con qué criterios de entrada y salida y cómo se registran los resultados. El plan parte de las suites automatizadas que ya existen en `backend/test/` y del plan previo [`docs/PLAN_PRUEBAS.md`](../docs/PLAN_PRUEBAS.md), que se conserva sin cambios.

## Alcance

- Backend Node.js/Express (`backend/src/**`), base de datos MySQL (esquema y migraciones), frontend estático (`frontend/**`) y contratos con n8n (`n8n/workflows/*.json`).
- Requerimientos REQ-F-001…REQ-F-040 y REQ-NF-001…REQ-NF-017 definidos en [`../01_INGENIERIA_DE_REQUERIMIENTOS/05_REQUERIMIENTOS_FUNCIONALES.md`](../01_INGENIERIA_DE_REQUERIMIENTOS/05_REQUERIMIENTOS_FUNCIONALES.md) y [`../01_INGENIERIA_DE_REQUERIMIENTOS/06_REQUERIMIENTOS_NO_FUNCIONALES.md`](../01_INGENIERIA_DE_REQUERIMIENTOS/06_REQUERIMIENTOS_NO_FUNCIONALES.md).
- Fuera de alcance de esta auditoría: pruebas contra la base de Clever Cloud, envío de correo real, activación de workflows en n8n, pruebas de carga contra servicios externos y cualquier prueba destructiva.

## 1. Niveles y suites

| Nivel | Suite / herramienta | Comando (desde `backend/`) | Dependencias | Estado al 2026-10-16 |
|---|---|---|---|---|
| Unitarias y de API con base simulada (Jest + supertest) | `test/assistant.spec.js`, `test/account-registration-phase0.spec.js`, `test/mi-cuenta.spec.js`, `test/db-account-migration.spec.js` | `npm run test:assistant` | Ninguna (mocks de `src/db`) | **Ejecutada: 4 suites, 107/107 aprobadas** [OBS] |
| Unitarias `node:test` | `test/automation.test.js`, `paymentJobs.test.js`, `receiptEmail.test.js`, `receiptService.test.js`, `receiptTokens.test.js`, `registro-verificado.test.js`, `tenancy.test.js`, `verificacion-compra.test.js` | `npm run test:legacy` | Ninguna | **Ejecutada: 51/51 aprobadas** [OBS] |
| Integración contra MySQL real | `test/integration/verificacion.int.spec.js`, `test/integration/compra-verificada.int.spec.js` | `npm run test:integration` | MySQL 8 local (Docker, puerto 3307, base con `test` en el nombre) | **BLOQUEADA**: no hay MySQL de pruebas disponible en esta auditoría [OBS] |
| Interfaz (jsdom) | `test/ui/servidor-prueba.js` + `test/ui/ui-e2e.js` | Terminal 1 `node test/ui/servidor-prueba.js`; terminal 2 `node test/ui/ui-e2e.js` | Servidor de prueba en :8091 y base `suministros_ui_test` vacía | **BLOQUEADA** (misma causa) |
| Rendimiento | `scripts/medir-rendimiento.js` | `npm run medir` | **Base real** configurada en `.env` | **NO EJECUTADA**: usa la base real; requiere autorización |
| Manuales | Navegador real, SMTP, n8n | Ver [04_PRUEBAS_FUNCIONALES.md](04_PRUEBAS_FUNCIONALES.md) | Servidor, Mailpit, n8n | NO EJECUTADAS |

`npm test` encadena `test:assistant` y `test:legacy` (ver `backend/package.json`).

## 2. Entornos

| Entorno | Uso | Restricción |
|---|---|---|
| Local sin base (mocks) | Suites unitarias | Ninguna; es el único usado el 2026-10-16 |
| MySQL 8 en Docker local | Integración e interfaz | La suite **borra todas las tablas** de la base indicada; se niega a correr si la base no es local o su nombre no contiene `test` (ver [`docs/PLAN_PRUEBAS.md`](../docs/PLAN_PRUEBAS.md)) |
| Base de laboratorio Clever Cloud | Solo `npm run medir`, con autorización | Límite de 5 conexiones: detener el servidor antes de ejecutar scripts [OBS memoria del proyecto] |
| n8n local (`n8n/docker-compose.yml`) | Pruebas manuales de workflows | Todos los workflows están `active: false` |

## 3. Criterios de entrada

- Dependencias instaladas (`npm install` en `backend/`).
- Para integración: contenedor MySQL de pruebas y variables `TEST_DB_*` definidas (sin valores reales en documentos).
- Para pruebas manuales: cuentas sintéticas creadas con `scripts/crear-cuentas-prueba.js` en una base de prueba, nunca en producción (RN-019).

## 4. Criterios de salida

- 0 fallos en `npm test`.
- Ningún caso de severidad Alta abierto sin decisión documentada en [09_REGISTRO_DE_DEFECTOS.md](09_REGISTRO_DE_DEFECTOS.md).
- Integración y jsdom ejecutadas y aprobadas antes de cualquier liberación (hoy pendiente).
- Los resultados se registran en [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md) con fecha, commit, entorno y evidencia en [13_EVIDENCIAS/](13_EVIDENCIAS/README.md).

## 5. Roles

| Rol | Responsable |
|---|---|
| Responsable de calidad | PENDIENTE DE ASIGNACIÓN |
| Ejecutor de pruebas manuales | PENDIENTE DE ASIGNACIÓN |
| Aprobador de resultados | PENDIENTE DE ASIGNACIÓN |

## 6. Calendario

No existe un cronograma aprobado [OBS]. La corrida de esta auditoría se hizo el 2026-10-16. **[REC]** Ejecutar `npm test` en cada cambio y la integración antes de cada fusión a `main`.

## Referencias

- [02_ESTRATEGIA_Y_ALCANCE_DE_PRUEBAS.md](02_ESTRATEGIA_Y_ALCANCE_DE_PRUEBAS.md) · [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) · [12_MATRIZ_DE_COBERTURA.md](12_MATRIZ_DE_COBERTURA.md)
- Plan previo: [`../docs/PLAN_PRUEBAS.md`](../docs/PLAN_PRUEBAS.md) · Resultados históricos: [`../docs/RESULTADOS_PRUEBAS.md`](../docs/RESULTADOS_PRUEBAS.md)
- Código: [`../backend/package.json`](../backend/package.json), [`../backend/test/`](../backend/test/)
