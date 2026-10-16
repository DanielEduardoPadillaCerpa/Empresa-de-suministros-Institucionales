# ADR-010: Captcha propio en memoria en lugar de un servicio gestionado

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-010 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-010, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-004.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Restricción de costo cero y laboratorio sin dominio público ni HTTPS.

## Decisión

**[OBS]** Captcha de suma dibujado con trazos SVG (sin `<text>`), un solo intento, vigencia de 5 min, máximo 5000 retos en un `Map` del proceso.

## Alternativas consideradas

Cloudflare Turnstile (gratuito) mencionado como opción para producción en el propio código y en `docs/REGISTRO_VERIFICADO.md` §8.

## Consecuencias

- Sin dependencia externa.
- No funciona con varias instancias ni sobrevive a reinicios (BUG-010).
- Resistencia limitada frente a OCR dedicado [INF].

## Evidencia

- [backend/src/seguridad/captcha.js](../../backend/src/seguridad/captcha.js)
- [frontend/js/captcha.js](../../frontend/js/captcha.js)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
