# Configuración — plantillas sin valores reales

| Campo | Valor |
|---|---|
| ID documental | DOC-04-CFG-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Ofrecer una plantilla comentada de configuración, agrupada por función, que complemente `../../backend/.env.example` sin contener ningún valor real.

## Alcance

| Archivo | Contenido |
|---|---|
| [env.ejemplo.documentado.txt](env.ejemplo.documentado.txt) | Todas las variables del backend y de n8n con marcadores `<definir>`; extensión `.txt` para que ninguna herramienta lo cargue como `.env` |

**Uso:** copiar solo las variables necesarias al `backend/.env` local (no versionado) y reemplazar cada `<definir>` por un valor propio. Para secretos use `npm run claves:generar` o `crypto.randomBytes`. **Nunca** suba un `.env` con valores al repositorio, ni copie valores a esta carpeta.

**[OBS]** La plantilla oficial que lee el equipo sigue siendo `../../backend/.env.example`; si ambas difieren, prevalece el código (`process.env` en `backend/src`).

## Referencias

- [../11_VARIABLES_DE_ENTORNO.md](../11_VARIABLES_DE_ENTORNO.md) · [../../06_IMPLEMENTACION/04_MANUAL_DE_CONFIGURACION.md](../../06_IMPLEMENTACION/04_MANUAL_DE_CONFIGURACION.md)
