# Índice documental

| Campo | Valor |
|---|---|
| ID documental | DOC-00-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Punto de entrada a la documentación empresarial del proyecto **Suite Institucional — Suministros Institucionales** (plataforma web de suministros para entidades públicas e institucionales). Lista cada documento con su identificador, versión, estado y responsable, y enlaza la documentación técnica previa que se conserva en su ubicación original.

## Alcance

Cubre las ocho carpetas documentales creadas el 2026-10-16 en la raíz del repositorio y la documentación previa (`README.md`, `INFORME-INSPECCION.md`, `backend/*.md`, `docs/`). No incluye el código fuente, que permanece en `backend/`, `frontend/` y `n8n/` y se inventaría en [04_DESARROLLO](../04_DESARROLLO/README.md).

## Cómo leer esta documentación

| Perfil | Ruta sugerida |
|---|---|
| Nuevo desarrollador | [Ficha general](01_FICHA_GENERAL_DEL_PROYECTO.md) → [Guía técnica](../04_DESARROLLO/01_GUIA_TECNICA_DEL_PROYECTO.md) → [Instalación del entorno](../04_DESARROLLO/05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md) → [Arquitectura actual](../03_DISENO/02_ARQUITECTURA_ACTUAL.md) |
| Auditor técnico / seguridad | [Informe final de auditoría](11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md) → [Diseño de seguridad](../03_DISENO/10_DISENO_DE_SEGURIDAD.md) → [Registro de defectos](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md) → [Matriz de riesgos](06_MATRIZ_DE_RIESGOS.md) |
| Responsable técnico / cliente | [Objetivos y alcance](03_OBJETIVOS_Y_ALCANCE.md) → [Plan y estado actual](05_PLAN_DE_TRABAJO_Y_ESTADO_ACTUAL.md) → [Registro de decisiones](07_REGISTRO_DE_DECISIONES.md) |
| Evaluador académico | [Visión](../01_INGENIERIA_DE_REQUERIMIENTOS/01_DOCUMENTO_DE_VISION_Y_PROPOSITO.md) → [SRS](../01_INGENIERIA_DE_REQUERIMIENTOS/04_ESPECIFICACION_DE_REQUERIMIENTOS_SRS.md) → [Casos de uso](../02_ANALISIS/05_CASOS_DE_USO.md) → [Matriz de trazabilidad](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md) |
| Operación | [Guía de despliegue](../06_IMPLEMENTACION/05_GUIA_DE_DESPLIEGUE.md) → [Respaldo y restauración](../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md) → [Guía de diagnóstico](../07_MANTENIMIENTO_Y_SOPORTE/03_GUIA_DE_DIAGNOSTICO.md) |

## Convenciones

- Etiquetas de afirmaciones: **[OBS]** hecho observado, **[INF]** inferencia, **[REC]** recomendación o mejora propuesta.
- Estados de implementación: IMPLEMENTADO Y VERIFICADO · IMPLEMENTADO, NO VERIFICADO · PARCIALMENTE IMPLEMENTADO · DOCUMENTADO, NO IMPLEMENTADO · PENDIENTE · NO DETERMINADO · NO APLICA. "Verificado" significa cubierto por una prueba ejecutada el 2026-10-16.
- Identificadores: REQ-F, REQ-NF, RN, UC, DIS, TC, BUG, ADR, REL, RSK, MOD, ACT (definidos en los documentos de requerimientos, análisis, diseño y pruebas).
- Ningún documento ha sido aprobado formalmente. Todos están en estado **BORRADOR — PENDIENTE DE VALIDACIÓN**.

## Tabla de control documental

Todos los documentos: versión 1.0 · estado BORRADOR — PENDIENTE DE VALIDACIÓN · actualizado 2026-10-16 · responsable PENDIENTE DE ASIGNACIÓN (salvo nota).

### 00 — Gestión del proyecto

| ID | Documento |
|---|---|
| DOC-00-00 | [Índice documental](00_INDICE_DOCUMENTAL.md) |
| DOC-00-01 | [Ficha general del proyecto](01_FICHA_GENERAL_DEL_PROYECTO.md) |
| DOC-00-02 | [Acta de inicio](02_ACTA_DE_INICIO.md) — plantilla PENDIENTE DE APROBACIÓN |
| DOC-00-03 | [Objetivos y alcance](03_OBJETIVOS_Y_ALCANCE.md) |
| DOC-00-04 | [Interesados y responsabilidades](04_INTERESADOS_Y_RESPONSABILIDADES.md) |
| DOC-00-05 | [Plan de trabajo y estado actual](05_PLAN_DE_TRABAJO_Y_ESTADO_ACTUAL.md) |
| DOC-00-06 | [Matriz de riesgos](06_MATRIZ_DE_RIESGOS.md) |
| DOC-00-07 | [Registro de decisiones](07_REGISTRO_DE_DECISIONES.md) |
| DOC-00-08 | [Registro de cambios](08_REGISTRO_DE_CAMBIOS.md) |
| DOC-00-09 | [Inventario general de entregables](09_INVENTARIO_GENERAL_DE_ENTREGABLES.md) |
| DOC-00-10 | [Limitaciones y supuestos](10_LIMITACIONES_Y_SUPUESTOS.md) |
| DOC-00-11 | [Informe final de auditoría documental](11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md) |

### 01 — Ingeniería de requerimientos

| ID | Documento |
|---|---|
| DOC-01-01 | [Documento de visión y propósito](../01_INGENIERIA_DE_REQUERIMIENTOS/01_DOCUMENTO_DE_VISION_Y_PROPOSITO.md) |
| DOC-01-02 | [Identificación de interesados](../01_INGENIERIA_DE_REQUERIMIENTOS/02_IDENTIFICACION_DE_INTERESADOS.md) |
| DOC-01-03 | [Método de levantamiento de requerimientos](../01_INGENIERIA_DE_REQUERIMIENTOS/03_METODO_DE_LEVANTAMIENTO_DE_REQUERIMIENTOS.md) |
| DOC-01-04 | [Especificación de requerimientos (SRS)](../01_INGENIERIA_DE_REQUERIMIENTOS/04_ESPECIFICACION_DE_REQUERIMIENTOS_SRS.md) |
| DOC-01-05 | [Requerimientos funcionales](../01_INGENIERIA_DE_REQUERIMIENTOS/05_REQUERIMIENTOS_FUNCIONALES.md) |
| DOC-01-06 | [Requerimientos no funcionales](../01_INGENIERIA_DE_REQUERIMIENTOS/06_REQUERIMIENTOS_NO_FUNCIONALES.md) |
| DOC-01-07 | [Reglas de negocio](../01_INGENIERIA_DE_REQUERIMIENTOS/07_REGLAS_DE_NEGOCIO.md) |
| DOC-01-08 | [Historias de usuario](../01_INGENIERIA_DE_REQUERIMIENTOS/08_HISTORIAS_DE_USUARIO.md) |
| DOC-01-09 | [Criterios de aceptación](../01_INGENIERIA_DE_REQUERIMIENTOS/09_CRITERIOS_DE_ACEPTACION.md) |
| DOC-01-10 | [Restricciones y limitaciones](../01_INGENIERIA_DE_REQUERIMIENTOS/10_RESTRICCIONES_Y_LIMITACIONES.md) |
| DOC-01-11 | [Matriz de trazabilidad](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md) |
| DOC-01-12 | [Control de cambios de requerimientos](../01_INGENIERIA_DE_REQUERIMIENTOS/12_CONTROL_DE_CAMBIOS_DE_REQUERIMIENTOS.md) |

### 02 — Análisis

| ID | Documento |
|---|---|
| DOC-02-01 | [Documento de análisis del sistema](../02_ANALISIS/01_DOCUMENTO_DE_ANALISIS_DEL_SISTEMA.md) |
| DOC-02-02 | [Descripción del problema y contexto](../02_ANALISIS/02_DESCRIPCION_DEL_PROBLEMA_Y_CONTEXTO.md) |
| DOC-02-03 | [Procesos del negocio](../02_ANALISIS/03_PROCESOS_DEL_NEGOCIO.md) |
| DOC-02-04 | [Mapa de actores y permisos](../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md) |
| DOC-02-05 | [Casos de uso](../02_ANALISIS/05_CASOS_DE_USO.md) |
| DOC-02-06 | [Especificación de casos de uso](../02_ANALISIS/06_ESPECIFICACION_DE_CASOS_DE_USO.md) |
| DOC-02-07 | [Flujos principales y alternativos](../02_ANALISIS/07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md) |
| DOC-02-08 | [Modelo conceptual de datos](../02_ANALISIS/08_MODELO_CONCEPTUAL_DE_DATOS.md) |
| DOC-02-09 | [Diccionario de datos](../02_ANALISIS/09_DICCIONARIO_DE_DATOS.md) |
| DOC-02-10 | [Análisis de dependencias e integraciones](../02_ANALISIS/10_ANALISIS_DE_DEPENDENCIAS_E_INTEGRACIONES.md) |
| DOC-02-11 | [Análisis de riesgos técnicos](../02_ANALISIS/11_ANALISIS_DE_RIESGOS_TECNICOS.md) |
| DOC-02-12 | [Glosario del negocio](../02_ANALISIS/12_GLOSARIO_DEL_NEGOCIO.md) |

### 03 — Diseño

| ID | Documento |
|---|---|
| DOC-03-01 | [Documento de diseño del software](../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) |
| DOC-03-02 | [Arquitectura actual](../03_DISENO/02_ARQUITECTURA_ACTUAL.md) |
| DOC-03-03 | [Diagrama de componentes](../03_DISENO/03_DIAGRAMA_DE_COMPONENTES.md) |
| DOC-03-04 | [Diagrama de despliegue](../03_DISENO/04_DIAGRAMA_DE_DESPLIEGUE.md) |
| DOC-03-05 | [Diseño de base de datos](../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md) |
| DOC-03-06 | [Modelo entidad-relación](../03_DISENO/06_MODELO_ENTIDAD_RELACION.md) |
| DOC-03-07 | [Diccionario técnico de datos](../03_DISENO/07_DICCIONARIO_TECNICO_DE_DATOS.md) |
| DOC-03-08 | [Diseño de API](../03_DISENO/08_DISENO_DE_API.md) |
| DOC-03-09 | [Diseño de interfaces y navegación](../03_DISENO/09_DISENO_DE_INTERFACES_Y_NAVEGACION.md) |
| DOC-03-10 | [Diseño de seguridad](../03_DISENO/10_DISENO_DE_SEGURIDAD.md) |
| DOC-03-11 | [Decisiones de arquitectura (ADR-001 a ADR-012)](../03_DISENO/11_DECISIONES_DE_ARQUITECTURA/README.md) — un archivo por ADR, IDs DOC-03-11-ADR-001 … DOC-03-11-ADR-012 |
| DOC-03-12 | [Deuda técnica y mejoras propuestas](../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md) |

### 04 — Desarrollo

| ID | Documento |
|---|---|
| DOC-04-00 | [README de desarrollo](../04_DESARROLLO/README.md) |
| DOC-04-01 | [Guía técnica del proyecto](../04_DESARROLLO/01_GUIA_TECNICA_DEL_PROYECTO.md) |
| DOC-04-02 | [Estructura real del código](../04_DESARROLLO/02_ESTRUCTURA_REAL_DEL_CODIGO.md) |
| DOC-04-03 | [Módulos y responsabilidades](../04_DESARROLLO/03_MODULOS_Y_RESPONSABILIDADES.md) |
| DOC-04-04 | [Inventario de archivos relevantes](../04_DESARROLLO/04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md) (+ [CSV](../04_DESARROLLO/04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.csv)) |
| DOC-04-05 | [Guía de instalación del entorno de desarrollo](../04_DESARROLLO/05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md) |
| DOC-04-06 | [Guía de ejecución local](../04_DESARROLLO/06_GUIA_DE_EJECUCION_LOCAL.md) |
| DOC-04-07 | [Dependencias y versiones](../04_DESARROLLO/07_DEPENDENCIAS_Y_VERSIONES.md) |
| DOC-04-08 | [Contratos y endpoints de API](../04_DESARROLLO/08_CONTRATOS_Y_ENDPOINTS_DE_API.md) |
| DOC-04-09 | [Guía de base de datos](../04_DESARROLLO/09_GUIA_DE_BASE_DE_DATOS.md) |
| DOC-04-10 | [Integraciones y automatizaciones](../04_DESARROLLO/10_INTEGRACIONES_Y_AUTOMATIZACIONES.md) |
| DOC-04-11 | [Variables de entorno](../04_DESARROLLO/11_VARIABLES_DE_ENTORNO.md) |
| DOC-04-12 | [Convenciones de código](../04_DESARROLLO/12_CONVENCIONES_DE_CODIGO.md) |
| DOC-04-13 | [Gestión de versiones Git](../04_DESARROLLO/13_GESTION_DE_VERSIONES_GIT.md) |
| DOC-04-14 | [Solución de problemas conocidos](../04_DESARROLLO/14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md) |
| DOC-04-15 | [Inventario de scripts](../04_DESARROLLO/15_INVENTARIO_DE_SCRIPTS.md) |
| DOC-04-API | [API/](../04_DESARROLLO/API/README.md) |
| DOC-04-BD | [Base_de_Datos/](../04_DESARROLLO/Base_de_Datos/README.md) |
| DOC-04-INT | [Integraciones/](../04_DESARROLLO/Integraciones/README.md) |
| DOC-04-CFG | [Configuracion/](../04_DESARROLLO/Configuracion/README.md) |
| DOC-04-SCR | [Scripts_y_Herramientas/](../04_DESARROLLO/Scripts_y_Herramientas/README.md) |
| DOC-04-DIA | [Diagramas/](../04_DESARROLLO/Diagramas/README.md) |
| DOC-04-EJE | [Ejemplos_Seguros/](../04_DESARROLLO/Ejemplos_Seguros/README.md) |

### 05 — Pruebas

| ID | Documento |
|---|---|
| DOC-05-01 | [Plan de pruebas](../05_PRUEBAS/01_PLAN_DE_PRUEBAS.md) |
| DOC-05-02 | [Estrategia y alcance de pruebas](../05_PRUEBAS/02_ESTRATEGIA_Y_ALCANCE_DE_PRUEBAS.md) |
| DOC-05-03 | [Catálogo de casos de prueba](../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md) |
| DOC-05-04 | [Pruebas funcionales](../05_PRUEBAS/04_PRUEBAS_FUNCIONALES.md) |
| DOC-05-05 | [Pruebas de integración](../05_PRUEBAS/05_PRUEBAS_DE_INTEGRACION.md) |
| DOC-05-06 | [Pruebas de seguridad](../05_PRUEBAS/06_PRUEBAS_DE_SEGURIDAD.md) |
| DOC-05-07 | [Pruebas de rendimiento](../05_PRUEBAS/07_PRUEBAS_DE_RENDIMIENTO.md) |
| DOC-05-08 | [Pruebas de regresión](../05_PRUEBAS/08_PRUEBAS_DE_REGRESION.md) |
| DOC-05-09 | [Registro de defectos](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md) |
| DOC-05-10 | [Resultados de ejecución](../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md) |
| DOC-05-11 | [Informe de calidad](../05_PRUEBAS/11_INFORME_DE_CALIDAD.md) |
| DOC-05-12 | [Matriz de cobertura](../05_PRUEBAS/12_MATRIZ_DE_COBERTURA.md) |
| DOC-05-13 | [Evidencias](../05_PRUEBAS/13_EVIDENCIAS/README.md) |

### 06 — Implementación

| ID | Documento |
|---|---|
| DOC-06-01 | [Plan de implementación](../06_IMPLEMENTACION/01_PLAN_DE_IMPLEMENTACION.md) |
| DOC-06-02 | [Requisitos de infraestructura](../06_IMPLEMENTACION/02_REQUISITOS_DE_INFRAESTRUCTURA.md) |
| DOC-06-03 | [Manual de instalación](../06_IMPLEMENTACION/03_MANUAL_DE_INSTALACION.md) |
| DOC-06-04 | [Manual de configuración](../06_IMPLEMENTACION/04_MANUAL_DE_CONFIGURACION.md) |
| DOC-06-05 | [Guía de despliegue](../06_IMPLEMENTACION/05_GUIA_DE_DESPLIEGUE.md) |
| DOC-06-06 | [Configuración de base de datos](../06_IMPLEMENTACION/06_CONFIGURACION_DE_BASE_DE_DATOS.md) |
| DOC-06-07 | [Configuración de integraciones](../06_IMPLEMENTACION/07_CONFIGURACION_DE_INTEGRACIONES.md) |
| DOC-06-08 | [Configuración de seguridad](../06_IMPLEMENTACION/08_CONFIGURACION_DE_SEGURIDAD.md) |
| DOC-06-09 | [Plan de respaldo y restauración](../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md) |
| DOC-06-10 | [Plan de rollback](../06_IMPLEMENTACION/10_PLAN_DE_ROLLBACK.md) |
| DOC-06-11 | [Manual de usuario](../06_IMPLEMENTACION/11_MANUAL_DE_USUARIO.md) |
| DOC-06-12 | [Manual técnico y administrativo](../06_IMPLEMENTACION/12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md) |
| DOC-06-13 | [Lista de verificación preproducción](../06_IMPLEMENTACION/13_LISTA_DE_VERIFICACION_PREPRODUCCION.md) |
| DOC-06-14 | [Procedimiento de puesta en marcha](../06_IMPLEMENTACION/14_PROCEDIMIENTO_DE_PUESTA_EN_MARCHA.md) |
| DOC-06-15 | [Acta de entrega y recepción](../06_IMPLEMENTACION/15_ACTA_DE_ENTREGA_Y_RECEPCION.md) — plantilla PENDIENTE DE APROBACIÓN |
| DOC-06-16 | [Registro de versiones y liberaciones](../06_IMPLEMENTACION/16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md) |

### 07 — Mantenimiento y soporte

| ID | Documento |
|---|---|
| DOC-07-01 | [Plan de mantenimiento](../07_MANTENIMIENTO_Y_SOPORTE/01_PLAN_DE_MANTENIMIENTO.md) |
| DOC-07-02 | [Procedimiento de gestión de incidentes](../07_MANTENIMIENTO_Y_SOPORTE/02_PROCEDIMIENTO_DE_GESTION_DE_INCIDENTES.md) |
| DOC-07-03 | [Guía de diagnóstico](../07_MANTENIMIENTO_Y_SOPORTE/03_GUIA_DE_DIAGNOSTICO.md) |
| DOC-07-04 | [Procedimiento de actualización](../07_MANTENIMIENTO_Y_SOPORTE/04_PROCEDIMIENTO_DE_ACTUALIZACION.md) |
| DOC-07-05 | [Gestión de dependencias](../07_MANTENIMIENTO_Y_SOPORTE/05_GESTION_DE_DEPENDENCIAS.md) |
| DOC-07-06 | [Respaldo y recuperación](../07_MANTENIMIENTO_Y_SOPORTE/06_RESPALDO_Y_RECUPERACION.md) |
| DOC-07-07 | [Registro de problemas conocidos](../07_MANTENIMIENTO_Y_SOPORTE/07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md) |
| DOC-07-08 | [Plan de continuidad](../07_MANTENIMIENTO_Y_SOPORTE/08_PLAN_DE_CONTINUIDAD.md) |

## Documentación previa conservada (no movida ni editada)

[OBS] Estos documentos existían antes del 2026-10-16. Se conservan en su ubicación y son fuente de evidencia. Algunos contienen afirmaciones desactualizadas (ver BUG-008 en el [registro de defectos](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)).

| Documento | Contenido | Observación |
|---|---|---|
| [README.md](../README.md) | Presentación, ejecución y secciones de verificación (2026-10-13) y registro verificado (2026-10-15) | Encabezados residuales y título "comisaría policial" (BUG-008) |
| [INFORME-INSPECCION.md](../INFORME-INSPECCION.md) | Primera inspección: 20 defectos corregidos | Histórico; anterior a las migraciones 001–003 |
| [backend/README.md](../backend/README.md) | Instalación, endpoints, n8n, checkout, comprobantes | Describe MFA y comprobantes vía n8n W5/W9 (hoy nodemailer) |
| [backend/ASISTENTE-CATALOGO.md](../backend/ASISTENTE-CATALOGO.md) | Asistente de catálogo | — |
| [docs/ARQUITECTURA_ACTUAL.md](../docs/ARQUITECTURA_ACTUAL.md) | Arquitectura antes de la verificación en la compra | Histórico (2026-10-13) |
| [docs/ARQUITECTURA_OBJETIVO.md](../docs/ARQUITECTURA_OBJETIVO.md) | Verificación institucional y autorización de compra | — |
| [docs/ARQUITECTURA_VERIFICACION.md](../docs/ARQUITECTURA_VERIFICACION.md) | Verificación en la compra, criptografía | — |
| [docs/AUDITORIA_TECNICA.md](../docs/AUDITORIA_TECNICA.md) | Auditorías del 2026-10-13 e incidente de migración | Cita `src/mfaCourier.js`, inexistente |
| [docs/CHANGELOG.md](../docs/CHANGELOG.md) | Cambios 2026-10-13 a 2026-10-15 | — |
| [docs/FLUJO_AUTENTICACION_ACTUAL.md](../docs/FLUJO_AUTENTICACION_ACTUAL.md) | Autenticación al 2026-10-13 | Histórico; cita `mfaCourier.js` |
| [docs/FLUJO_N8N_VERIFICACION.md](../docs/FLUJO_N8N_VERIFICACION.md) | Workflow W11 | — |
| [docs/Flujos-n8n.docx](../docs/Flujos-n8n.docx) | Explicación de los flujos n8n | Formato Word |
| [docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md) | Instalación, migraciones 001/002, reversión | — |
| [docs/INVENTARIO_FUNCIONALIDADES.md](../docs/INVENTARIO_FUNCIONALIDADES.md) | Inventario al 2026-10-13 | Histórico |
| [docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md](../docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md) | Elegibilidad de productos | — |
| [docs/MATRIZ_FALSOS_POSITIVOS_NEGATIVOS.md](../docs/MATRIZ_FALSOS_POSITIVOS_NEGATIVOS.md) | FP/FN de la verificación | — |
| [docs/MATRIZ_NORMATIVA_COLOMBIA.md](../docs/MATRIZ_NORMATIVA_COLOMBIA.md) | Normativa aplicable | Requiere validación jurídica |
| [docs/MODELO_AMENAZAS.md](../docs/MODELO_AMENAZAS.md) | Modelo de amenazas | — |
| [docs/MODELO_DATOS.md](../docs/MODELO_DATOS.md) | Cambios de la migración 001 | — |
| [docs/PLAN_PRUEBAS.md](../docs/PLAN_PRUEBAS.md) | Suites y escenarios A–L, criterios 1–20 | — |
| [docs/POLITICA_VERIFICACION_IDENTIDAD.md](../docs/POLITICA_VERIFICACION_IDENTIDAD.md) | Política de verificación | — |
| [docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md) | Registro verificado, padrón, MFA, rendimiento | Fuente principal de REL-004 |
| [docs/RESULTADOS_PRUEBAS.md](../docs/RESULTADOS_PRUEBAS.md) | Corridas del 2026-10-13 | Evidencia histórica no reproducida |
| [docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md) | Superadmin y cuentas sintéticas | — |
| [docs/TRATAMIENTO_DATOS_PERSONALES.md](../docs/TRATAMIENTO_DATOS_PERSONALES.md) | Ley 1581 | Requiere revisión jurídica |
| [docs/VARIABLES_ENTORNO.md](../docs/VARIABLES_ENTORNO.md) | Variables de entorno | Parcialmente desactualizado (BUG-008) |
| [docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md](../docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md) | Viabilidad de fuentes oficiales | — |
| [docs/arquitectura-multitenant.md](../docs/arquitectura-multitenant.md) | Segmentación por institución | Describe asignación por dominio, sustituida por verificación (migración 001) |
| [docs/catalogos-institucionales.md](../docs/catalogos-institucionales.md) y [CSV](../docs/catalogo-institucionales-referencias.csv) | Referencias de catálogo por institución | — |
| [docs/inteligencia-mercado-b2g-colombia.md](../docs/inteligencia-mercado-b2g-colombia.md) | Análisis de mercado B2G | No técnico |

## Referencias

- [Ficha general](01_FICHA_GENERAL_DEL_PROYECTO.md)
- [Inventario general de entregables](09_INVENTARIO_GENERAL_DE_ENTREGABLES.md)
