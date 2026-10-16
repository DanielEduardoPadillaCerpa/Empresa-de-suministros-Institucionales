# ADR-011: Pool de conexiones limitado (3 + 1 transaccional)

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-011 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-011, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-002.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** El plan gratuito de MySQL en Clever Cloud permite 5 conexiones por usuario; la latencia medida desde el laboratorio es ~150 ms por viaje.

## Decisión

**[OBS]** Pool principal de `DB_CONNECTION_LIMIT` acotado a máx. 4 (3 por defecto) y un pool de 1 conexión con `multipleStatements` para lotes `START TRANSACTION … COMMIT` de un solo viaje (registro, login, aprobación).

## Alternativas consideradas

No documentadas.

## Consecuencias

- Evita agotar el cupo de conexiones.
- Scripts que abren conexiones mientras el servidor corre pueden agotar el límite (RSK-004).
- `multipleStatements` exige sentencias fijas y valores siempre parametrizados.

## Evidencia

- [backend/src/db.js](../../backend/src/db.js)
- [backend/src/seguridad/registroVerificado.js](../../backend/src/seguridad/registroVerificado.js)
- [docs/REGISTRO_VERIFICADO.md](../../docs/REGISTRO_VERIFICADO.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
