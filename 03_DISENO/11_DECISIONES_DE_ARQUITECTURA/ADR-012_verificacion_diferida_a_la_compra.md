# ADR-012: Verificación institucional diferida al momento de la compra

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-012 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-012, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-005, DIS-006.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Hallazgos A8 y A9 (2026-10-13): el registro exigía 12 o más datos y ninguna cuenta sin verificar podía comprar, contra el principio de minimización.

## Decisión

**[OBS]** Migración `002_verificacion_en_compra`: la cuenta activa compra productos de uso general; la verificación (documentos, identificador cifrado, doble comprobación con cuatro ojos, entidad en datos.gov.co vía W11) se exige solo para restringidos y vence a 365 días; cada compra restringida requiere una autorización de un solo uso ligada al carrito.

## Alternativas consideradas

Verificación obligatoria para toda compra (modelo de la migración 001, reemplazado).

## Consecuencias

- Menos datos al registrarse.
- Mayor complejidad (tabla de decisión, autorizaciones, mantenimiento).
- Desde el 2026-10-15 el registro verificado añade además la aprobación humana previa al acceso (ADR-008).

## Evidencia

- [backend/src/migraciones/002_verificacion_en_compra.js](../../backend/src/migraciones/002_verificacion_en_compra.js)
- [backend/src/verificacionCompra.js](../../backend/src/verificacionCompra.js)
- [backend/src/routes/verificacion.js](../../backend/src/routes/verificacion.js)
- [docs/ARQUITECTURA_VERIFICACION.md](../../docs/ARQUITECTURA_VERIFICACION.md)
- [docs/POLITICA_VERIFICACION_IDENTIDAD.md](../../docs/POLITICA_VERIFICACION_IDENTIDAD.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
