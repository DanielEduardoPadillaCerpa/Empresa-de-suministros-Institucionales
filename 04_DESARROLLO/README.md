# 04_DESARROLLO — Documentación y referencias de desarrollo

| Campo | Valor |
|---|---|
| ID documental | DOC-04-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Reunir la documentación técnica que un desarrollador necesita para entender, instalar, ejecutar, modificar y mantener el código de **Suministros Institucionales** (backend Node.js/Express + MySQL, frontend HTML/Bootstrap, automatizaciones n8n).

## Alcance

**[OBS]** Esta carpeta es **documental**. El código fuente original permanece en su ubicación (`../backend/`, `../frontend/`, `../n8n/`); aquí solo hay descripciones, inventarios, diagramas, plantillas sin valores reales y ejemplos ficticios. Ningún archivo de esta carpeta es cargado por la aplicación.

## Contenido

| Archivo / carpeta | Contenido |
|---|---|
| [01_GUIA_TECNICA_DEL_PROYECTO.md](01_GUIA_TECNICA_DEL_PROYECTO.md) | Visión técnica general, pila, flujo de una petición |
| [02_ESTRUCTURA_REAL_DEL_CODIGO.md](02_ESTRUCTURA_REAL_DEL_CODIGO.md) | Árbol real de carpetas y archivos |
| [03_MODULOS_Y_RESPONSABILIDADES.md](03_MODULOS_Y_RESPONSABILIDADES.md) | Módulos MOD-01…MOD-17 y sus responsabilidades |
| [04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md](04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md) · [.csv](04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.csv) | Inventario técnico de archivos versionados |
| [05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md](05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md) | Requisitos e instalación |
| [06_GUIA_DE_EJECUCION_LOCAL.md](06_GUIA_DE_EJECUCION_LOCAL.md) | Arranque, pruebas y verificación local |
| [07_DEPENDENCIAS_Y_VERSIONES.md](07_DEPENDENCIAS_Y_VERSIONES.md) | Dependencias declaradas e instaladas, auditoría npm |
| [08_CONTRATOS_Y_ENDPOINTS_DE_API.md](08_CONTRATOS_Y_ENDPOINTS_DE_API.md) | Catálogo completo de endpoints |
| [09_GUIA_DE_BASE_DE_DATOS.md](09_GUIA_DE_BASE_DE_DATOS.md) | Tablas, migraciones, reversión |
| [10_INTEGRACIONES_Y_AUTOMATIZACIONES.md](10_INTEGRACIONES_Y_AUTOMATIZACIONES.md) | n8n, SMTP, padrón, pagos mock, jobs |
| [11_VARIABLES_DE_ENTORNO.md](11_VARIABLES_DE_ENTORNO.md) | Variables (sin valores) |
| [12_CONVENCIONES_DE_CODIGO.md](12_CONVENCIONES_DE_CODIGO.md) | Convenciones observadas |
| [13_GESTION_DE_VERSIONES_GIT.md](13_GESTION_DE_VERSIONES_GIT.md) | Ramas, historial, propuesta de flujo |
| [14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md](14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md) | Errores frecuentes y su solución |
| [15_INVENTARIO_DE_SCRIPTS.md](15_INVENTARIO_DE_SCRIPTS.md) | Scripts npm y utilidades, con riesgos |
| [API/](API/README.md) | Fichas por router |
| [Base_de_Datos/](Base_de_Datos/README.md) | Orden de creación de tablas y consultas de solo lectura |
| [Integraciones/](Integraciones/README.md) | Ficha por workflow n8n W1–W12 |
| [Configuracion/](Configuracion/README.md) | Plantilla `.env` documentada sin valores |
| [Scripts_y_Herramientas/](Scripts_y_Herramientas/README.md) | Fichas de scripts |
| [Diagramas/](Diagramas/README.md) | Diagramas Mermaid `.mmd` |
| [Ejemplos_Seguros/](Ejemplos_Seguros/README.md) | Ejemplos de solicitudes con datos ficticios |

## Convenciones de esta documentación

- **[OBS]** hecho observado en archivos o en la ejecución de `npm test` del 2026-10-16; **[INF]** inferencia; **[REC]** recomendación (no solicitada ni aprobada por el cliente).
- Estados según el catálogo: IMPLEMENTADO Y VERIFICADO · IMPLEMENTADO, NO VERIFICADO · PARCIALMENTE IMPLEMENTADO · DOCUMENTADO, NO IMPLEMENTADO · PENDIENTE · NO DETERMINADO · NO APLICA.
- No se incluyen valores de `.env`, contraseñas, tokens, hashes ni cadenas de conexión.

## Referencias

- [../00_GESTION_DEL_PROYECTO/00_INDICE_DOCUMENTAL.md](../00_GESTION_DEL_PROYECTO/00_INDICE_DOCUMENTAL.md)
- [../03_DISENO/08_DISENO_DE_API.md](../03_DISENO/08_DISENO_DE_API.md)
- [../backend/README.md](../backend/README.md) (documentación previa, parcialmente desactualizada: ver BUG-008)
