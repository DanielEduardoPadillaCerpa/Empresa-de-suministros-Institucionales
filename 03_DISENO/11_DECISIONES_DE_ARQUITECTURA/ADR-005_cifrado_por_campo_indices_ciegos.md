# ADR-005: Cifrado por campo AES-256-GCM e índices ciegos HMAC

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-005 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-005, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-006.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Se tratan datos personales (Ley 1581/2012), documentos de identidad y un padrón institucional. El hallazgo A1 (2026-10-13) señaló que la clave heredada `CRYPTO_KEY` se derivaba de un texto.

## Decisión

**[OBS]** Tres mecanismos: (1) `src/crypto.js` con clave heredada y anillo versionado `CRYPTO_KEYS` (formato `v2`); (2) `src/seguridad/cifradoCampos.js` con `ENC_KEY` versionada y AAD igual al nombre del campo (padrón y solicitudes de registro); (3) índices ciegos HMAC-SHA256 con claves independientes (`HMAC_KEY`, `IDENT_HMAC_KEY`). Las claves viven solo en variables de entorno y el arranque falla si faltan o son inválidas.

## Alternativas consideradas

SHA-256 simple para el índice del documento: descartado porque permitiría enumerar cédulas (`docs/ARQUITECTURA_VERIFICACION.md` §5).

## Consecuencias

- Un volcado de la base no revela los datos sin las claves.
- Pérdida de claves = datos irrecuperables (RSK-001).
- Coexisten dos esquemas de cifrado; los datos heredados siguen con la clave débil hasta un recifrado no implementado (BUG-013).
- Búsquedas solo por igualdad sobre datos cifrados.

## Evidencia

- [backend/src/crypto.js](../../backend/src/crypto.js)
- [backend/src/seguridad/cifradoCampos.js](../../backend/src/seguridad/cifradoCampos.js)
- [backend/scripts/generar-claves.js](../../backend/scripts/generar-claves.js)
- [docs/ARQUITECTURA_VERIFICACION.md](../../docs/ARQUITECTURA_VERIFICACION.md)
- [docs/REGISTRO_VERIFICADO.md](../../docs/REGISTRO_VERIFICADO.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
