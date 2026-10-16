# Registro de decisiones

| Campo | Valor |
|---|---|
| ID documental | DOC-00-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Consolidar las decisiones técnicas tomadas (reconstruidas a partir de la evidencia) y las decisiones de negocio que siguen pendientes.

## Alcance

[OBS] El repositorio no contiene actas de decisión firmadas. Las decisiones de arquitectura se reconstruyen del código, los commits y la documentación previa; su estado es "Aceptada (inferida del código)" y su aprobación formal está PENDIENTE. El detalle (contexto, alternativas, consecuencias) está en [03_DISENO/11_DECISIONES_DE_ARQUITECTURA](../03_DISENO/11_DECISIONES_DE_ARQUITECTURA/README.md).

## Decisiones de arquitectura

| ID | Decisión | Fecha de evidencia | Evidencia principal | Estado |
|---|---|---|---|---|
| ADR-001 | Monolito Node.js/Express que sirve API y frontend estático del mismo origen | 2026-10-11 | `backend/src/app.js` (`express.static`) | Aceptada (inferida) |
| ADR-002 | MySQL gestionado (Clever Cloud) con migraciones automáticas al arrancar | 2026-10-13 | `backend/src/db.js`, `backend/src/migraciones/` | Aceptada (inferida) |
| ADR-003 | JWT HS256 2 h + refresh rotativo 7 días + MFA por correo; estado leído de BD en cada petición | 2026-10-13 / 2026-10-15 | `backend/src/routes/auth.js` | Aceptada (inferida) |
| ADR-004 | Autorización centralizada con permisos granulares y superadministrador | 2026-10-13 | `backend/src/autorizacion.js` | Aceptada (inferida) |
| ADR-005 | Cifrado por campo AES-256-GCM con AAD y versión; índices ciegos HMAC | 2026-10-13 / 2026-10-15 | `backend/src/crypto.js`, `backend/src/seguridad/cifradoCampos.js` | Aceptada (inferida) |
| ADR-006 | n8n solo orquesta y notifica; las decisiones están en el backend; outbox firmado | 2026-10-13 | `backend/src/automationOutbox.js`, `docs/ARQUITECTURA_ACTUAL.md` | Aceptada (inferida) |
| ADR-007 | Correo directo con nodemailer; W5 y W9 dejan de usarse | 2026-10-15 | commit `0c7c0a6`, `backend/src/seguridad/correo.js` | Aceptada (inferida) |
| ADR-008 | Registro verificado contra padrón cifrado con aprobación humana | 2026-10-15 | commits `a6f7a8b`, `6716d38`; `docs/REGISTRO_VERIFICADO.md` | Aceptada (inferida) |
| ADR-009 | Proveedor de pago mock firmado; pasarela real diferida | antes de 2026-10-13 | `backend/src/paymentProvider.js` | Aceptada (inferida) |
| ADR-010 | Captcha propio en memoria (costo cero) | 2026-10-15 | `backend/src/seguridad/captcha.js` | Aceptada (inferida) |
| ADR-011 | Pool de conexiones limitado (3 + 1) por el plan gratuito | 2026-10-15 | `backend/src/db.js` | Aceptada (inferida) |
| ADR-012 | Verificación institucional diferida al momento de la compra | 2026-10-13 | migración `002_verificacion_en_compra` | Aceptada (inferida) |

## Decisiones de diseño documentadas previamente [OBS]

Tomadas durante el desarrollo y registradas en `docs/REGISTRO_VERIFICADO.md` §7; requieren ratificación del interesado:

| Decisión | Fuente |
|---|---|
| El NIT del padrón no es único (varios funcionarios comparten el NIT de su entidad); la unicidad está en el correo | `docs/REGISTRO_VERIFICADO.md` §7 |
| Las cuentas existentes antes de la migración 003 quedan `activa` | ídem |
| Una cuenta rechazada puede volver a solicitar | ídem |
| En laboratorio sin SMTP el correo se imprime en consola (`[correo-laboratorio]`); en producción es error | ídem |
| La firma de W12 no cubre el campo `resultado` | ídem §4 |

## Decisiones pendientes del interesado

| ID | Decisión requerida | Opciones | Impacto | Fuente |
|---|---|---|---|---|
| DEC-P-01 | ¿W11 debe dejar de enviar a n8n el NIT de la entidad? | Mantener (consulta a RUES/CHIP) / eliminar (la verificación de entidad pasa a manual o al padrón) | Verificación en la compra; minimización de datos | BUG-014, `docs/REGISTRO_VERIFICADO.md` §4 |
| DEC-P-02 | Tratamiento de las cuentas heredadas (borrador tras la migración 001; activas tras la 003) | Mantener activas / marcarlas `pendiente` para revisión / aprobar desde el panel / revertir | Acceso de clientes existentes en la base real | `docs/AUDITORIA_TECNICA.md` §7, `docs/REGISTRO_VERIFICADO.md` §7 |
| DEC-P-03 | Fusionar `feature/verificacion-seguridad` en `main` y etiquetar versiones | Pull request con revisión / mantener rama separada | Línea base oficial del código | BUG-018 |
| DEC-P-04 | Validación jurídica (aviso de privacidad, plazos de conservación, régimen de productos restringidos, RNBD) | Contratar/asignar asesoría | Requisito para operar | `docs/TRATAMIENTO_DATOS_PERSONALES.md` |
| DEC-P-05 | Infraestructura de producción (hosting del backend, HTTPS, SMTP, gestor de secretos) | Sin opciones evaluadas en el repositorio | Despliegue | `docs/REGISTRO_VERIFICADO.md` §8 |
| DEC-P-06 | Pasarela de pagos | Sin proveedor seleccionado | REQ-F-040 | `backend/README.md` |
| DEC-P-07 | Actualizar nodemailer a v10 (cambio mayor) | Actualizar con pruebas / reemplazar | BUG-006 | `npm audit` 2026-10-16 |

## Plantilla para nuevas decisiones

| Campo | Valor |
|---|---|
| ID | ADR-0NN o DEC-NN |
| Fecha | AAAA-MM-DD |
| Contexto | |
| Decisión | |
| Alternativas consideradas | |
| Consecuencias | |
| Aprobado por | (nombre y rol) |

## Referencias

- [Decisiones de arquitectura](../03_DISENO/11_DECISIONES_DE_ARQUITECTURA/README.md)
- [Registro de cambios](08_REGISTRO_DE_CAMBIOS.md)
- [docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
