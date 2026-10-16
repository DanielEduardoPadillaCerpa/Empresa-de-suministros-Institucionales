# Base de datos — referencias de desarrollo

| Campo | Valor |
|---|---|
| ID documental | DOC-04-BD-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Material práctico para trabajar con el esquema MySQL: orden real de creación de tablas y consultas de **solo lectura** para comprobar el estado de una base.

## Alcance

| Archivo | Contenido |
|---|---|
| [orden-de-creacion-de-tablas.md](orden-de-creacion-de-tablas.md) | Secuencia en que `migrar()` crea las 34 tablas, con claves foráneas |
| [consultas-de-verificacion-solo-lectura.sql](consultas-de-verificacion-solo-lectura.sql) | `SELECT` de diagnóstico (migraciones, conteos por estado, colas) sin datos personales |

**[OBS]** No se ejecutó ninguna consulta durante la auditoría. El esquema fuente está en `../../backend/src/db.js` y `../../backend/src/migraciones/`. Diseño completo: [../../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md](../../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md).

## Referencias

- [../09_GUIA_DE_BASE_DE_DATOS.md](../09_GUIA_DE_BASE_DE_DATOS.md) · [../Diagramas/mer-resumido.mmd](../Diagramas/mer-resumido.mmd)
