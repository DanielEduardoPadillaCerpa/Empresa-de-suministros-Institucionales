# Estrategia y alcance de pruebas

| Campo | Valor |
|---|---|
| ID documental | DOC-05-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Explicar cómo se decide qué probar, con qué técnica y con qué prioridad, y cómo se clasifica el estado de cada caso.

## Alcance

Aplica a todos los casos de [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) (TC-001…TC-040, TC-101…TC-117, TC-201…TC-212).

## 1. Enfoque basado en riesgo

Prioridad de prueba [INF], derivada de la naturaleza del sistema (venta a entidades públicas, productos restringidos, datos personales):

| Prioridad | Áreas | Motivo |
|---|---|---|
| 1 — Crítica | Registro verificado, autenticación MFA, autorización y visibilidad del catálogo, autorización de compra de restringidos, cifrado | Un fallo permite suplantación o venta indebida (RSK-009, RSK-006) |
| 2 — Alta | Checkout, pagos mock, expiración de reservas, comprobantes, permisos de staff | Integridad del dinero, del inventario y de las decisiones administrativas |
| 3 — Media | Mi cuenta, clientes, pedidos, auditoría, automatizaciones n8n | Gestión y trazabilidad |
| 4 — Baja | Asistente, reportes, i18n, landing, normatividad | Información y experiencia |

## 2. Técnicas

| Técnica | Dónde se aplica | Evidencia actual |
|---|---|---|
| Pruebas unitarias con dobles de prueba (base simulada, `nodemailer` simulado) | Reglas, cifrado, firmas, flujos HTTP con supertest | Suites Jest y `node:test` (ejecutadas 2026-10-16) |
| Integración con MySQL real | Transacciones `FOR UPDATE`, migraciones, escenarios A–L y criterios 1–20 | `backend/test/integration/*` (histórico 2026-10-13) |
| Interfaz con jsdom | Registro, Mi verificación, panel, catálogo, cambio de contraseña | `backend/test/ui/*` (histórico 2026-10-13) |
| Pruebas negativas y de abuso | Firmas inválidas, códigos reutilizados, campos ajenos, límites de tasa | Incluidas en las suites unitarias |
| Revisión estática de código | Rutas sin autenticación, valores fijos, dependencias | Esta auditoría (BUG-001…BUG-018) |
| Medición de tiempos | Registro, login, aprobar/rechazar | `scripts/medir-rendimiento.js` (histórico 2026-10-15) |
| Pruebas manuales exploratorias | Navegador, correo real, n8n | No ejecutadas |

## 3. Clasificación del estado de un caso

| Estado | Regla aplicada en esta auditoría |
|---|---|
| APROBADO | Existe una prueba automatizada que cubre el resultado esperado y **pasó en la corrida del 2026-10-16** |
| FALLIDO | Se ejecutó y no cumplió el resultado esperado (ninguno hoy) |
| NO EJECUTADO | Existe una forma de probarlo sin infraestructura especial (p. ej. manual en navegador local), pero no se hizo |
| BLOQUEADO | Requiere MySQL de pruebas, SMTP, n8n o credenciales que no estaban disponibles |
| PENDIENTE | La funcionalidad no está implementada (TC-040, TC-115, TC-116) |
| NO APLICA | No corresponde al alcance |

Un resultado histórico (por ejemplo, integración 48/48 del 2026-10-13 en [`docs/RESULTADOS_PRUEBAS.md`](../docs/RESULTADOS_PRUEBAS.md)) **no** convierte un caso en APROBADO: se anota como "evidencia histórica no reproducida".

## 4. Datos de prueba

- Solo datos sintéticos: correos con dominio reservado `.test` (por ejemplo `@suministros-prueba.test`, `@prueba.test`), NIT con prefijo `999`, nombres ficticios (p. ej. "Juan Camilo Rodríguez" de la guía [`docs/REGISTRO_VERIFICADO.md`](../docs/REGISTRO_VERIFICADO.md)).
- Nunca datos personales reales, ni la base de Clever Cloud para pruebas que escriban.
- Claves y secretos de prueba generados al vuelo por las propias suites (`crypto.randomBytes`), nunca los del `.env`.

## 5. Fuera de alcance

- Pruebas contra servicios externos (datos.gov.co, SMTP real, Clever Cloud) y ataques reales.
- Cobertura de código: **no se midió** (no hay configuración de cobertura en `package.json`); no se reportan porcentajes.

## Referencias

- [01_PLAN_DE_PRUEBAS.md](01_PLAN_DE_PRUEBAS.md) · [06_PRUEBAS_DE_SEGURIDAD.md](06_PRUEBAS_DE_SEGURIDAD.md) · [`../00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md`](../00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md)
