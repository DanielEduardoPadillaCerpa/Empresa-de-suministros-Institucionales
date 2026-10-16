# Resultados de ejecución

| Campo | Valor |
|---|---|
| ID documental | DOC-05-10 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar únicamente las ejecuciones reales. Las corridas anteriores se citan como históricas.

## Alcance

Corrida del 2026-10-16 realizada durante la auditoría documental y referencias a corridas previas.

## 1. Corrida EJ-2026-10-16-01

| Campo | Valor |
|---|---|
| Fecha | 2026-10-16 |
| Commit | `4742737` (rama `feature/verificacion-seguridad`, árbol limpio) |
| Entorno | Windows 11 Pro, Node.js v24.19.0, dependencias ya instaladas en `backend/node_modules` |
| Comando | `cd backend && npm test` (= `npm run test:assistant && npm run test:legacy`) |
| Base de datos | Ninguna: las suites reemplazan `src/db` por una base simulada en memoria |
| Red / correo | `nodemailer` simulado; ningún correo enviado |
| Código de salida | 0 |
| Ejecutor | Auditoría documental asistida (responsable formal PENDIENTE DE ASIGNACIÓN) |

| Suite | Resultado | Duración informada |
|---|---|---|
| Jest (`test:assistant`): 4 suites | **107/107 aprobadas**, 0 snapshots | 3.966 s |
| `node:test` (`test:legacy`): 8 archivos `test/*.test.js` | **51/51 aprobadas**, 0 fallidas, 0 omitidas, 0 canceladas | 426.43 ms |

Detalle textual: [13_EVIDENCIAS/2026-10-16_resumen_npm_test.md](13_EVIDENCIAS/2026-10-16_resumen_npm_test.md).

### Otras comprobaciones del mismo día

| Comprobación | Resultado |
|---|---|
| `npm audit --omit=dev` | 1 vulnerabilidad alta: `nodemailer` ≤10.0.5 (BUG-006) |
| `npm ls --depth=0` | Versiones listadas en [`../04_DESARROLLO/07_DEPENDENCIAS_Y_VERSIONES.md`](../04_DESARROLLO/07_DEPENDENCIAS_Y_VERSIONES.md) |
| Revisión de los 12 JSON de n8n | Todos `active: false` |

## 2. No ejecutado en esta auditoría

`npm run test:integration` (sin MySQL de pruebas), interfaz jsdom, `npm run medir` (usa base real), pruebas manuales en navegador, SMTP real, importación de workflows n8n, pruebas de seguridad activas.

## 3. Ejecuciones históricas (no reproducidas)

| Fecha | Suite | Resultado | Fuente |
|---|---|---|---|
| 2026-10-13 (commit `07e7e37`) | Jest / node:test / integración / jsdom | 101/101 · 32/32 · 24/24 · 32/32 | [`docs/RESULTADOS_PRUEBAS.md`](../docs/RESULTADOS_PRUEBAS.md) |
| 2026-10-13 (verificación en la compra) | Jest / node:test / integración / jsdom | 106/106 · 42/42 · 48/48 · 43/43 | idem |
| 2026-10-15 | `npm test` (según guía) | Jest 107, node:test 51 | [`docs/REGISTRO_VERIFICADO.md`](../docs/REGISTRO_VERIFICADO.md) §6 |
| 2026-10-15 | `npm run medir` | Ver [07_PRUEBAS_DE_RENDIMIENTO.md](07_PRUEBAS_DE_RENDIMIENTO.md) | idem §5 |

Los conteos del 2026-10-16 coinciden con los declarados el 2026-10-15 (107 y 51) [OBS].

## 4. Plantilla para nuevas ejecuciones

| Campo | Valor |
|---|---|
| ID | EJ-AAAA-MM-DD-NN |
| Fecha / commit / rama | |
| Entorno | |
| Suites o casos | |
| Resultado (aprobados/fallidos/bloqueados) | |
| Defectos nuevos | BUG-… |
| Evidencia | 13_EVIDENCIAS/… |

## Referencias

- [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) · [11_INFORME_DE_CALIDAD.md](11_INFORME_DE_CALIDAD.md)
