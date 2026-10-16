# Plan de trabajo y estado actual

| Campo | Valor |
|---|---|
| ID documental | DOC-00-05 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Mostrar el estado real de cada módulo al 2026-10-16 y proponer un plan de trabajo para cerrar las brechas.

## Alcance

El estado se basa en el código y en las pruebas unitarias ejecutadas el 2026-10-16 (Jest 107/107, `node:test` 51/51). No existe un cronograma aprobado en el repositorio: el plan de la última sección es una propuesta [REC] sin fechas comprometidas.

## Trabajo realizado (cronología con evidencia Git) [OBS]

| Periodo | Trabajo | Liberación |
|---|---|---|
| 2026-10-11 | Landing y tema moderno | REL-001 |
| 2026-10-13 | Verificación institucional (migración 001), luego verificación en la compra (migración 002), superadministrador, W11 | REL-002, REL-003 |
| 2026-10-14 | Commit "first commit" (reorganización del historial) | — |
| 2026-10-15 | Cifrado por campo, padrón, captcha, migración 003, registro verificado, MFA por nodemailer, panel de solicitudes, W12, responsive, documento de flujos n8n | REL-004 |
| 2026-10-16 | Auditoría y documentación empresarial | REL-005 |

## Estado por módulo

| Módulo | Estado | Pruebas 2026-10-16 | Brechas principales |
|---|---|---|---|
| MOD-01 Autenticación y sesión | IMPLEMENTADO Y VERIFICADO (refresh/logout: IMPLEMENTADO, NO VERIFICADO) | registro-verificado, mi-cuenta | BUG-010, BUG-011 |
| MOD-02 Registro verificado y padrón | IMPLEMENTADO Y VERIFICADO (sincronización periódica: NO VERIFICADO) | account-registration-phase0, registro-verificado | Padrón de laboratorio en lugar de fuente oficial |
| MOD-03 Mi cuenta | PARCIALMENTE IMPLEMENTADO (API verificada, sin pantallas salvo cambio de contraseña) | mi-cuenta | BUG-004, BUG-005 |
| MOD-04 Verificación institucional y en la compra | IMPLEMENTADO, NO VERIFICADO (tabla de decisión, HMAC y cifrado v2 verificados) | verificacion-compra | Integración MySQL no reproducida; fuentes oficiales sin convenio |
| MOD-05 Autorización, permisos y segmentación | IMPLEMENTADO Y VERIFICADO (reglas unitarias) | tenancy, account-registration-phase0 | Escenarios HTTP A–L solo históricos |
| MOD-06 Catálogo | IMPLEMENTADO, NO VERIFICADO (visibilidad verificada) | tenancy, assistant | — |
| MOD-07 Carrito, checkout y pagos | IMPLEMENTADO, NO VERIFICADO (expiración y prellenado verificados) | paymentJobs, assistant | Pasarela real REQ-F-040 |
| MOD-08 Pedidos | IMPLEMENTADO, NO VERIFICADO | — | — |
| MOD-09 Comprobantes y correo | IMPLEMENTADO Y VERIFICADO | receiptService, receiptTokens, receiptEmail | BUG-006, SMTP real no probado |
| MOD-10 Clientes | IMPLEMENTADO Y VERIFICADO (controles de acceso) | account-registration-phase0 | — |
| MOD-11 Asistente y atención | IMPLEMENTADO Y VERIFICADO (asistente); contacto y calificación NO VERIFICADO | assistant | BUG-002 |
| MOD-12 Reportes | IMPLEMENTADO, NO VERIFICADO | — | BUG-001 |
| MOD-13 Auditoría | IMPLEMENTADO, NO VERIFICADO (auditoría de campos de mi-cuenta verificada) | mi-cuenta | — |
| MOD-14 Automatizaciones n8n | Backend IMPLEMENTADO Y VERIFICADO; workflows NO DETERMINADO (todos inactivos) | automation, registro-verificado, verificacion-compra | BUG-014, RSK-011 |
| MOD-15 Persistencia y migraciones | IMPLEMENTADO Y VERIFICADO (idempotencia); reversión solo histórica | db-account-migration | RSK-003 |
| MOD-16 Seguridad transversal y configuración | PARCIALMENTE IMPLEMENTADO (sin HTTPS/CSP/HSTS) | verificacion-compra (configuración segura), registro-verificado (cifrado) | BUG-012, BUG-013 |
| MOD-17 Frontend transversal | PARCIALMENTE IMPLEMENTADO (i18n incompleto) | assistant (widget) | BUG-003, BUG-016 |

## Indicadores actuales

| Indicador | Valor |
|---|---|
| Requerimientos funcionales | 40 (REQ-F-001…040) |
| IMPLEMENTADO Y VERIFICADO | 17 (REQ-F-001, 002, 004, 005, 006, 007, 009, 012, 014, 020, 022, 025, 026, 028, 031, 035, 037; varios con alcance parcial anotado) |
| PARCIALMENTE IMPLEMENTADO | 4 (REQ-F-010, 011, 013, 038) |
| IMPLEMENTADO, NO VERIFICADO | 17 |
| NO DETERMINADO / DOCUMENTADO, NO IMPLEMENTADO | 1 / 1 (REQ-F-036 / REQ-F-040) |
| Defectos/hallazgos abiertos | 18 (BUG-001…018; 2 de severidad alta: BUG-001, BUG-006) |
| Riesgos registrados | 17 (RSK-001…017) |

Fuente única del detalle: [matriz de trazabilidad](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md).

## Plan de trabajo propuesto [REC]

Sin fechas comprometidas ni responsables asignados; el orden refleja prioridad sugerida.

| Fase | Actividades | Entregable | Dependencias |
|---|---|---|---|
| F1 — Validación | Asignar responsables (04), validar esta documentación, decidir W11/NIT, cuentas heredadas y fusión a `main` | Documentos aprobados, decisiones registradas en 07 | INT-01 |
| F2 — Correcciones críticas | BUG-001 (autenticar reportes), BUG-006 (nodemailer v10 con pruebas de correo), BUG-002, rotación de secretos (RSK-002) | Versión corregida y probada | F1 |
| F3 — Verificación reproducible | Ejecutar integración MySQL Docker, interfaz jsdom y medición en entorno de pruebas; registrar en 05_PRUEBAS | Resultados de ejecución actualizados | F2 |
| F4 — Completar funcionalidad | Pantallas de mi cuenta (BUG-004/005), i18n (BUG-016), API_BASE configurable (BUG-003), limpieza (BUG-007, 008, 009) | Versión funcional completa | F3 |
| F5 — Endurecimiento para producción | HTTPS, CSP/HSTS, cookie HttpOnly, captcha gestionado, almacén compartido de límites, recifrado, respaldos automáticos | Lista preproducción completa | F4, decisión de infraestructura |
| F6 — Integraciones reales | Pasarela de pagos, SMTP institucional, activación de n8n, fuente oficial del padrón, validación jurídica | Acta de entrega | Convenios y contratos (fuera del equipo técnico) |

## Referencias

- [Matriz de riesgos](06_MATRIZ_DE_RIESGOS.md)
- [Registro de defectos](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)
- [Deuda técnica y mejoras](../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
- [Resultados de ejecución](../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md)
