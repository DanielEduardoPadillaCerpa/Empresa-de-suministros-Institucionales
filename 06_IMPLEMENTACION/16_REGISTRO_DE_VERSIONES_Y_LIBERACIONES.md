# Registro de versiones y liberaciones

| Campo | Valor |
|---|---|
| ID documental | DOC-06-16 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar las liberaciones del sistema y servir de plantilla para las siguientes.

## Alcance

**[OBS]** No existen etiquetas de versión en Git ni registro de despliegues; `package.json` declara `1.0.0` sin cambios. Las liberaciones REL-001 a REL-005 se **reconstruyeron** a partir del historial Git y de [../docs/CHANGELOG.md](../docs/CHANGELOG.md); ninguna se desplegó formalmente con evidencia.

## Liberaciones reconstruidas

| ID | Fecha | Contenido | Migración | Rama / commits | Desplegada | Pruebas registradas |
|---|---|---|---|---|---|---|
| REL-001 | 2026-10-11 | Base del sitio y página de aterrizaje | — (DDL tolerante de `db.js`) | commits `346451d` … `0f9262a` | NO DETERMINADO | Ninguna |
| REL-002 | 2026-10-13 | Verificación institucional de compradores: estados, documentos cifrados, elegibilidad M:N, revisión legal, 7 permisos de staff | `001_verificacion_institucional` | historial Git 2026-10-13 | La migración se aplicó a la base de Clever Cloud de forma accidental (docs/AUDITORIA_TECNICA §7) | Históricas: Jest 101, node:test 32, integración 24, jsdom 32 |
| REL-003 | 2026-10-13 | Registro mínimo y verificación en la compra: doble comprobación, autorización por compra, superadministrador, cuentas de prueba, cifrado v2, W11 | `002_verificacion_en_compra` | historial Git 2026-10-13 | NO DETERMINADO | Históricas: Jest 106, node:test 42, integración 48, jsdom 43 |
| REL-004 | 2026-10-15 | Registro verificado contra padrón cifrado, aprobación del administrador, captcha, MFA por nodemailer, W12, ajustes responsive, `docs/Flujos-n8n.docx` | `003_registro_verificado` | `feature/verificacion-seguridad` hasta `4742737`, **sin fusionar a main** | NO DETERMINADO (laboratorio) | Históricas: Jest 107, node:test 51; mediciones de tiempo 2026-10-15 |
| REL-005 | 2026-10-16 | Estructura documental empresarial (`00_`…`07_`); sin cambios de código | — | Pendiente de commit | NO APLICA | `npm test` 2026-10-16: Jest 107/107, node:test 51/51 |

## Plantilla para nuevas liberaciones

| Campo | Valor |
|---|---|
| ID | REL-0NN |
| Versión semántica / etiqueta Git | |
| Fecha | |
| Commit | |
| Cambios (enlace a CHANGELOG) | |
| Migraciones nuevas | |
| Variables de entorno nuevas o cambiadas | |
| Resultado de pruebas (suites y conteos) | |
| Entorno y fecha de despliegue | |
| Respaldo previo (identificador) | |
| Rollback probado (S/N) | |
| Aprobó | PENDIENTE DE ASIGNACIÓN |

## Recomendaciones [REC]

- Adoptar versionado semántico y etiquetar en Git cada liberación (`git tag -a vX.Y.Z`), empezando por la fusión de REL-004 en `main` (BUG-018).
- Actualizar `package.json` en cada liberación.
- Mantener `docs/CHANGELOG.md` como fuente de cambios y este registro como fuente de despliegues.

## Referencias

- [../docs/CHANGELOG.md](../docs/CHANGELOG.md)
- [../00_GESTION_DEL_PROYECTO/08_REGISTRO_DE_CAMBIOS.md](../00_GESTION_DEL_PROYECTO/08_REGISTRO_DE_CAMBIOS.md)
- [../04_DESARROLLO/13_GESTION_DE_VERSIONES_GIT.md](../04_DESARROLLO/13_GESTION_DE_VERSIONES_GIT.md)
