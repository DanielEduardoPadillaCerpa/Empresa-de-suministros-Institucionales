# ADR-008: Registro verificado contra padrón cifrado con aprobación humana

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-008 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-008, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-002, DIS-006.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** El interesado pidió que solo personas verificadas tengan cuenta (memoria del proyecto y `docs/REGISTRO_VERIFICADO.md`). En el laboratorio la "base del Estado" la simula una base MySQL de solo lectura.

## Decisión

**[OBS]** El registro compara la terna NIT + nombre + institución contra `padron_institucional` (copia cifrada sincronizada desde la fuente), crea siempre una solicitud `pendiente` con un resultado informativo y responde 202 genérico. Un administrador con `clientes.gestionar` aprueba (con confirmación explícita si no coincide) o rechaza con motivo, de forma atómica.

## Alternativas consideradas

Rechazo automático: descartado (nunca se rechaza automáticamente). Tablas `seg_*` propuestas en el encargo: no usadas; se integró con las tablas existentes (`docs/REGISTRO_VERIFICADO.md` §7).

## Consecuencias

- Ninguna cuenta nueva accede sin revisión humana.
- Carga operativa para el equipo administrador.
- Las cuentas existentes quedaron `activa` al migrar.
- Depende de la calidad y disponibilidad de la fuente del padrón.

## Evidencia

- [backend/src/seguridad/registroVerificado.js](../../backend/src/seguridad/registroVerificado.js)
- [backend/src/seguridad/padron.js](../../backend/src/seguridad/padron.js)
- [backend/src/routes/solicitudesRegistro.js](../../backend/src/routes/solicitudesRegistro.js)
- [backend/src/migraciones/003_registro_verificado.js](../../backend/src/migraciones/003_registro_verificado.js)
- [docs/REGISTRO_VERIFICADO.md](../../docs/REGISTRO_VERIFICADO.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
