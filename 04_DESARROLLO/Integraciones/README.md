# Integraciones — fichas técnicas

| Campo | Valor |
|---|---|
| ID documental | DOC-04-INT-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Fichas detalladas de cada integración, empezando por los 12 workflows de n8n.

## Alcance

| Archivo | Contenido |
|---|---|
| [fichas-workflows-n8n.md](fichas-workflows-n8n.md) | Una ficha por workflow W1–W12: propósito, disparador, nodos, entradas, salidas, autenticación, variables, manejo de errores y estado |
| [contratos-eventos-backend-n8n.md](contratos-eventos-backend-n8n.md) | Cabeceras y cuerpos de los eventos firmados entre backend y n8n |

**[OBS]** Fichas elaboradas leyendo `../../n8n/workflows/*.json`, `../../n8n/generar-w11.js`, `../../n8n/generar-w12.js` y el código del backend que los invoca. Ningún workflow se importó ni ejecutó en esta auditoría (REQ-F-036 NO DETERMINADO). Para el documento explicativo previo ver `../../docs/Flujos-n8n.docx`.

## Referencias

- [../10_INTEGRACIONES_Y_AUTOMATIZACIONES.md](../10_INTEGRACIONES_Y_AUTOMATIZACIONES.md) · [../11_VARIABLES_DE_ENTORNO.md](../11_VARIABLES_DE_ENTORNO.md)
- [../../docs/FLUJO_N8N_VERIFICACION.md](../../docs/FLUJO_N8N_VERIFICACION.md)
