# Limitaciones y supuestos

| Campo | Valor |
|---|---|
| ID documental | DOC-00-10 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Declarar las limitaciones del sistema y de esta auditoría, y los supuestos sobre los que se apoya la documentación, para que el lector sepa qué tan lejos llega la evidencia.

## Alcance

Limitaciones del producto (L-P), limitaciones de la auditoría documental (L-A) y supuestos (S). Las restricciones de requerimientos se detallan en [01/10](../01_INGENIERIA_DE_REQUERIMIENTOS/10_RESTRICCIONES_Y_LIMITACIONES.md).

## Limitaciones del producto [OBS]

| ID | Limitación | Evidencia |
|---|---|---|
| L-P-01 | Entorno de laboratorio sin HTTPS, CSP ni HSTS | `backend/src/app.js` (comentario sobre HSTS) |
| L-P-02 | Pagos solo con proveedor mock; `PAYMENT_MODE=sandbox/prod` falla de forma segura | `backend/src/paymentProvider.js`, `backend/README.md` |
| L-P-03 | El comprobante no es factura electrónica DIAN | `backend/README.md` |
| L-P-04 | El padrón es una base de laboratorio que simula la fuente del Estado | `backend/src/seguridad/padron.js` |
| L-P-05 | Captcha y límites de solicitudes en memoria: un solo proceso | `backend/src/seguridad/captcha.js` |
| L-P-06 | Máximo 4 conexiones a MySQL (plan gratuito con 5) | `backend/src/db.js` |
| L-P-07 | Sesión en `localStorage` | `frontend/js/auth.js` |
| L-P-08 | `API_BASE` fijo en `http://localhost:8081` | `frontend/js/auth.js` |
| L-P-09 | Sin pantallas para la mayor parte de "mi cuenta" | BUG-004 |
| L-P-10 | Traducción solo parcial | BUG-016 |
| L-P-11 | Sin antivirus para documentos cargados | `docs/AUDITORIA_TECNICA.md` §5 |
| L-P-12 | Sin borrado automático por plazos de conservación | BUG-015 |
| L-P-13 | No se consultan fuentes oficiales de personas (SIGEP, Registraduría) | `docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md` |
| L-P-14 | El segundo factor de la compra restringida usa el mismo correo que el MFA | `docs/MODELO_AMENAZAS.md` |

## Limitaciones de la auditoría documental [OBS]

| ID | Limitación | Consecuencia |
|---|---|---|
| L-A-01 | No se arrancó el servidor ni se accedió a ninguna base de datos (Clever Cloud ni local) | Estado real de los datos y del esquema desplegado: NO DETERMINADO |
| L-A-02 | Solo se ejecutaron las suites unitarias (base simulada en memoria) | Integración, interfaz y rendimiento: evidencia histórica no reproducida |
| L-A-03 | No se accedió a la instancia n8n ni a su API | Estado de los workflows desplegados: NO DETERMINADO |
| L-A-04 | No se enviaron correos ni se probó SMTP real | Entrega de MFA y comprobantes: no verificada |
| L-A-05 | No se leyeron `.env`, `n8n/.env`, respaldos ni carpetas excluidas | Configuración efectiva y fortaleza de secretos reales: NO DETERMINADO |
| L-A-06 | No hay entrevistas, actas ni requisitos del cliente en el repositorio | Requerimientos inferidos de la implementación; requieren validación |
| L-A-07 | No se revisaron licencias de imágenes | Derechos de uso de `backend/img/`: NO DETERMINADO |
| L-A-08 | El contenido de `docs/Flujos-n8n.docx` no se analizó en detalle | Se enlaza como documento previo |
| L-A-09 | `npm audit` depende del registro público en la fecha de ejecución | El resultado puede cambiar |

## Supuestos

| ID | Supuesto | Validar con |
|---|---|---|
| S-01 | La rama `feature/verificacion-seguridad` (commit `4742737`) es la versión de referencia del sistema | Responsable técnico |
| S-02 | Los resultados históricos de `docs/RESULTADOS_PRUEBAS.md` y `docs/REGISTRO_VERIFICADO.md` se obtuvieron como se describe | Repetir las pruebas |
| S-03 | El objetivo de negocio es vender suministros a entidades institucionales colombianas con verificación | Patrocinador |
| S-04 | La restricción de costo cero sigue vigente | Patrocinador |
| S-05 | El servidor se ejecuta en un solo proceso | Operación |
| S-06 | Las variables descritas en `backend/.env.example` son el conjunto completo que usa el código | Revisión de `process.env` (ver [variables de entorno](../04_DESARROLLO/11_VARIABLES_DE_ENTORNO.md)) |
| S-07 | La severidad, probabilidad e impacto asignados a defectos y riesgos son estimaciones | Responsable técnico |

## Referencias

- [Restricciones y limitaciones de requerimientos](../01_INGENIERIA_DE_REQUERIMIENTOS/10_RESTRICCIONES_Y_LIMITACIONES.md)
- [Matriz de riesgos](06_MATRIZ_DE_RIESGOS.md)
- [Informe final de auditoría](11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md)
