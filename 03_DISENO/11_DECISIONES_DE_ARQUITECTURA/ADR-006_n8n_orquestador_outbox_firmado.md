# ADR-006: n8n solo como orquestador y notificador; outbox firmado con HMAC

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-006 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-006, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-007.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Se necesitaban avisos por correo, resúmenes y tareas programadas sin acoplar el checkout a un servicio externo.

## Decisión

**[OBS]** El backend encola eventos en `automation_outbox` dentro de la misma transacción de negocio y un worker los entrega firmados (HMAC-SHA256, timestamp, ventana de 5 min) a W1, W3, W6, W8 y W11, con reintentos y backoff. n8n llama al backend con tokens propios o HMAC + nonce. Ninguna decisión de autorización se toma en n8n; W11 solo puede escribir el componente `entidad`.

## Alternativas consideradas

No documentadas.

## Consecuencias

- Una caída de n8n no bloquea pagos ni checkout.
- Los 12 workflows del repositorio están `active: false` y su despliegue no se verificó (REQ-F-036, RSK-011).
- Muchos secretos distintos por workflow que gestionar.

## Evidencia

- [backend/src/automationOutbox.js](../../backend/src/automationOutbox.js)
- [backend/src/automationSignatures.js](../../backend/src/automationSignatures.js)
- [backend/src/automationAuth.js](../../backend/src/automationAuth.js)
- [backend/src/seguridad/avisosN8n.js](../../backend/src/seguridad/avisosN8n.js)
- [n8n/workflows/](../../n8n/workflows/)
- [docs/FLUJO_N8N_VERIFICACION.md](../../docs/FLUJO_N8N_VERIFICACION.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
