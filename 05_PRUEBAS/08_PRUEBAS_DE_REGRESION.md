# Pruebas de regresión

| Campo | Valor |
|---|---|
| ID documental | DOC-05-08 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir la suite mínima que debe ejecutarse ante cualquier cambio para detectar regresiones, y la suite ampliada antes de liberar.

## Alcance

Backend, base de datos, frontend y contratos con n8n.

## 1. Suite mínima (cada cambio)

| Paso | Comando / acción | Cubre | Criterio |
|---|---|---|---|
| R1 | `cd backend && npm test` | 107 pruebas Jest + 51 `node:test` (TC aprobados del catálogo) | 0 fallos |
| R2 | `node --check` sobre los archivos JS modificados | Sintaxis | Sin errores |
| R3 | `npm audit --omit=dev` | Dependencias | Sin vulnerabilidades nuevas además de BUG-006 |

Línea base: corrida del 2026-10-16, ver [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md).

## 2. Suite ampliada (antes de fusionar a `main` o liberar)

| Paso | Acción | Casos |
|---|---|---|
| R4 | `npm run test:integration` con MySQL de pruebas | Escenarios A–L y criterios 1–20 (TC-014.b, TC-019, TC-027…TC-030, TC-037.b, TC-205, TC-207, TC-211) |
| R5 | Interfaz jsdom (`test/ui`) | Registro, Mi verificación, panel, catálogo, cambio de contraseña |
| R6 | Recorrido manual del [04_PRUEBAS_FUNCIONALES.md §2](04_PRUEBAS_FUNCIONALES.md) | Flujos de punta a punta |
| R7 | Validación de workflows: `automation.test.js` + importación en n8n de prueba | TC-035, TC-036 |

## 3. Disparadores de regresión dirigida

| Cambio en | Volver a probar |
|---|---|
| `routes/auth.js`, `seguridad/*` | TC-001…TC-009, TC-101…TC-104, TC-203, TC-204, TC-212 |
| `autorizacion.js`, `tenancy.js`, `routes/productos.js` | TC-014…TC-017, TC-201, TC-202 |
| `routes/checkout.js`, `routes/pagos.js`, `paymentJobs.js` | TC-019…TC-022, TC-205, TC-206 |
| `receipt*`, `email.js`, `seguridad/correo.js`, versión de `nodemailer` | TC-025 |
| `migraciones/*`, `db.js` | TC-037 y suite de integración completa |
| `n8n/workflows/*`, `automation*.js`, `avisosN8n.js` | TC-035, TC-036, TC-108 |

## 4. Defectos corregidos previamente que no deben reaparecer

Documentados en [`docs/RESULTADOS_PRUEBAS.md`](../docs/RESULTADOS_PRUEBAS.md) y [`INFORME-INSPECCION.md`](../INFORME-INSPECCION.md): zona horaria del MFA reciente, `restringido="false"` por FormData, rutas `/todos` capturadas por `/:clienteId`, administrador inicial con contraseña conocida. **[REC]** mantener sus pruebas en la suite.

## Referencias

- [01_PLAN_DE_PRUEBAS.md](01_PLAN_DE_PRUEBAS.md) · [12_MATRIZ_DE_COBERTURA.md](12_MATRIZ_DE_COBERTURA.md)
