# Método de levantamiento de requerimientos

| Campo | Valor |
|---|---|
| ID documental | DOC-01-03 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Explicar cómo se obtuvieron los requerimientos documentados en esta carpeta y qué grado de confianza tiene cada uno.

## Alcance

Levantamiento realizado el 2026-10-16 sobre el repositorio local. **No se realizaron entrevistas, encuestas, talleres ni validaciones con usuarios o clientes**; tampoco existe en el repositorio evidencia de que se hayan hecho.

## 1. Técnica: ingeniería inversa documental y de código

| Paso | Actividad | Fuentes |
|---|---|---|
| 1 | Inventario del repositorio (`git ls-files`, ~271 archivos sin imágenes) | Árbol del repositorio |
| 2 | Lectura de documentación previa | `../README.md`, `../INFORME-INSPECCION.md`, `../backend/README.md`, `../docs/*.md` |
| 3 | Lectura del código: rutas, middleware, servicios, esquema | `../backend/src/app.js`, `../backend/src/routes/*.js`, `../backend/src/db.js`, `../backend/src/migraciones/*.js` |
| 4 | Cruce frontend ↔ API (llamadas `/api/...` en HTML y JS) | `../frontend/*.html`, `../frontend/js/*.js` |
| 5 | Lectura de pruebas automatizadas como especificación ejecutable | `../backend/test/*.js` |
| 6 | Ejecución de `npm test` (base simulada, sin red ni MySQL) el 2026-10-16: Jest 107/107, node:test 51/51 | Salida de consola |
| 7 | Revisión de workflows n8n exportados (todos `active: false`) | `../n8n/workflows/*.json` |
| 8 | Clasificación del origen y del estado de cada requerimiento | Este documento |

## 2. Clasificación del origen

Cada requerimiento indica uno o varios orígenes:

| Código | Origen | Significado |
|---|---|---|
| O1 | Comportamiento existente | Se observa en el código actual |
| O2 | Requerimiento explícito documentado | Aparece como objetivo o decisión en un documento previo de `../docs/` (se cita) |
| O3 | Inferido de la implementación | Se deduce del código, sin documento que lo pida |
| O4 | Mejora propuesta | Recomendación de esta auditoría; **no** solicitada ni aprobada por el cliente |

Los documentos previos de `../docs/` son a su vez redacciones del equipo de desarrollo; en ellos se mencionan "el prompt" y "lo que pediste" (por ejemplo `../docs/REGISTRO_VERIFICADO.md` §7), lo que indica instrucciones del interesado, pero el texto original de esas instrucciones **no está en el repositorio** (NO DETERMINADO).

## 3. Clasificación del estado

Se usan los estados del catálogo: IMPLEMENTADO Y VERIFICADO (solo si lo cubre una prueba ejecutada el 2026-10-16), IMPLEMENTADO, NO VERIFICADO (incluye lo probado solo en corridas históricas), PARCIALMENTE IMPLEMENTADO, DOCUMENTADO, NO IMPLEMENTADO, PENDIENTE, NO DETERMINADO, NO APLICA.

## 4. Priorización

La prioridad (Alta/Media/Baja) es **[INF]**: se asignó según impacto en seguridad, cumplimiento y flujo principal de compra. No existe priorización aprobada por el negocio.

## 5. Limitaciones del método

- Sin acceso a la base real, a la instancia de n8n ni a SMTP: los comportamientos dependientes no se observaron en ejecución.
- Las pruebas de integración (MySQL Docker) y de interfaz (jsdom) no se ejecutaron.
- La intención del negocio se infiere; puede diferir de la real.

## 6. Validación pendiente [REC]

1. Revisar con el dueño del producto (INT-01) la lista de REQ-F y su prioridad.
2. Revisar con jurídica (INT-03) REQ-NF-017 y RN-007 a RN-012.
3. Registrar las decisiones en [12_CONTROL_DE_CAMBIOS_DE_REQUERIMIENTOS.md](12_CONTROL_DE_CAMBIOS_DE_REQUERIMIENTOS.md).

## Referencias

- [../00_GESTION_DEL_PROYECTO/10_LIMITACIONES_Y_SUPUESTOS.md](../00_GESTION_DEL_PROYECTO/10_LIMITACIONES_Y_SUPUESTOS.md)
- [../docs/CHANGELOG.md](../docs/CHANGELOG.md)
