# ADR-007: Correo directo con nodemailer (W5 y W9 retirados del envío)

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-007 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-007, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-004, DIS-007.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Hasta el 2026-10-14 el código MFA y los comprobantes viajaban por n8n (W5, W9), que recibía correos y códigos. La auditoría del registro verificado lo identificó como exposición innecesaria de datos.

## Decisión

**[OBS]** Desde el 2026-10-15 los códigos MFA, de compra y de cambio de correo, los comprobantes y los avisos de seguridad se envían con nodemailer (`seguridad/correo.js`). Sin SMTP, fuera de producción, se imprime en consola como `[correo-laboratorio]`; en producción sin `SMTP_HOST` el servidor no arranca.

## Alternativas consideradas

Mantener n8n como cartero (diseño anterior, retirado).

## Consecuencias

- n8n ya no recibe códigos ni correos (salvo W11 para avisar al titular, cifrado en el outbox).
- Dependencia de nodemailer 6.10.1, con vulnerabilidades altas (BUG-006).
- W5 y W9 y las variables `N8N_MFA_*`/`N8N_RECEIPT_*` quedan sin uso; la documentación previa aún los describe (BUG-008).

## Evidencia

- [backend/src/seguridad/correo.js](../../backend/src/seguridad/correo.js)
- [backend/src/email.js](../../backend/src/email.js)
- [backend/src/routes/auth.js](../../backend/src/routes/auth.js)
- [docs/CHANGELOG.md](../../docs/CHANGELOG.md)
- [docs/REGISTRO_VERIFICADO.md](../../docs/REGISTRO_VERIFICADO.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
