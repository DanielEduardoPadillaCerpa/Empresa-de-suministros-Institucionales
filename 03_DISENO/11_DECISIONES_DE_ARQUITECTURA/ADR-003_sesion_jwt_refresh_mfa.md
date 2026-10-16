# ADR-003: Sesión JWT HS256 + refresh rotativo + MFA por correo

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-003 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-003, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-004.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Las cuentas compran suministros institucionales, algunos restringidos. Se requería autenticación fuerte sin servicios de pago y revocación efectiva de sesiones.

## Decisión

**[OBS]** Login en dos pasos: contraseña (bcrypt) + captcha y luego código de 6 dígitos por correo (HMAC con pepper, 5 min, 5 intentos). Tras el MFA se emite un JWT HS256 de 2 h con `uid`, `sv` y `mfa:true`, y un refresh token aleatorio rotativo de 7 días (solo su SHA-256 en BD). `requiereAutenticacion` relee `session_version`, `estado_cuenta` y `rol` de MySQL en cada petición.

## Alternativas consideradas

Sesión en cookie `HttpOnly` mencionada como pendiente en `docs/AUDITORIA_TECNICA.md` §5; no adoptada. Segundo factor distinto del correo (TOTP o llave) mencionado como pendiente en `docs/MODELO_AMENAZAS.md`.

## Consecuencias

- Revocación inmediata pese a la validez del JWT, a costa de una consulta por petición.
- Tokens en `localStorage` expuestos a XSS (BUG-011).
- El código de compra y el MFA comparten el canal del correo.

## Evidencia

- [backend/src/routes/auth.js](../../backend/src/routes/auth.js)
- [backend/src/mfaCodes.js](../../backend/src/mfaCodes.js)
- [backend/src/configSegura.js](../../backend/src/configSegura.js)
- [frontend/js/auth.js](../../frontend/js/auth.js)
- [docs/FLUJO_AUTENTICACION_ACTUAL.md](../../docs/FLUJO_AUTENTICACION_ACTUAL.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
