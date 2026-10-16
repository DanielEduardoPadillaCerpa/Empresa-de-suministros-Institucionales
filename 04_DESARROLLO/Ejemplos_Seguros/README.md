# Ejemplos seguros de uso de la API

| Campo | Valor |
|---|---|
| ID documental | DOC-04-EJE-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Ejemplos de solicitudes para un entorno **local de desarrollo** que ilustran los contratos de [../08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../08_CONTRATOS_Y_ENDPOINTS_DE_API.md).

## Alcance y reglas

- Todos los datos son **ficticios**: correos en el dominio reservado `.test`, NIT sintético del padrón de laboratorio (prefijo `999`), tokens sustituidos por marcadores `<ACCESS_TOKEN>`, `<CHALLENGE_ID>`, etc.
- **No ejecutados** en la auditoría (no se arrancó el servidor). Los cuerpos y códigos esperados se derivan del código fuente.
- Úselos solo contra `http://localhost:8081` con una base de desarrollo; nunca contra la base de producción.
- No pegue tokens reales en tickets, chats ni capturas.

| Archivo | Contenido |
|---|---|
| [ejemplos-curl.md](ejemplos-curl.md) | Registro, login con MFA, catálogo, checkout, comprobante y endpoints de administración |
| [registro-solicitud.ejemplo.json](registro-solicitud.ejemplo.json) | Cuerpo de ejemplo de `POST /api/auth/registro` |
| [checkout.ejemplo.json](checkout.ejemplo.json) | Cuerpo de ejemplo de `POST /api/checkout` |

> **[INF]** Los nombres exactos de los campos del registro dependen del tipo de institución y se publican en `GET /api/auth/registro/tipos`; consulte esa respuesta y `../../backend/src/registroInstitucional.js` antes de usar el ejemplo.

## Referencias

- [../API/README.md](../API/README.md) · [../06_GUIA_DE_EJECUCION_LOCAL.md](../06_GUIA_DE_EJECUCION_LOCAL.md)
