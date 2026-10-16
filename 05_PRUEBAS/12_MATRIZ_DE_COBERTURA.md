# Matriz de cobertura

| Campo | Valor |
|---|---|
| ID documental | DOC-05-12 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Relacionar cada requerimiento con su caso de prueba, la prueba automatizada que lo respalda y el estado al 2026-10-16.

## Alcance

REQ-F-001…REQ-F-040 y REQ-NF-001…REQ-NF-018. Es cobertura **de requerimientos**, no de código (la cobertura de código no se midió). Rutas de prueba relativas a `backend/test/`.

## 1. Requerimientos funcionales

| REQ | Estado de implementación | TC | Prueba automatizada | Estado TC |
|---|---|---|---|---|
| REQ-F-001 | IMPLEMENTADO Y VERIFICADO | TC-001 | account-registration-phase0.spec.js; registro-verificado.test.js | APROBADO |
| REQ-F-002 | IMPLEMENTADO Y VERIFICADO | TC-002 | registro-verificado.test.js | APROBADO |
| REQ-F-003 | IMPLEMENTADO, NO VERIFICADO | TC-003 | — | BLOQUEADO |
| REQ-F-004 | IMPLEMENTADO Y VERIFICADO | TC-004 | registro-verificado.test.js | APROBADO |
| REQ-F-005 | IMPLEMENTADO Y VERIFICADO | TC-005 | registro-verificado.test.js; mi-cuenta.spec.js | APROBADO |
| REQ-F-006 | IMPLEMENTADO Y VERIFICADO (cancelar no cubierto) | TC-006 | registro-verificado.test.js; mi-cuenta.spec.js | APROBADO (TC-006.b NO EJECUTADO) |
| REQ-F-007 | IMPLEMENTADO Y VERIFICADO | TC-007 | mi-cuenta.spec.js | APROBADO |
| REQ-F-008 | IMPLEMENTADO, NO VERIFICADO | TC-008 | — | BLOQUEADO |
| REQ-F-009 | IMPLEMENTADO Y VERIFICADO | TC-009 | mi-cuenta.spec.js | APROBADO |
| REQ-F-010 | PARCIALMENTE IMPLEMENTADO | TC-010 | mi-cuenta.spec.js | APROBADO (API) |
| REQ-F-011 | PARCIALMENTE IMPLEMENTADO | TC-011 | mi-cuenta.spec.js | APROBADO (API) |
| REQ-F-012 | IMPLEMENTADO Y VERIFICADO | TC-012 | mi-cuenta.spec.js | APROBADO |
| REQ-F-013 | PARCIALMENTE IMPLEMENTADO | TC-013 | mi-cuenta.spec.js | APROBADO (API) |
| REQ-F-014 | IMPLEMENTADO Y VERIFICADO (reglas) | TC-014 | tenancy.test.js; assistant.spec.js | APROBADO (TC-014.b BLOQUEADO) |
| REQ-F-015 | IMPLEMENTADO, NO VERIFICADO | TC-015 | — (histórico: integración) | BLOQUEADO |
| REQ-F-016 | IMPLEMENTADO, NO VERIFICADO | TC-016 | — | BLOQUEADO |
| REQ-F-017 | IMPLEMENTADO, NO VERIFICADO | TC-017 | — (histórico: integración K, H) | BLOQUEADO |
| REQ-F-018 | IMPLEMENTADO, NO VERIFICADO | TC-018 | — | NO EJECUTADO |
| REQ-F-019 | IMPLEMENTADO, NO VERIFICADO | TC-019 | — (histórico: integración L, K, E) | BLOQUEADO |
| REQ-F-020 | IMPLEMENTADO Y VERIFICADO | TC-020 | assistant.spec.js | APROBADO |
| REQ-F-021 | IMPLEMENTADO, NO VERIFICADO | TC-021 | assistant.spec.js (solo consulta de estado) | BLOQUEADO (TC-021.b APROBADO) |
| REQ-F-022 | IMPLEMENTADO Y VERIFICADO | TC-022 | paymentJobs.test.js | APROBADO |
| REQ-F-023 | IMPLEMENTADO, NO VERIFICADO | TC-023 | — | BLOQUEADO |
| REQ-F-024 | IMPLEMENTADO, NO VERIFICADO | TC-024 | — | BLOQUEADO |
| REQ-F-025 | IMPLEMENTADO Y VERIFICADO | TC-025 | receiptService.test.js; receiptTokens.test.js; receiptEmail.test.js | APROBADO |
| REQ-F-026 | IMPLEMENTADO Y VERIFICADO | TC-026 | account-registration-phase0.spec.js | APROBADO |
| REQ-F-027 | IMPLEMENTADO, NO VERIFICADO | TC-027 | verificacion-compra.test.js (parcial) | BLOQUEADO (TC-027.b APROBADO) |
| REQ-F-028 | IMPLEMENTADO Y VERIFICADO (tabla de decisión) | TC-028 | verificacion-compra.test.js | APROBADO (TC-028.b BLOQUEADO) |
| REQ-F-029 | IMPLEMENTADO, NO VERIFICADO | TC-029 | verificacion-compra.test.js (hash del carrito) | BLOQUEADO (TC-029.b APROBADO) |
| REQ-F-030 | IMPLEMENTADO, NO VERIFICADO | TC-030 | — (histórico: compra-verificada 15, 16) | BLOQUEADO |
| REQ-F-031 | IMPLEMENTADO Y VERIFICADO | TC-031 | assistant.spec.js | APROBADO |
| REQ-F-032 | IMPLEMENTADO, NO VERIFICADO | TC-032 | — | BLOQUEADO |
| REQ-F-033 | IMPLEMENTADO, NO VERIFICADO | TC-033 | — | BLOQUEADO (BUG-001) |
| REQ-F-034 | IMPLEMENTADO, NO VERIFICADO | TC-034 | mi-cuenta.spec.js (auditoría de campos) | BLOQUEADO (TC-034.b APROBADO) |
| REQ-F-035 | IMPLEMENTADO Y VERIFICADO | TC-035 | automation.test.js; registro-verificado.test.js; verificacion-compra.test.js | APROBADO |
| REQ-F-036 | NO DETERMINADO | TC-036 | automation.test.js (solo sintaxis JSON) | BLOQUEADO |
| REQ-F-037 | IMPLEMENTADO Y VERIFICADO | TC-037 | db-account-migration.spec.js | APROBADO (TC-037.b BLOQUEADO) |
| REQ-F-038 | PARCIALMENTE IMPLEMENTADO | TC-038 | — | NO EJECUTADO |
| REQ-F-039 | IMPLEMENTADO, NO VERIFICADO | TC-039 | — | NO EJECUTADO |
| REQ-F-040 | DOCUMENTADO, NO IMPLEMENTADO | TC-040 | — | PENDIENTE |

## 2. Requerimientos no funcionales

| REQ | Estado de implementación | TC | Prueba automatizada | Estado TC |
|---|---|---|---|---|
| REQ-NF-001 | IMPLEMENTADO Y VERIFICADO | TC-101 | registro-verificado.test.js; verificacion-compra.test.js | APROBADO |
| REQ-NF-002 | IMPLEMENTADO Y VERIFICADO | TC-102 | pruebas de registro y login | APROBADO |
| REQ-NF-003 | IMPLEMENTADO Y VERIFICADO | TC-103 | verificacion-compra.test.js | APROBADO |
| REQ-NF-004 | IMPLEMENTADO Y VERIFICADO (parcial) | TC-104 | assistant.spec.js; mi-cuenta.spec.js | APROBADO (parcial) |
| REQ-NF-005 | PARCIALMENTE IMPLEMENTADO | TC-105 | — | NO EJECUTADO |
| REQ-NF-006 | IMPLEMENTADO, NO VERIFICADO | TC-106 | scripts/medir-rendimiento.js (no ejecutado) | BLOQUEADO |
| REQ-NF-007 | IMPLEMENTADO, NO VERIFICADO | TC-107 | — | NO EJECUTADO |
| REQ-NF-008 | IMPLEMENTADO Y VERIFICADO | TC-108 | registro-verificado, mi-cuenta, assistant, verificacion-compra | APROBADO |
| REQ-NF-009 | IMPLEMENTADO, NO VERIFICADO | TC-109 | — (histórico: compra-verificada 17) | BLOQUEADO |
| REQ-NF-010 | IMPLEMENTADO Y VERIFICADO (parcial) | TC-110 | automation.test.js; paymentJobs.test.js | APROBADO (parcial) |
| REQ-NF-011 | IMPLEMENTADO, NO VERIFICADO | TC-111 | — (corrida en Node 24.19.0) | NO EJECUTADO |
| REQ-NF-012 | IMPLEMENTADO Y VERIFICADO | TC-112 | `npm test` completo | APROBADO |
| REQ-NF-013 | IMPLEMENTADO, NO VERIFICADO | TC-113 | — | NO EJECUTADO |
| REQ-NF-014 | IMPLEMENTADO Y VERIFICADO (parcial) | TC-114 | assistant.spec.js (widget) | APROBADO (parcial) |
| REQ-NF-015 | PENDIENTE | TC-115 | — | PENDIENTE |
| REQ-NF-016 | PENDIENTE | TC-116 | — | PENDIENTE |
| REQ-NF-017 | PARCIALMENTE IMPLEMENTADO | TC-117 | — | BLOQUEADO |
| REQ-NF-018 | NO DETERMINADO (restricción) | — | — | NO APLICA |

## 3. Casos de seguridad transversales

| TC | REQ relacionados | Estado |
|---|---|---|
| TC-201 | REQ-F-010, REQ-F-021, REQ-F-026 | APROBADO (parcial) |
| TC-202 | REQ-F-026, REQ-F-013, REQ-F-030 | APROBADO |
| TC-203 | REQ-F-001, REQ-F-005 | APROBADO (registro) |
| TC-204 | REQ-F-006 | NO EJECUTADO |
| TC-205 | REQ-F-019 | BLOQUEADO |
| TC-206 | REQ-F-021 | BLOQUEADO |
| TC-207 | REQ-F-035, REQ-F-028 | BLOQUEADO |
| TC-208 | REQ-F-033 | NO EJECUTADO (BUG-001) |
| TC-209 | REQ-F-004, REQ-F-028 | NO EJECUTADO |
| TC-210 | REQ-F-016, REQ-F-034 | NO EJECUTADO |
| TC-211 | REQ-F-027 | BLOQUEADO |
| TC-212 | REQ-NF-003 | APROBADO |

## 4. Resumen

| Grupo | Total | Con caso principal APROBADO hoy | Solo sub-caso APROBADO | Sin cobertura ejecutada hoy |
|---|---|---|---|---|
| REQ-F | 40 | 20 | 4 (REQ-F-021, 027, 029, 034) | 16 |
| REQ-NF (001–017) | 17 | 8 | 0 | 9 |

Las brechas principales se cierran ejecutando la suite de integración ([05_PRUEBAS_DE_INTEGRACION.md](05_PRUEBAS_DE_INTEGRACION.md)).

## Referencias

- [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) · [`../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md`](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md)
