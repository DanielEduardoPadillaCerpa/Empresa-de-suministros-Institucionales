# Diagramas de desarrollo (Mermaid)

| Campo | Valor |
|---|---|
| ID documental | DOC-04-DIA-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Diagramas fuente en formato Mermaid (`.mmd`), editables y versionables, coherentes con el código inspeccionado.

## Alcance

| Archivo | Tipo | Representa |
|---|---|---|
| [componentes.mmd](componentes.mmd) | flowchart | Componentes del navegador, del backend y externos |
| [despliegue.mmd](despliegue.mmd) | flowchart | Despliegue de laboratorio observado (backend local, MySQL Clever Cloud, n8n/Mailpit en Docker) |
| [mer-resumido.mmd](mer-resumido.mmd) | erDiagram | Relaciones por clave foránea de las tablas principales |
| [secuencia-login.mmd](secuencia-login.mmd) | sequenceDiagram | Login con captcha, verificación de estado y MFA |

**Visualización:** GitHub renderiza Mermaid dentro de bloques ```mermaid en Markdown; para los `.mmd` use [Mermaid Live Editor](https://mermaid.live) o la extensión de VS Code. **[OBS]** No se renderizaron en la auditoría (sin dependencias nuevas); la sintaxis se limitó a construcciones estándar.

**[OBS]** El despliegue representa el laboratorio descrito en la documentación previa; no existe evidencia de un entorno productivo (NO DETERMINADO).

## Referencias

- [../../03_DISENO/03_DIAGRAMA_DE_COMPONENTES.md](../../03_DISENO/03_DIAGRAMA_DE_COMPONENTES.md) · [../../03_DISENO/04_DIAGRAMA_DE_DESPLIEGUE.md](../../03_DISENO/04_DIAGRAMA_DE_DESPLIEGUE.md) · [../../03_DISENO/06_MODELO_ENTIDAD_RELACION.md](../../03_DISENO/06_MODELO_ENTIDAD_RELACION.md)
