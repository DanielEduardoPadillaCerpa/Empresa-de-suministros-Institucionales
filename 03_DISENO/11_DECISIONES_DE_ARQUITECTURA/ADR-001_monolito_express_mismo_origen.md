# ADR-001: Monolito Node.js/Express que sirve la API y el frontend desde el mismo origen

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11-ADR-001 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar la decisión de arquitectura ADR-001, reconstruida a partir de la evidencia del repositorio.

## Alcance

Elemento de diseño relacionado: DIS-001.

## Estado de la decisión

**Aceptada (inferida del código) — aprobación formal PENDIENTE.** No existe registro de quién la tomó ni de su aprobación.

## Contexto

**[OBS]** El proyecto se concibió para trabajarse en VS Code sin Java ni Spring Boot (README raíz). INFORME-INSPECCION.md registra la eliminación de un prototipo previo en Java/Spring. Se necesitaba un backend sencillo para un equipo reducido y costo cero.

## Decisión

**[OBS]** Un único proceso Node.js (`backend/server.js`) crea la app de `backend/src/app.js`, monta los routers `/api/*`, sirve `frontend/` y `backend/img/` con `express.static` y ejecuta los trabajos en segundo plano. `/` redirige a `/landing.html`. La misma `crearApp()` se usa en servidor y pruebas.

## Alternativas consideradas

Prototipo previo en Java/Spring Boot, descartado y eliminado según `INFORME-INSPECCION.md`. Otras alternativas: no documentadas.

## Consecuencias

- Despliegue simple y sin CORS entre frontend y API cuando se usa el mismo origen.
- Un fallo del proceso detiene API, estáticos y workers a la vez.
- El estado en memoria (captcha, limitadores) impide escalar horizontalmente (BUG-010).
- El frontend fija `API_BASE` en `http://localhost:8081` (BUG-003), lo que reduce la ventaja del mismo origen.

## Evidencia

- [backend/server.js](../../backend/server.js)
- [backend/src/app.js](../../backend/src/app.js)
- [INFORME-INSPECCION.md](../../INFORME-INSPECCION.md)
- [README.md](../../README.md)

## Referencias

- [README.md](README.md) · [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
