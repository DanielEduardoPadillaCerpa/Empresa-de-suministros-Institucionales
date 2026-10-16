# Registro de cambios

| Campo | Valor |
|---|---|
| ID documental | DOC-00-08 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar los cambios del sistema agrupados en liberaciones, con la evidencia de Git que los respalda.

## Alcance

[OBS] Fuente: `git log` de la rama `feature/verificacion-seguridad` (23 commits) y [docs/CHANGELOG.md](../docs/CHANGELOG.md), que contiene el detalle funcional de los cambios del 2026-10-13 al 2026-10-15 y no se duplica aquí. Ninguna liberación está etiquetada en Git (BUG-018); los identificadores REL son una reconstrucción. El registro formal de versiones está en [06_IMPLEMENTACION/16](../06_IMPLEMENTACION/16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md).

## Liberaciones reconstruidas

| ID | Fecha | Contenido | Commits | Detalle |
|---|---|---|---|---|
| REL-001 | 2026-10-11 | Página de aterrizaje y tema moderno; base del sitio | `346451d`, `b713660`, `e1769bf`, `81096ea`, `ef10524` | — |
| REL-002 | 2026-10-13 | Verificación institucional de compradores (migración 001): estados, documentos cifrados, elegibilidad M:N, revisión legal, 7 permisos de staff | `aafb011` (punto de recuperación) y cambios integrados en `0f9262a`/`d9775dc`/`9530ce0`/`3df4bff` [INF] | [CHANGELOG — 2026-10-13](../docs/CHANGELOG.md) |
| REL-003 | 2026-10-13 | Registro mínimo y verificación en la compra (migración 002), superadministrador, autorización por compra, W11, cifrado v2 | ídem [INF] | [CHANGELOG — 2026-10-13 (tarde)](../docs/CHANGELOG.md) |
| REL-004 | 2026-10-15 | Registro verificado contra padrón (migración 003), captcha, MFA y comprobantes por nodemailer, panel de solicitudes, W12, responsive, documento de flujos n8n | `b1bab28` … `4742737` | [CHANGELOG — 2026-10-15](../docs/CHANGELOG.md), [docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md) |
| REL-005 | 2026-10-16 | Estructura documental empresarial (carpetas 00–07). Solo documentación; sin cambios de código | (commit de esta entrega) | [Informe final](11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md) |

[INF] Los commits del 2026-10-13 y 2026-10-14 tienen mensajes genéricos ("first commit", "nuevo", "ya estamos terminado", "cambios") y existe una rama `backup-antes-de-cambiar-autor`, lo que indica una reescritura del historial. Por eso la asignación de commits a REL-002/REL-003 no es exacta.

## Historial de commits [OBS]

| Commit | Fecha | Mensaje | REL |
|---|---|---|---|
| `4742737` | 2026-10-15 | Documento explicativo de los flujos de n8n (docs/Flujos-n8n.docx) | REL-004 |
| `b908b7e` | 2026-10-15 | Menú público con sesión de admin: cabe en pantallas anchas sin cambiar el diseño | REL-004 |
| `1b155cb` | 2026-10-15 | Revertir el menú adaptable: el menú vuelve a su diseño original | REL-004 |
| `2c44b40` | 2026-10-15 | Responsive sin barra horizontal y tarjetas de industria con banda superpuesta | REL-004 |
| `08e3053` | 2026-10-15 | Documentación del registro verificado, workflow n8n W12 y ajustes finales | REL-004 |
| `f12c03b` | 2026-10-15 | Aprobar, rechazar y contador en un solo viaje a MySQL; script de medición | REL-004 |
| `0c7c0a6` | 2026-10-15 | Quitar de n8n los correos, códigos y enlaces: envío directo con nodemailer | REL-004 |
| `2ee548f` | 2026-10-15 | Frontend: registro con NIT y captcha, login con captcha y panel de solicitudes | REL-004 |
| `8864ebe` | 2026-10-15 | Pruebas del registro verificado y ajuste de las existentes | REL-004 |
| `6716d38` | 2026-10-15 | Registro verificado con aprobación del admin y login con captcha y MFA | REL-004 |
| `a6f7a8b` | 2026-10-15 | Seguridad: cifrado por campo, padrón cifrado, captcha y migración 003 | REL-004 |
| `b1bab28` | 2026-10-15 | Landing: usar la imagen con todas las instituciones en el banner | REL-004 |
| `5344c58` | 2026-10-14 | first commit | — |
| `3df4bff` | 2026-10-13 | cambios | REL-002/003 |
| `9530ce0` | 2026-10-13 | ya estamos terminado | REL-002/003 |
| `d9775dc` | 2026-10-13 | nuevo | REL-002/003 |
| `0f9262a` | 2026-10-13 | first commit | REL-002/003 |
| `aafb011` | 2026-10-13 | chore: punto de recuperación antes de la verificación en compra | REL-002 |
| `ef10524` | 2026-10-11 | refactor: Refactorizar estilos globales y componentes de la landing. | REL-001 |
| `81096ea` | 2026-10-11 | style: Aplicar imagen de fondo y ajustar estilos del hero | REL-001 |
| `e1769bf` | 2026-10-11 | style: Ajustar opacidad de patrón geométrico en hero del landing | REL-001 |
| `b713660` | 2026-10-11 | style: Implementar nuevo diseño para la página de aterrizaje | REL-001 |
| `346451d` | 2026-10-11 | feat: Agregar página de aterrizaje y tema moderno | REL-001 |

## Cambios de esquema de base de datos

| Migración | Liberación | Efecto | Reversión |
|---|---|---|---|
| Migraciones heredadas en `db.js` | REL-001…004 | Tablas base con `CREATE TABLE IF NOT EXISTS` y `ALTER` tolerantes | No reversibles por comando |
| `001_verificacion_institucional` | REL-002 | Columnas de verificación, 4 tablas, `auditoria.accion` a VARCHAR, permisos a admins existentes | `node scripts/migraciones.js revertir 001_verificacion_institucional --confirmo-perdida-de-datos` |
| `002_verificacion_en_compra` | REL-003 | 5 tablas, columnas de superadmin y vigencia, permisos heredados | ídem con `002_verificacion_en_compra` |
| `003_registro_verificado` | REL-004 | `usuarios.estado_cuenta`, `padron_institucional`, `solicitudes_registro` | ídem con `003_registro_verificado` |

## Procedimiento propuesto para próximos cambios [REC]

1. Una rama por cambio y pull request hacia `main`.
2. Entrada en `docs/CHANGELOG.md` y en este registro con el ID REL.
3. Etiqueta Git `vMAJOR.MINOR.PATCH` alineada con `backend/package.json`.
4. Actualizar la [matriz de trazabilidad](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md) y el [control de cambios de requerimientos](../01_INGENIERIA_DE_REQUERIMIENTOS/12_CONTROL_DE_CAMBIOS_DE_REQUERIMIENTOS.md).

## Referencias

- [docs/CHANGELOG.md](../docs/CHANGELOG.md)
- [Gestión de versiones Git](../04_DESARROLLO/13_GESTION_DE_VERSIONES_GIT.md)
- [Registro de versiones y liberaciones](../06_IMPLEMENTACION/16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md)
