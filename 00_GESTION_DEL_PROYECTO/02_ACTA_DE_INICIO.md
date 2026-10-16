# Acta de inicio del proyecto

| Campo | Valor |
|---|---|
| ID documental | DOC-00-02 |
| Versión | 1.0 |
| Estado | PLANTILLA — PENDIENTE DE APROBACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Formalizar el inicio del proyecto: objetivo, alcance, interesados, supuestos y autorización.

## Alcance

**Este documento es una plantilla.** En el repositorio no existe un acta, contrato, cronograma aprobado, presupuesto ni firma. [OBS] El primer commit del sistema actual es del 2026-10-11, lo que indica que el desarrollo comenzó sin un acta registrada en el repositorio. Los campos con evidencia se prellenan; los demás deben diligenciarlos las personas autorizadas. No se inventan personas, fechas de aprobación, firmas ni costos.

## 1. Datos generales

| Campo | Valor |
|---|---|
| Nombre del proyecto | Suite Institucional — Suministros Institucionales |
| Código del proyecto | PENDIENTE |
| Fecha de inicio formal | PENDIENTE (primer commit con evidencia: 2026-10-11) |
| Patrocinador | PENDIENTE DE ASIGNACIÓN |
| Director/gerente del proyecto | PENDIENTE DE ASIGNACIÓN |
| Cliente o entidad beneficiaria | PENDIENTE DE ASIGNACIÓN |

## 2. Justificación (propuesta a partir de la evidencia)

[INF] Las entidades públicas e institucionales necesitan adquirir dotación, equipos de protección, rescate, comunicaciones y papelería con controles que impidan que personas no autorizadas compren o vean productos restringidos. El sistema implementa un canal de venta con verificación de la persona y de su vínculo institucional. Ver [descripción del problema](../02_ANALISIS/02_DESCRIPCION_DEL_PROBLEMA_Y_CONTEXTO.md).

## 3. Objetivo general (propuesto)

[REC] Disponer de una plataforma web de suministros institucionales que solo permita operar a personas verificadas, con trazabilidad de decisiones y protección de datos personales. Detalle en [objetivos y alcance](03_OBJETIVOS_Y_ALCANCE.md).

## 4. Alcance inicial

| Incluido (demostrado en el código) | Excluido o pendiente |
|---|---|
| Registro verificado contra padrón y aprobación humana | Pasarela de pagos real |
| Login con captcha y MFA por correo | Facturación electrónica DIAN (el comprobante es no-DIAN) |
| Catálogo segmentado, carrito, checkout mock, pedidos, comprobantes | Integración con fuentes oficiales reales (Registraduría, SIGEP) |
| Verificación institucional en la compra | Despliegue productivo con HTTPS |
| Paneles administrativos, auditoría, asistente | Validación jurídica |

## 5. Interesados

Ver [interesados y responsabilidades](04_INTERESADOS_Y_RESPONSABILIDADES.md). Nombres: PENDIENTE DE ASIGNACIÓN.

## 6. Supuestos y restricciones conocidos

- Costo cero y entorno de laboratorio [OBS] (`docs/REGISTRO_VERIFICADO.md`).
- Base MySQL gratuita con 5 conexiones por usuario [OBS] (`backend/src/db.js`).
- El padrón de laboratorio sustituye la fuente oficial del Estado [OBS].
- Más en [limitaciones y supuestos](10_LIMITACIONES_Y_SUPUESTOS.md).

## 7. Hitos

| Hito | Fecha | Estado |
|---|---|---|
| Base del sitio (REL-001) | 2026-10-11 [OBS] | Realizado (sin aprobación registrada) |
| Verificación institucional (REL-002, REL-003) | 2026-10-13 [OBS] | Realizado (sin aprobación registrada) |
| Registro verificado (REL-004) | 2026-10-15 [OBS] | Realizado, sin fusionar a `main` |
| Documentación empresarial (REL-005) | 2026-10-16 [OBS] | Generada, pendiente de validación |
| Aprobación para producción | PENDIENTE | — |

## 8. Presupuesto

PENDIENTE. No hay información de costos en el repositorio.

## 9. Riesgos iniciales

Ver [matriz de riesgos](06_MATRIZ_DE_RIESGOS.md) (RSK-001 a RSK-017).

## 10. Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Patrocinador | PENDIENTE | PENDIENTE | PENDIENTE |
| Director del proyecto | PENDIENTE | PENDIENTE | PENDIENTE |
| Responsable técnico | PENDIENTE | PENDIENTE | PENDIENTE |
| Representante del cliente | PENDIENTE | PENDIENTE | PENDIENTE |

## Referencias

- [Ficha general](01_FICHA_GENERAL_DEL_PROYECTO.md)
- [Plan de trabajo y estado actual](05_PLAN_DE_TRABAJO_Y_ESTADO_ACTUAL.md)
- [Acta de entrega y recepción](../06_IMPLEMENTACION/15_ACTA_DE_ENTREGA_Y_RECEPCION.md)
