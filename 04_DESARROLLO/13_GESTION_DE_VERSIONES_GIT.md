# Gestión de versiones con Git

| Campo | Valor |
|---|---|
| ID documental | DOC-04-13 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir el estado real del control de versiones y proponer un flujo de trabajo ordenado.

## Alcance

**[OBS]** Información obtenida con comandos de solo lectura (`git log`, `git branch`, `git tag`, `git rev-list`) el 2026-10-16. No se modificó el historial.

## 1. Repositorio remoto

`origin` → `https://github.com/DanielEduardoPadillaCerpa/Empresa-de-suministros-Institucionales.git`. La rama `feature/verificacion-seguridad` estaba sincronizada con `origin/feature/verificacion-seguridad` al inicio de la auditoría.

## 2. Ramas

| Rama | Commits | Último commit | Situación [OBS] |
|---|---|---|---|
| `feature/verificacion-seguridad` | 23 | `4742737` (2026-10-15) | Rama de trabajo actual; contiene registro verificado, MFA por nodemailer, migración 003, W12 |
| `main` | 11 | `5344c58` (2026-10-14, "first commit") | Ancestro de la rama de trabajo; **le faltan 12 commits** (BUG-018) |
| `master` | 5 | `ef10524` (2026-10-11) | Rama inicial con la landing; no integrada como principal |
| `backup-antes-de-cambiar-autor` | 7 | `67247fd` (2026-10-13) | Respaldo previo a una reescritura de autoría **[INF]** |

**[OBS]** No existen etiquetas (`git tag` vacío). **[OBS]** El historial registra tres identidades de autor distintas; no se asocian a roles del proyecto (PENDIENTE DE ASIGNACIÓN). La documentación previa menciona una rama `feat/verificacion-en-compra` y el commit `07e7e37`, que hoy solo es alcanzable desde `backup-antes-de-cambiar-autor` **[INF]**.

## 3. Historial resumido (liberaciones reconstruidas)

| REL | Fecha | Commits | Contenido |
|---|---|---|---|
| REL-001 | 2026-10-11 | `346451d` … `ef10524` | Landing y tema moderno |
| REL-002 | 2026-10-13 | `aafb011`, `0f9262a` | Verificación institucional (migración 001) |
| REL-003 | 2026-10-13/14 | `d9775dc`, `9530ce0`, `3df4bff`, `5344c58` | Verificación en la compra (002), superadmin, W11 |

**[INF]** La asignación de commits a REL-002/REL-003 es aproximada: los mensajes de esos commits no describen su contenido; se basa en fechas y en `../docs/CHANGELOG.md`.
| REL-004 | 2026-10-15 | `b1bab28` … `4742737` | Registro verificado (003), captcha, MFA por nodemailer, W12, responsive, Flujos-n8n.docx |
| REL-005 | 2026-10-16 | (pendiente de commit) | Estructura documental empresarial (esta auditoría) |

Mensajes poco descriptivos en commits de 2026-10-13/14 (`nuevo`, `cambios`, `ya estamos terminado`, `first commit` repetido) dificultan la trazabilidad **[OBS]**.

## 4. Archivos que nunca deben versionarse

Según `../.gitignore`: `backend/.env`, `.env`, `backend/.env.respaldo-*`, `node_modules/`, `.respaldo-pre-verificacion/`, `backend/storage/`, `.aider*`, `backend/generarHash.js`, `respaldos-n8n/`. **[OBS]** `n8n/.env` queda ignorado por el patrón `.env` (línea 5), comprobado con `git check-ignore -v n8n/.env`.

## 5. Flujo propuesto [REC]

> Propuesta de la auditoría, no aprobada por el interesado.

1. `main` = versión estable desplegable; protegida en GitHub (revisión obligatoria, sin *push* directo).
2. Ramas cortas `feature/<tema>`, `fix/<BUG-NNN>`, `docs/<tema>` desde `main`; integración por *pull request* con `npm test` en verde.
3. Fusionar `feature/verificacion-seguridad` a `main` tras validar la lista de [../06_IMPLEMENTACION/13_LISTA_DE_VERIFICACION_PREPRODUCCION.md](../06_IMPLEMENTACION/13_LISTA_DE_VERIFICACION_PREPRODUCCION.md).
4. Etiquetar liberaciones con SemVer (`v1.1.0` …) y registrar cada una en [../06_IMPLEMENTACION/16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md](../06_IMPLEMENTACION/16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md); actualizar `version` en `backend/package.json`.
5. Mensajes de commit descriptivos en español que citen IDs (`REQ-F-0NN`, `BUG-0NN`).
6. Decidir el destino de `master` y `backup-antes-de-cambiar-autor` (archivar o eliminar) — decisión del interesado.
7. Activar GitHub Secret Scanning / Dependabot si el plan lo permite (costo cero).

## Referencias

- [12_CONVENCIONES_DE_CODIGO.md](12_CONVENCIONES_DE_CODIGO.md)
- [../00_GESTION_DEL_PROYECTO/08_REGISTRO_DE_CAMBIOS.md](../00_GESTION_DEL_PROYECTO/08_REGISTRO_DE_CAMBIOS.md)
- [../docs/CHANGELOG.md](../docs/CHANGELOG.md)
