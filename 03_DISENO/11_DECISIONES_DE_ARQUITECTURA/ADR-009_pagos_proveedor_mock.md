# ADR-009: Pagos con proveedor mock firmado; pasarela real diferida

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-009 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-009, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-008.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** No hay contrato con una pasarela de pago y el entorno es de laboratorio de costo cero.

## Decisión

**[OBS]** `PAYMENT_MODE=mock`: el checkout crea pedido y pago en una transacción; el resultado lo determina el servidor según los centavos del importe y se aplica por un webhook HMAC (`x-payment-signature`, `x-payment-timestamp`, 5 min, dedupe por `evento_id`). `sandbox` y `prod` fallan de forma segura.

## Alternativas consideradas

No documentadas.

## Consecuencias

- Permite probar el ciclo completo sin cobros reales.
- No es apto para operación comercial (REQ-F-040, RSK-015).
- `/api/pagos/dev/simular-webhook` queda habilitado si no se define `NODE_ENV=production` (hallazgo A5 de `docs/AUDITORIA_TECNICA.md`).

## Evidencia

- [backend/src/paymentProvider.js](../../backend/src/paymentProvider.js)
- [backend/src/paymentProviderInstance.js](../../backend/src/paymentProviderInstance.js)
- [backend/src/routes/pagos.js](../../backend/src/routes/pagos.js)
- [backend/src/routes/checkout.js](../../backend/src/routes/checkout.js)
- [backend/README.md](../../backend/README.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
