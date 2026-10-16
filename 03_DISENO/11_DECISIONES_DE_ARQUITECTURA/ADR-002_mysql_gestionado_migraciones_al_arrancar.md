# ADR-002: MySQL gestionado con migraciones automáticas al arrancar

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-002 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-002, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-002, DIS-011.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** La base de datos es MySQL alojada en Clever Cloud (plan gratuito, máx. 5 conexiones según la documentación previa). Inicialmente el esquema se creaba con `CREATE TABLE IF NOT EXISTS` y `ALTER` tolerantes; el 2026-10-13 se añadió control de versiones del esquema.

## Decisión

**[OBS]** `migrar()` en `backend/src/db.js` aplica en cada arranque el DDL tolerante, siembra datos y ejecuta las migraciones versionadas pendientes (`001`, `002`, `003`) registradas en `schema_migraciones`. La reversión es manual con `node scripts/migraciones.js revertir <versión> --confirmo-perdida-de-datos`. Existe SQL equivalente para la 003 en `backend/sql/`.

## Alternativas consideradas

No documentadas (no hay evidencia de evaluación de herramientas como Knex, Flyway o Liquibase).

## Consecuencias

- No hace falta ejecutar SQL a mano para instalar.
- Riesgo de aplicar migraciones a la base equivocada: ocurrió el 2026-10-13 con `node --watch` contra la base real (RSK-003, `docs/AUDITORIA_TECNICA.md` §7).
- El usuario de base de datos de la aplicación necesita privilegios DDL.
- El DDL de MySQL no es transaccional; cada paso se diseñó idempotente.

## Evidencia

- [backend/src/db.js](../../backend/src/db.js)
- [backend/src/migraciones/index.js](../../backend/src/migraciones/index.js)
- [backend/scripts/migraciones.js](../../backend/scripts/migraciones.js)
- [backend/sql/003_registro_verificado.sql](../../backend/sql/003_registro_verificado.sql)
- [docs/MODELO_DATOS.md](../../docs/MODELO_DATOS.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
