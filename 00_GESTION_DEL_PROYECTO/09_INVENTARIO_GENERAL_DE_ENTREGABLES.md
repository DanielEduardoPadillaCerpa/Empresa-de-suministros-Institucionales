# Inventario general de entregables

| Campo | Valor |
|---|---|
| ID documental | DOC-00-09 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Listar todos los entregables del proyecto (software, configuración, automatizaciones, pruebas y documentación) con su ubicación y estado.

## Alcance

Entregables versionados en el repositorio. El inventario archivo por archivo está en [04_DESARROLLO/04](../04_DESARROLLO/04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md). Se excluyen `node_modules/`, archivos locales ignorados por Git (`.env`, respaldos, `backend/storage/`) y el historial Git. Ningún entregable tiene aceptación formal registrada.

## Software

| ID | Entregable | Ubicación | Estado |
|---|---|---|---|
| ENT-01 | Servidor y API REST (17 archivos de rutas, módulos de seguridad, verificación, pagos, correo, automatización) | [backend/src/](../backend/src/), [backend/server.js](../backend/server.js) | Implementado; unitarias aprobadas 2026-10-16 |
| ENT-02 | Interfaz web (21 páginas, 12 scripts, 8 hojas de estilo) | [frontend/](../frontend/) | Implementado; sin pruebas de interfaz reproducidas |
| ENT-03 | Imágenes de catálogo y portada (110 archivos) | [backend/img/](../backend/img/) | Entregado; licencias NO DETERMINADO (algunos nombres indican fuentes externas, p. ej. `*-unsplash.jpg`, `bomberos-dominio-publico.jpg`) |
| ENT-04 | Migraciones versionadas 001–003 | [backend/src/migraciones/](../backend/src/migraciones/) | Implementado; idempotencia verificada parcialmente |
| ENT-05 | SQL manual de la migración 003 | [backend/sql/003_registro_verificado.sql](../backend/sql/003_registro_verificado.sql) | Entregado; no ejecutado en esta auditoría |
| ENT-06 | Scripts operativos (claves, padrón, superadmin, cuentas de prueba, migraciones, medición) | [backend/scripts/](../backend/scripts/) | Implementado; no ejecutados en esta auditoría |
| ENT-07 | Plantilla de configuración | [backend/.env.example](../backend/.env.example) | Entregado (valores de ejemplo, sin secretos reales) |
| ENT-08 | Dependencias declaradas | [backend/package.json](../backend/package.json), `package-lock.json` | Entregado; 1 vulnerabilidad alta (BUG-006) |

## Automatizaciones

| ID | Entregable | Ubicación | Estado |
|---|---|---|---|
| ENT-09 | 12 workflows n8n exportados (W1–W12) | [n8n/workflows/](../n8n/workflows/) | Todos `active: false`; despliegue NO DETERMINADO; W5 y W9 sin uso |
| ENT-10 | Generadores de W11 y W12 | [n8n/generar-w11.js](../n8n/generar-w11.js), [n8n/generar-w12.js](../n8n/generar-w12.js) | Implementado |
| ENT-11 | Docker Compose de n8n 1.110.1 | [n8n/docker-compose.yml](../n8n/docker-compose.yml) | Entregado; no ejecutado en esta auditoría |

## Pruebas

| ID | Entregable | Ubicación | Estado |
|---|---|---|---|
| ENT-12 | Pruebas unitarias Jest (4 suites, 107 pruebas) | [backend/test/](../backend/test/) `*.spec.js` | APROBADAS 2026-10-16 |
| ENT-13 | Pruebas `node:test` (8 archivos, 51 pruebas) | [backend/test/](../backend/test/) `*.test.js` | APROBADAS 2026-10-16 |
| ENT-14 | Pruebas de integración MySQL (48) | [backend/test/integration/](../backend/test/integration/) | NO EJECUTADAS en esta auditoría; evidencia histórica 2026-10-13 |
| ENT-15 | Pruebas de interfaz jsdom (43 verificaciones) | [backend/test/ui/](../backend/test/ui/) | NO EJECUTADAS en esta auditoría; evidencia histórica 2026-10-13 |

## Documentación previa (conservada)

| ID | Entregable | Ubicación | Estado |
|---|---|---|---|
| ENT-16 | README del proyecto y del backend, informe de inspección, guía del asistente | [README.md](../README.md), [backend/README.md](../backend/README.md), [INFORME-INSPECCION.md](../INFORME-INSPECCION.md), [backend/ASISTENTE-CATALOGO.md](../backend/ASISTENTE-CATALOGO.md) | Parcialmente desactualizados (BUG-008) |
| ENT-17 | 27 archivos (25 Markdown, 1 Word, 1 CSV) técnicos, normativos y de mercado | [docs/](../docs/) | Vigentes con salvedades; ver [índice](00_INDICE_DOCUMENTAL.md) |
| ENT-18 | Documento Word de flujos n8n | [docs/Flujos-n8n.docx](../docs/Flujos-n8n.docx) | Entregado |

## Documentación empresarial (2026-10-16)

| ID | Entregable | Ubicación | Estado |
|---|---|---|---|
| ENT-19 | Gestión del proyecto | [00_GESTION_DEL_PROYECTO/](00_INDICE_DOCUMENTAL.md) | BORRADOR |
| ENT-20 | Ingeniería de requerimientos | [01_INGENIERIA_DE_REQUERIMIENTOS/](../01_INGENIERIA_DE_REQUERIMIENTOS/01_DOCUMENTO_DE_VISION_Y_PROPOSITO.md) | BORRADOR |
| ENT-21 | Análisis | [02_ANALISIS/](../02_ANALISIS/01_DOCUMENTO_DE_ANALISIS_DEL_SISTEMA.md) | BORRADOR |
| ENT-22 | Diseño y ADR | [03_DISENO/](../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) | BORRADOR |
| ENT-23 | Desarrollo (guías, inventario, API, BD, integraciones) | [04_DESARROLLO/](../04_DESARROLLO/README.md) | BORRADOR |
| ENT-24 | Pruebas (plan, casos, resultados, evidencias) | [05_PRUEBAS/](../05_PRUEBAS/01_PLAN_DE_PRUEBAS.md) | BORRADOR |
| ENT-25 | Implementación (manuales, despliegue, respaldo, actas) | [06_IMPLEMENTACION/](../06_IMPLEMENTACION/01_PLAN_DE_IMPLEMENTACION.md) | BORRADOR |
| ENT-26 | Mantenimiento y soporte | [07_MANTENIMIENTO_Y_SOPORTE/](../07_MANTENIMIENTO_Y_SOPORTE/01_PLAN_DE_MANTENIMIENTO.md) | BORRADOR |

## Elementos versionados que no son entregables [OBS]

| Archivo | Observación |
|---|---|
| `file.md` (raíz) | Vacío (BUG-009) |
| `backend/scratch_detalle.js` | Archivo de borrador (BUG-009) |
| `backend/probar-mfa-n8n.js` | Prueba manual de W5, flujo ya sin uso (BUG-009) |
| `package-lock.json` (raíz) | 105 bytes, sin dependencias de raíz |

## Elementos locales no versionados (no inspeccionados en su contenido)

`backend/.env`, `n8n/.env`, `respaldos-n8n/`, `.respaldo-pre-verificacion/`, `backend/storage/`, `backend/generarHash.js`, `.aider*`: excluidos por `.gitignore`; pueden contener secretos y no forman parte de la entrega.

## Referencias

- [Inventario de archivos relevantes](../04_DESARROLLO/04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md)
- [Índice documental](00_INDICE_DOCUMENTAL.md)
- [Acta de entrega y recepción](../06_IMPLEMENTACION/15_ACTA_DE_ENTREGA_Y_RECEPCION.md)
