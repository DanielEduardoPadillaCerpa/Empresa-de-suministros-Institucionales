# Informe de calidad

| Campo | Valor |
|---|---|
| ID documental | DOC-05-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Resumir el estado de calidad observable del sistema a partir de las pruebas ejecutadas el 2026-10-16, la inspección de código y la evidencia histórica.

## Alcance

Backend, frontend, base de datos y contratos con n8n del commit `4742737`. **Este informe no declara que el sistema sea seguro, esté certificado ni esté listo para producción.**

## 1. Resumen ejecutivo

- **[OBS]** Las suites unitarias pasan completas: Jest 107/107 y `node:test` 51/51 (2026-10-16).
- **[OBS]** De 69 casos principales, 32 están APROBADOS, 23 BLOQUEADOS (sin MySQL de pruebas, n8n, SMTP o validación jurídica), 11 NO EJECUTADOS y 3 PENDIENTES (funcionalidad no implementada). Ninguno FALLIDO.
- **[OBS]** Las áreas con mejor cobertura ejecutada son registro verificado, MFA, revocación de sesión, Mi cuenta (API), comprobantes, cifrado, firmas hacia n8n y asistente.
- **[OBS]** Las áreas con menor cobertura ejecutada son catálogo por HTTP, checkout, pagos por webhook, pedidos, verificación institucional por HTTP, permisos de staff y reportes: dependen de la suite de integración, que no se pudo ejecutar.
- **[OBS]** 18 defectos/hallazgos abiertos (2 Alta, 8 Media, 7 Baja, 1 Info), entre ellos un endpoint de reportes sin autenticación (BUG-001) y `nodemailer` vulnerable (BUG-006).

## 2. Indicadores

| Indicador | Valor | Fuente |
|---|---|---|
| Pruebas automatizadas ejecutadas hoy | 158 (107 + 51) | [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md) |
| Tasa de aprobación de las ejecutadas | 158/158 | idem |
| REQ-F con al menos un caso APROBADO (total o parcial) | 24 de 40 (20 con caso principal APROBADO y 4 solo con sub-caso APROBADO) | [12_MATRIZ_DE_COBERTURA.md](12_MATRIZ_DE_COBERTURA.md) |
| REQ-NF con caso APROBADO | 8 de 17 | idem |
| Cobertura de código | **No medida** (no hay herramienta configurada) | — |
| Vulnerabilidades de dependencias de producción | 1 alta | `npm audit` 2026-10-16 |
| Defectos abiertos Alta | 2 (BUG-001, BUG-006) | [09_REGISTRO_DE_DEFECTOS.md](09_REGISTRO_DE_DEFECTOS.md) |

## 3. Fortalezas observadas [OBS]

- Las decisiones de acceso se toman en el servidor leyendo MySQL en cada petición; las pruebas verifican la revocación por `session_version`.
- Cifrado por campo con AAD, detección de alteraciones, rotación por versión e índices ciegos HMAC cubiertos por pruebas.
- Los contratos con n8n minimizan datos y se firman; el código de los nodos W8, W11 y W12 se prueba desde el backend.
- Las suites no dependen de servicios externos y son rápidas (≈4,4 s en total).

## 4. Debilidades y riesgos de calidad

| Tema | Detalle | Referencia |
|---|---|---|
| Integración no reproducida | Transacciones, `FOR UPDATE`, migraciones reales y escenarios A–L solo tienen evidencia histórica | [05_PRUEBAS_DE_INTEGRACION.md](05_PRUEBAS_DE_INTEGRACION.md) |
| Interfaz sin pruebas hoy | Pantallas sin verificación en esta corrida; Mi cuenta sin pantalla | BUG-004, BUG-005 |
| Seguridad pendiente | Endpoint público, sesión en `localStorage`, sin TLS/CSP/HSTS, estado en memoria | BUG-001, BUG-010…BUG-012 |
| Dependencias | `nodemailer` vulnerable | BUG-006 |
| Rendimiento | Sin medición reproducida | [07_PRUEBAS_DE_RENDIMIENTO.md](07_PRUEBAS_DE_RENDIMIENTO.md) |
| Cumplimiento | Validación jurídica y borrado por plazos pendientes | TC-117, BUG-015 |
| n8n | Workflows inactivos y no verificados en una instancia | TC-036 |

## 5. Recomendaciones priorizadas [REC]

1. Corregir BUG-001 y añadir su prueba (TC-208).
2. Preparar el MySQL de pruebas y ejecutar `npm run test:integration` y la interfaz jsdom; actualizar el catálogo.
3. Planificar la actualización de `nodemailer` con regresión (BUG-006).
4. Configurar medición de cobertura (por ejemplo `jest --coverage`) sin publicar cifras hasta medirlas.
5. Ejecutar los casos NO EJECUTADOS de seguridad (TC-204, TC-209, TC-210) en local.
6. Definir responsables de calidad y criterios formales de aceptación.

## Referencias

- [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) · [`../00_GESTION_DEL_PROYECTO/11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md`](../00_GESTION_DEL_PROYECTO/11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md)
