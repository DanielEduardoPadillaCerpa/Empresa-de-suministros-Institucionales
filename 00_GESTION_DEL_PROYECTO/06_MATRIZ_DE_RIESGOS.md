# Matriz de riesgos

| Campo | Valor |
|---|---|
| ID documental | DOC-00-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar los riesgos del proyecto y del sistema, su valoración y la respuesta propuesta.

## Alcance

Riesgos identificados en la auditoría del 2026-10-16 a partir del código, la configuración de ejemplo, el historial Git y la documentación previa. La probabilidad y el impacto son estimaciones [INF] que deben validarse. Las respuestas son propuestas [REC]. El análisis técnico detallado está en [02_ANALISIS/11](../02_ANALISIS/11_ANALISIS_DE_RIESGOS_TECNICOS.md).

## Escala

Probabilidad: Baja (1), Media (2), Alta (3). Impacto: Bajo (1), Medio (2), Alto (3), Muy alto (4). Nivel = P × I: 1–3 bajo, 4–6 medio, 8–12 alto.

## Matriz

| ID | Riesgo | P | I | Nivel | Relación | Respuesta propuesta [REC] | Responsable | Estado |
|---|---|---|---|---|---|---|---|---|
| RSK-001 | Pérdida de ENC_KEY, HMAC_KEY, CRYPTO_KEYS o IDENT_HMAC_KEY: datos cifrados irrecuperables | Media | Muy alto | 8 Alto | ADR-005 | Mitigar: custodiar las claves en un gestor de secretos y en un respaldo fuera del equipo, con procedimiento de recuperación probado | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-002 | Secretos expuestos o débiles (contraseña de la base del padrón compartida en texto; secretos legibles señalados en `docs/AUDITORIA_TECNICA.md` §8) | Alta | Alto | 9 Alto | BUG-013 | Mitigar: rotar contraseña de la base del padrón, JWT_SECRET, MFA_TOKEN_PEPPER y secretos n8n; recifrar datos heredados | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-003 | Uso de la base de producción desde desarrollo (incidente del 2026-10-13: migración aplicada con `node --watch`) | Media | Alto | 6 Medio | `docs/AUDITORIA_TECNICA.md` §7 | Evitar: base separada de desarrollo; `NODE_ENV=production` en producción; respaldo antes de arrancar | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-004 | Agotar el límite de 5 conexiones MySQL (servidor usa 4 + scripts) | Media | Medio | 4 Medio | ADR-011 | Mitigar: detener el servidor antes de scripts; migrar a plan con más conexiones al producir | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-005 | Vulnerabilidades altas de nodemailer 6.10.1 | Alta | Alto | 9 Alto | BUG-006 | Mitigar: actualizar a v10 con pruebas de correo (receiptEmail, mi-cuenta) | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-006 | Robo de sesión por XSS (tokens en localStorage) | Media | Alto | 6 Medio | BUG-011 | Mitigar: cookie HttpOnly + CSRF, CSP estricta | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-007 | Tráfico sin TLS y sin CSP/HSTS | Alta | Alto | 9 Alto | BUG-012 | Evitar en producción: HTTPS obligatorio, HSTS, CSP | PENDIENTE DE ASIGNACIÓN | Abierto (aceptado en laboratorio) |
| RSK-008 | Fuga de información por `GET /api/reportes/mensual` sin autenticación | Alta | Medio | 6 Medio | BUG-001 | Mitigar: exigir autenticación y permiso; revisar exposición de comentarios | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-009 | Error humano en aprobaciones de registro o verificación | Media | Alto | 6 Medio | RN-003, RN-011 | Mitigar: cuatro ojos (ya existe en verificación), capacitación, revisión de auditoría | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-010 | Validación jurídica pendiente (Ley 1581, productos restringidos, RNBD) | Alta | Alto | 9 Alto | REQ-NF-017 | Transferir/mitigar: concepto jurídico antes de operar | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-011 | Workflows n8n no desplegados ni verificados (todos `active: false`) | Alta | Medio | 6 Medio | REQ-F-036 | Mitigar: importar y probar en entorno de pruebas; los jobs internos cubren expiración y mantenimiento | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-012 | Sin respaldos automatizados verificados de base, documentos (`DOCUMENTOS_DIR`) y claves | Alta | Muy alto | 12 Alto | [06/09](../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md) | Mitigar: respaldo programado y prueba de restauración periódica | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-013 | Sin responsables asignados ni aprobaciones formales | Alta | Medio | 6 Medio | [04](04_INTERESADOS_Y_RESPONSABILIDADES.md) | Mitigar: asignar roles y aprobar documentos | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-014 | No escala a varias instancias (captcha y limitadores en memoria) | Media | Medio | 4 Medio | BUG-010 | Aceptar en laboratorio; en producción, almacén compartido o captcha gestionado | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-015 | Sin pasarela de pagos real | Alta | Alto | 9 Alto | REQ-F-040 | Aceptar en laboratorio; integrar y certificar pasarela antes de operar | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-016 | Documentación previa inconsistente | Alta | Bajo | 3 Bajo | BUG-008 | Mitigar: corregir docs previos o marcarlos como históricos | PENDIENTE DE ASIGNACIÓN | Abierto |
| RSK-017 | Trabajo sin fusionar a `main` y sin etiquetas de versión | Alta | Medio | 6 Medio | BUG-018 | Mitigar: pull request, revisión, fusión y etiquetado | PENDIENTE DE ASIGNACIÓN | Abierto |

## Mapa de calor

| Impacto \ Probabilidad | Baja | Media | Alta |
|---|---|---|---|
| Muy alto | — | RSK-001 | RSK-012 |
| Alto | — | RSK-003, RSK-006, RSK-009 | RSK-002, RSK-005, RSK-007, RSK-010, RSK-015 |
| Medio | — | RSK-004, RSK-014 | RSK-008, RSK-011, RSK-013, RSK-017 |
| Bajo | — | — | RSK-016 |

## Seguimiento

Revisión propuesta [REC]: en cada liberación y ante cada incidente. Registrar cambios de estado en esta tabla con fecha y responsable.

## Referencias

- [Análisis de riesgos técnicos](../02_ANALISIS/11_ANALISIS_DE_RIESGOS_TECNICOS.md)
- [Registro de defectos](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)
- [docs/MODELO_AMENAZAS.md](../docs/MODELO_AMENAZAS.md)
- [docs/AUDITORIA_TECNICA.md](../docs/AUDITORIA_TECNICA.md)
