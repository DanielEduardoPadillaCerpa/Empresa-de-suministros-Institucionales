# Matriz de trazabilidad

| Campo | Valor |
|---|---|
| ID documental | DOC-01-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Conectar cada requerimiento con su caso de uso, elemento de diseño, archivos de código, caso de prueba, resultado y procedimiento de despliegue, mostrando vínculos confirmados y brechas.

## Alcance

REQ-F-001…040 y REQ-NF-001…018. Rutas de código relativas a la raíz del repositorio (prefijo `../` desde esta carpeta). Resultados de TC al 2026-10-16: APROBADO (prueba ejecutada y pasada), NO EJECUTADO, BLOQUEADO (requiere MySQL de pruebas, SMTP, n8n o credenciales), PENDIENTE (funcionalidad no implementada). Procedimiento de despliegue común: [../06_IMPLEMENTACION/05_GUIA_DE_DESPLIEGUE.md](../06_IMPLEMENTACION/05_GUIA_DE_DESPLIEGUE.md) (abreviado **GD**); configuración de BD: [../06_IMPLEMENTACION/06_CONFIGURACION_DE_BASE_DE_DATOS.md](../06_IMPLEMENTACION/06_CONFIGURACION_DE_BASE_DE_DATOS.md) (**CBD**); integraciones: [../06_IMPLEMENTACION/07_CONFIGURACION_DE_INTEGRACIONES.md](../06_IMPLEMENTACION/07_CONFIGURACION_DE_INTEGRACIONES.md) (**CI**); seguridad: [../06_IMPLEMENTACION/08_CONFIGURACION_DE_SEGURIDAD.md](../06_IMPLEMENTACION/08_CONFIGURACION_DE_SEGURIDAD.md) (**CS**).

## 1. Requerimientos funcionales

| REQ | UC | DIS | Componente / archivo principal | Prueba automatizada | TC | Resultado | Despliegue |
|---|---|---|---|---|---|---|---|
| REQ-F-001 | UC-001 | DIS-002, DIS-003, DIS-006 | `backend/src/routes/auth.js`, `backend/src/registroInstitucional.js`, `backend/src/seguridad/registroVerificado.js`, `frontend/registro.html` | account-registration-phase0.spec, registro-verificado.test | TC-001 | APROBADO | GD, CS |
| REQ-F-002 | UC-001 | DIS-002, DIS-006 | `backend/src/seguridad/padron.js`, `backend/src/seguridad/normalizacion.js` | registro-verificado.test | TC-002 | APROBADO | GD, CBD |
| REQ-F-003 | UC-023 | DIS-002, DIS-006 | `backend/src/seguridad/padron.js`, `backend/scripts/importar-padron.js` | — | TC-003 | BLOQUEADO | CBD |
| REQ-F-004 | UC-002 | DIS-003, DIS-005 | `backend/src/routes/solicitudesRegistro.js`, `frontend/admin-solicitudes.html` | registro-verificado.test | TC-004 | APROBADO | GD |
| REQ-F-005 | UC-003 | DIS-004 | `backend/src/routes/auth.js`, `backend/src/seguridad/contrasenas.js`, `frontend/login.html` | registro-verificado.test, mi-cuenta.spec | TC-005 | APROBADO | GD, CS |
| REQ-F-006 | UC-003 | DIS-004 | `backend/src/routes/auth.js`, `backend/src/mfaCodes.js`, `backend/src/seguridad/correo.js` | registro-verificado.test, mi-cuenta.spec | TC-006 | APROBADO (cancelar NO EJECUTADO) | CI (SMTP) |
| REQ-F-007 | UC-004 | DIS-004 | `backend/src/routes/auth.js` (`requiereAutenticacion`) | mi-cuenta.spec | TC-007 | APROBADO | CS |
| REQ-F-008 | UC-004 | DIS-004 | `backend/src/routes/auth.js`, `frontend/js/auth.js` | — | TC-008 | BLOQUEADO (requiere MySQL de pruebas) | CS |
| REQ-F-009 | UC-005 | DIS-004 | `backend/src/routes/auth.js`, `backend/src/db.js`, `frontend/cambiar-password.html` | mi-cuenta.spec | TC-009 | APROBADO | GD |
| REQ-F-010 | UC-006 | DIS-003, DIS-004 | `backend/src/routes/miCuenta.js` | mi-cuenta.spec | TC-010 | APROBADO (API; sin pantalla) | GD |
| REQ-F-011 | UC-006 | DIS-003, DIS-004 | `backend/src/routes/miCuenta.js` | mi-cuenta.spec | TC-011 | APROBADO (API; sin pantalla) | CI (SMTP) |
| REQ-F-012 | UC-005, UC-006 | DIS-004 | `backend/src/routes/miCuenta.js`, `frontend/cambiar-password.html` | mi-cuenta.spec | TC-012 | APROBADO | GD |
| REQ-F-013 | UC-006 | DIS-003 | `backend/src/routes/miCuenta.js` | mi-cuenta.spec | TC-013 | APROBADO (API; sin pantallas) | CI (W8) |
| REQ-F-014 | UC-007 | DIS-005, DIS-003 | `backend/src/autorizacion.js`, `backend/src/tenancy.js`, `backend/src/routes/productos.js`, `frontend/index.html` | tenancy.test, assistant.spec | TC-014 | APROBADO (reglas) | GD |
| REQ-F-015 | UC-007 | DIS-003 | `backend/src/routes/productos.js`, `backend/src/routes/categorias.js`, `frontend/producto-detalle.html` | — | TC-015 | BLOQUEADO (requiere MySQL de pruebas) | GD |
| REQ-F-016 | UC-015 | DIS-003, DIS-005 | `backend/src/routes/productos.js`, `backend/src/routes/categorias.js`, `frontend/admin-productos.html` | — | TC-016 | BLOQUEADO | GD |
| REQ-F-017 | UC-015 | DIS-005 | `backend/src/routes/verificacion.js` (admin/productos), `backend/src/migraciones/001_verificacion_institucional.js` | — (histórico: integración K, H) | TC-017 | BLOQUEADO | CBD |
| REQ-F-018 | UC-008 | DIS-009 | `frontend/js/cart.js` | — | TC-018 | NO EJECUTADO | GD |
| REQ-F-019 | UC-009 | DIS-008, DIS-003 | `backend/src/routes/checkout.js`, `frontend/checkout.html` | — (histórico: integración E, K, L) | TC-019 | BLOQUEADO | GD |
| REQ-F-020 | UC-009 | DIS-003 | `backend/src/routes/checkout.js` (`/perfil`), `frontend/js/checkout-autofill.js` | assistant.spec | TC-020 | APROBADO | GD |
| REQ-F-021 | UC-009 | DIS-008 | `backend/src/routes/pagos.js`, `backend/src/paymentProvider.js` | assistant.spec (solo estado) | TC-021 | BLOQUEADO (sub-caso de consulta de estado: APROBADO) | CS (`PAYMENT_*`) |
| REQ-F-022 | UC-023 | DIS-008 | `backend/src/paymentJobs.js`, `backend/src/inventoryReservations.js` | paymentJobs.test | TC-022 | APROBADO | GD |
| REQ-F-023 | UC-010 | DIS-003 | `backend/src/routes/pedidos.js`, `frontend/mis-pedidos.html`, `frontend/historial.html` | — | TC-023 | BLOQUEADO (requiere MySQL de pruebas) | GD |
| REQ-F-024 | UC-016 | DIS-003, DIS-005 | `backend/src/routes/pedidos.js`, `frontend/admin-pedidos.html` | — | TC-024 | BLOQUEADO | GD |
| REQ-F-025 | UC-011 | DIS-003 | `backend/src/routes/comprobantes.js`, `backend/src/receiptService.js`, `backend/src/receiptTokens.js`, `backend/src/emailOutbox.js` | receiptService.test, receiptTokens.test, receiptEmail.test | TC-025 | APROBADO | CI (SMTP), CS |
| REQ-F-026 | UC-017 | DIS-003, DIS-005 | `backend/src/routes/clientes.js`, `frontend/admin-clientes.html` | account-registration-phase0.spec | TC-026 | APROBADO | GD |
| REQ-F-027 | UC-012 | DIS-005, DIS-006 | `backend/src/routes/verificacion.js`, `backend/src/verificacion.js`, `backend/src/verificacionCompra.js`, `frontend/mi-verificacion.html` | verificacion-compra.test (parcial) | TC-027 | BLOQUEADO (parcial APROBADO) | CS (`CRYPTO_KEYS`, `IDENT_HMAC_KEY`, `DOCUMENTOS_DIR`) |
| REQ-F-028 | UC-013 | DIS-005, DIS-006 | `backend/src/verificacionCompra.js`, `backend/src/routes/verificacion.js`, `frontend/admin-verificaciones.html` | verificacion-compra.test | TC-028 | APROBADO (tabla de decisión) | GD |
| REQ-F-029 | UC-014 | DIS-005, DIS-006 | `backend/src/routes/verificacion.js` (compra/autorizacion), `backend/src/routes/checkout.js` | verificacion-compra.test (hash) | TC-029 | BLOQUEADO (parcial APROBADO) | CI (SMTP) |
| REQ-F-030 | UC-018 | DIS-005 | `backend/src/routes/verificacion.js` (admin/permisos, personal, diagnostico), `backend/scripts/crear-superadmin.js` | — (histórico) | TC-030 | BLOQUEADO | GD (creación de superadmin) |
| REQ-F-031 | UC-019 | DIS-012 | `backend/src/routes/asistente.js`, `backend/src/assistant/`, `frontend/js/chatbot.js` | assistant.spec | TC-031 | APROBADO | GD |
| REQ-F-032 | UC-019, UC-020 | DIS-012, DIS-003 | `backend/src/routes/atencion.js`, `frontend/contacto.html` | — | TC-032 | BLOQUEADO (requiere MySQL de pruebas) | GD |
| REQ-F-033 | UC-021 | DIS-003 | `backend/src/routes/reportes.js`, `backend/src/routes/misreportes.js`, `frontend/reportes.html`, `frontend/mis-reportes.html` | — | TC-033 | BLOQUEADO (BUG-001) | GD |
| REQ-F-034 | UC-022 | DIS-003 | `backend/src/auditoria.js`, `backend/src/routes/auditoria.js` | mi-cuenta.spec (parcial) | TC-034 | BLOQUEADO (requiere MySQL de pruebas) | GD |
| REQ-F-035 | UC-023 | DIS-007 | `backend/src/automationOutbox.js`, `backend/src/automationSignatures.js`, `backend/src/automationAuth.js`, `backend/src/seguridad/avisosN8n.js` | automation.test, registro-verificado.test, verificacion-compra.test | TC-035 | APROBADO | CI |
| REQ-F-036 | UC-023 | DIS-007 | `n8n/workflows/*.json`, `n8n/docker-compose.yml` | automation.test (solo validez JSON) | TC-036 | BLOQUEADO | CI |
| REQ-F-037 | UC-023 | DIS-011 | `backend/src/db.js`, `backend/src/migraciones/`, `backend/scripts/migraciones.js` | db-account-migration.spec | TC-037 | APROBADO (reversión BLOQUEADO) | CBD |
| REQ-F-038 | — (transversal) | DIS-009 | `frontend/js/i18n.js` | — | TC-038 | NO EJECUTADO | GD |
| REQ-F-039 | UC-007 | DIS-009 | `frontend/landing.html`, `frontend/leyes.html`, `frontend/js/global-layout.js`, `backend/src/app.js` | — | TC-039 | NO EJECUTADO | GD |
| REQ-F-040 | UC-009 | DIS-008 | `backend/src/paymentProvider.js` (solo mock) | — | TC-040 | PENDIENTE | — (no aplica aún) |

## 2. Requerimientos no funcionales

| REQ | DIS | Componente | Prueba | TC | Resultado | Despliegue |
|---|---|---|---|---|---|---|
| REQ-NF-001 | DIS-006 | `backend/src/seguridad/cifradoCampos.js`, `backend/src/crypto.js` | registro-verificado.test, verificacion-compra.test | TC-101 | APROBADO | CS |
| REQ-NF-002 | DIS-004 | `backend/src/seguridad/contrasenas.js` | pruebas de registro | TC-102 | APROBADO | CS |
| REQ-NF-003 | DIS-004, DIS-006 | `backend/src/configSegura.js` | verificacion-compra.test | TC-103 | APROBADO | CS |
| REQ-NF-004 | DIS-003 | `backend/src/routes/*.js` | assistant.spec, mi-cuenta.spec | TC-104 | APROBADO (parcial) | CS |
| REQ-NF-005 | DIS-001 | `backend/src/app.js` | — | TC-105 | NO EJECUTADO | CS |
| REQ-NF-006 | DIS-002 | `backend/scripts/medir-rendimiento.js` | — | TC-106 | BLOQUEADO | GD |
| REQ-NF-007 | DIS-002 | `backend/src/db.js` | — | TC-107 | NO EJECUTADO | CBD |
| REQ-NF-008 | DIS-007 | `backend/src/automationOutbox.js`, `backend/src/seguridad/avisosN8n.js` | automation.test, registro-verificado.test, verificacion-compra.test, assistant.spec | TC-108 | APROBADO | CI |
| REQ-NF-009 | DIS-001 | código general | — | TC-109 | BLOQUEADO | CS |
| REQ-NF-010 | DIS-007, DIS-008 | `backend/src/automationOutbox.js`, `backend/src/emailOutbox.js`, `backend/src/paymentJobs.js` | automation.test, paymentJobs.test | TC-110 | APROBADO (parcial) | GD |
| REQ-NF-011 | DIS-010 | `backend/package.json` | — | TC-111 | NO EJECUTADO | [../06_IMPLEMENTACION/02_REQUISITOS_DE_INFRAESTRUCTURA.md](../06_IMPLEMENTACION/02_REQUISITOS_DE_INFRAESTRUCTURA.md) |
| REQ-NF-012 | — | `backend/test/` | npm test | TC-112 | APROBADO | — |
| REQ-NF-013 | DIS-009 | `frontend/css/` | — | TC-113 | NO EJECUTADO | GD |
| REQ-NF-014 | DIS-009, DIS-012 | `frontend/js/chatbot.js` | assistant.spec | TC-114 | APROBADO (parcial) | GD |
| REQ-NF-015 | DIS-004 | `frontend/js/auth.js` | — | TC-115 | PENDIENTE | CS |
| REQ-NF-016 | DIS-010 | `backend/src/app.js` | — | TC-116 | PENDIENTE | CS |
| REQ-NF-017 | DIS-006 | `docs/TRATAMIENTO_DATOS_PERSONALES.md` | — | TC-117 | NO EJECUTADO | — |
| REQ-NF-018 | DIS-010 | — | — | — | NO APLICA (restricción) | — |

## 3. Cobertura resumida

| Resultado (REQ-F) | Cantidad |
|---|---|
| APROBADO (total o parcial) | 20 (001, 002, 004, 005, 006, 007, 009, 010*, 011*, 012, 013*, 014, 020, 022, 025, 026, 028, 031, 035, 037) |
| NO EJECUTADO | 3 (018, 038, 039) |
| BLOQUEADO | 16 (003, 008, 015, 016, 017, 019, 021, 023, 024, 027, 029, 030, 032, 033, 034, 036) — requieren MySQL de pruebas, SMTP o n8n; criterio alineado con [05_PRUEBAS/03](../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md) |
| PENDIENTE | 1 (040) |
| **Total** | **40** |

\* Solo la API; no existe pantalla.

## 4. Brechas pendientes

| Brecha | Tipo | Acción propuesta [REC] |
|---|---|---|
| REQ-F-019, 017, 024, 027, 029, 030 sin prueba ejecutada en esta auditoría | Verificación | Ejecutar `npm run test:integration` con MySQL Docker local (`../docs/PLAN_PRUEBAS.md`) |
| REQ-F-008, 015, 018, 023, 032, 033, 034, 039 sin prueba automatizada | Cobertura | Añadir pruebas con supertest y base simulada |
| REQ-F-010, 011, 013 sin pantalla | Implementación | Diseñar página "Mi cuenta" (BUG-004, BUG-005) |
| REQ-F-033 expone datos sin autenticación | Defecto | Añadir `requiereAutenticacion` + permiso (BUG-001) |
| REQ-F-036 sin instancia verificable | Integración | Importar workflows en n8n de laboratorio y registrar evidencia |
| REQ-F-040 | Implementación | Seleccionar y validar un proveedor de pagos |
| REQ-NF-015, 016 | Seguridad | Planificar despliegue con HTTPS y cookie HttpOnly |
| REQ-NF-017 | Cumplimiento | Validación jurídica |
| Ningún requerimiento tiene aprobación formal del negocio | Gestión | Revisión con INT-01 |
| UC-018 / REQ-F-030 no tienen interfaz de prueba automatizada actual | Verificación | Reejecutar `compra-verificada.int.spec.js` §15–16 |

## Referencias

- [05_REQUERIMIENTOS_FUNCIONALES.md](05_REQUERIMIENTOS_FUNCIONALES.md), [09_CRITERIOS_DE_ACEPTACION.md](09_CRITERIOS_DE_ACEPTACION.md)
- [../02_ANALISIS/05_CASOS_DE_USO.md](../02_ANALISIS/05_CASOS_DE_USO.md), [../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md)
- [../05_PRUEBAS/12_MATRIZ_DE_COBERTURA.md](../05_PRUEBAS/12_MATRIZ_DE_COBERTURA.md)
