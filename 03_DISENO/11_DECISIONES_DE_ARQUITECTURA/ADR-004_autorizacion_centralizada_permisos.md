# ADR-004: Autorización centralizada con permisos granulares y superadministrador

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-004 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-004, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-005.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** Hallazgos H1–H5 y A6 de `docs/AUDITORIA_TECNICA.md`: la institución se deducía del dominio del correo, el JWT decidía el acceso y cualquier admin tenía todas las facultades.

## Decisión

**[OBS]** `backend/src/autorizacion.js` reconstruye el contexto desde MySQL en cada decisión (`obtenerContexto`) y aplica `evaluarProducto` en listado, detalle, asistente y checkout. 13 permisos de staff en `staff_permisos`; permisos de datos personales nunca implícitos; superadministrador creado solo por comando (`scripts/crear-superadmin.js`).

## Alternativas consideradas

Rol único `admin` con todas las facultades (modelo anterior, reemplazado).

## Consecuencias

- Cambios de estado surten efecto en la siguiente petición.
- Más consultas por petición.
- Las rutas heredadas combinan `requiereAdmin` (rol) y `requierePermiso`.
- Riesgo residual de error humano del revisor (RSK-009).

## Evidencia

- [backend/src/autorizacion.js](../../backend/src/autorizacion.js)
- [backend/src/tenancy.js](../../backend/src/tenancy.js)
- [backend/scripts/crear-superadmin.js](../../backend/scripts/crear-superadmin.js)
- [docs/ARQUITECTURA_OBJETIVO.md](../../docs/ARQUITECTURA_OBJETIVO.md)
- [docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
