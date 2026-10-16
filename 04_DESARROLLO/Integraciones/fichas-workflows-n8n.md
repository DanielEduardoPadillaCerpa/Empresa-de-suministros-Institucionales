# Fichas de los workflows n8n W1–W12

| Campo | Valor |
|---|---|
| ID documental | DOC-04-INT-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Documentar cada workflow exportado en `../../n8n/workflows/` con base en su JSON y en el código del backend que lo invoca.

## Alcance

**[OBS]** Los 12 archivos tienen `active: false`. Versión de n8n de referencia: 1.110.1. Ninguno fue importado ni ejecutado en la auditoría: el **estado operativo de todos es NO DETERMINADO** (REQ-F-036). La lógica de W8, W11 y W12 sí se verificó ejecutando su código en pruebas unitarias el 2026-10-16 (`automation.test.js`, `verificacion-compra.test.js`, `registro-verificado.test.js`).

---

## W1 — Alertas de pago (`W1-alerta-pagos.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Avisar al administrador cuando un pago queda aprobado o rechazado |
| Disparador | Webhook `POST /webhook/empresa-alerta-pago` (respuesta desde nodo) |
| Nodos | Webhook pago → Verificar firma y datos (Code) → Confirmar recepción firmada (200) + Avisar al administrador (Email Send) |
| Entrada | `{evento:'pago', pedido_id, estado, total (centavos, cadena), moneda, fecha}` con `x-automation-timestamp` y `x-automation-signature` |
| Origen | `routes/pagos.js` encola en `automation_outbox` (W1) en la misma transacción del cambio de estado |
| Autenticación | HMAC-SHA256 con `N8N_W1_SECRET`, ventana 5 min |
| Variables n8n | `N8N_W1_SECRET`, `ADMIN_ALERT_FROM`, `ADMIN_ALERT_TO` |
| Errores | Firma inválida → el nodo Code falla (sin correo); el backend reintenta hasta 8 veces con espera creciente |
| Datos personales | Ninguno |

## W2 — Resumen diario de ventas (`W2-resumen-diario.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Enviar al administrador el recaudo aprobado de las últimas 24 h |
| Disparador | Programado diario 08:00 (zona America/Bogota) |
| Nodos | Cada día a las 08:00 → Consultar resumen agregado (HTTP GET) → Validar y formatear resumen (Code) → Enviar resumen agregado (Email) |
| Llamada | `GET {BACKEND_BASE_URL}/api/automatizaciones/resumen-diario` con `x-automation-token` |
| Salida del backend | `{evento:'resumen_diario', total, moneda:'COP', fecha}` |
| Variables | `BACKEND_BASE_URL`, `N8N_W2_DAILY_SUMMARY_TOKEN`, `ADMIN_ALERT_FROM`, `ADMIN_ALERT_TO` |
| Errores | 401/503 si el token falta o no coincide; sin reintento propio |

## W3 — Alerta de stock bajo (`W3-alerta-stock-bajo.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Alerta genérica cuando algún producto activo alcanza `AUTOMATION_STOCK_LOW_THRESHOLD` (máx. una al día) |
| Disparador | Webhook `POST /webhook/empresa-stock-bajo` |
| Nodos | Webhook → Verificar firma y datos → Confirmar recepción firmada (200) + Avisar inventario bajo (Email) |
| Entrada | `{evento:'stock_bajo', fecha}` firmada (sin IDs ni nombres de productos) |
| Autenticación | HMAC con `N8N_W3_SECRET` |
| Variables | `N8N_W3_SECRET`, `ADMIN_ALERT_FROM`, `ADMIN_ALERT_TO` |

## W4 — Expirar pedidos pendientes (`W4-expirar-pedidos.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Liberar reservas vencidas |
| Disparador | Programado cada minuto |
| Nodos | Cada minuto → Solicitar expiración segura (HTTP POST) |
| Llamada | `POST {BACKEND_BASE_URL}/api/automatizaciones/pedidos/expirar` con `x-automation-token` = `N8N_W4_EXPIRY_TOKEN` |
| Observación | Redundante: el backend corre el mismo proceso cada 60 s (`paymentJobs.js`), así que W4 es opcional |

## W5 — MFA: enviar código de acceso (`W5-mfa-email.json`) — SIN USO

| Aspecto | Detalle |
|---|---|
| Propósito original | Entregar el código MFA del login por SMTP |
| Disparador | Webhook `POST /webhook/mfa-login-code` con credencial Header Auth |
| Nodos | Webhook MFA → Validar y armar correo → Enviar código por SMTP → Responder envío aceptado (200) / Responder fallo de correo (502) |
| Estado | **Sin uso desde 2026-10-15**: el backend envía el código con nodemailer (ADR-007). Guardado de ejecuciones desactivado |
| Recomendación [REC] | Archivar el JSON o marcarlo como obsoleto para evitar activarlo por error |

## W6 — Asistente escalado (`W6-asistente-escalado.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Avisar al administrador cuando el asistente decide escalar una consulta |
| Disparador | Webhook `POST /webhook/asistente-escalado` con Header Auth (`responseMode=lastNode`) |
| Nodos | Webhook firmado → Validar firma y evento → Avisar al administrador (Email) |
| Origen | `routes/asistente.js` encola W6 con motivo `consulta_de_politica`/`solicitud_de_atencion`; nunca reenvía el mensaje ni PII (verificado en `assistant.spec`) |
| Autenticación | HMAC + `Authorization: Bearer` con `N8N_W6_ASSISTANT_ESCALATION_SECRET` |
| Variables | `N8N_W6_ASSISTANT_ESCALATION_SECRET`, `AUTOMATION_FROM_EMAIL`, `ADMIN_EMAIL` |
| Observación | No desactiva el guardado de ejecuciones en sus ajustes |

## W7 — Resumen semanal de preguntas del asistente (`W7-resumen-preguntas-asistente.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Enviar conteos de preguntas no resueltas de los últimos 7 días |
| Disparador | Programado semanal (lunes 08:00) |
| Nodos | Cada semana → Leer resumen agregado (HTTP) → Enviar resumen al administrador (Email) |
| Llamada | `ASSISTANT_WEEKLY_SUMMARY_URL` (→ `/api/asistente/pendientes/resumen-semanal`) con `Authorization: Bearer ASSISTANT_WEEKLY_SUMMARY_TOKEN` |
| Salida | `{periodo_dias:7, total, por_dia:[{fecha, cantidad}]}` |

## W8 — Seguridad y solicitudes de cuenta (`W8-notificaciones-cuenta.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Avisos de cuenta; hoy solo el aviso administrativo de nuevas solicitudes de corrección/eliminación |
| Disparador | Webhook `POST /webhook/account-events` |
| Nodos | Webhook W8 firmado → Validar firma y preparar aviso → Enviar correo seguro → Responder enviado (200) / Responder fallo SMTP (502) |
| Entrada | Eventos admitidos: `mfa.email.change.code`, `security.notice`, `admin.solicitud_cuenta`; el backend solo encola hoy `admin.solicitud_cuenta` (id y tipo); el payload se guarda **cifrado** en el outbox |
| Autenticación | HMAC sobre el cuerpo raw con `N8N_W8_ACCOUNT_SECRET`, lista blanca de eventos y claves exactas |
| Errores | 502 si SMTP falla → el outbox reintenta |
| Ejecuciones | Guardado desactivado |

## W9 — Comprobantes de compra (`W9-comprobantes-email.json`) — SIN USO

| Aspecto | Detalle |
|---|---|
| Propósito original | Enviar al cliente el enlace firmado del comprobante |
| Disparador | Webhook `POST /webhook/receipt-email` con Header Auth |
| Nodos | Webhook → Validar correo de comprobante → Enviar comprobante por SMTP → 200 / 502 |
| Estado | **Sin uso desde 2026-10-15** (envío directo por `emailOutbox.js` + nodemailer) |

## W10 — Contexto institucional (`W10-contexto-institucional.json`)

| Aspecto | Detalle |
|---|---|
| Propósito | Subflujo que normaliza el dominio/identificador y resuelve el contexto de cada institución |
| Disparador | Execute Workflow Trigger (política `workflowsFromSameOwner`) |
| Nodos | Validar ámbito y preparar ruta → Switch por institución → 7 nodos Code (Policía, Defensa, Bomberos, Socorro, Penitenciario, Corporativo, General) |
| Estado | Inactivo y **no conectado** por diseño (`../../docs/arquitectura-multitenant.md`); devuelve nombres de variables, nunca valores |

## W11 — Verificación del comprador (`W11-verificacion-compra.json`, generado por `n8n/generar-w11.js`)

| Aspecto | Detalle |
|---|---|
| Propósito | Consultar la existencia de la entidad en datos.gov.co, avisar al equipo y al titular, disparar el mantenimiento. **No decide** |
| Disparadores | Webhook `POST /webhook/verification-events` (responde **202**) y programado cada 15 min |
| Nodos | Verificar firma y repartir → Confirmar recepción → Según tarea (Switch) → Consultar CHIP `5c7g-ptic` → Consultar RUES `c82u-588k` → Clasificar y firmar resultado → Informar al backend; ramas Preparar aviso al equipo / al titular → Enviar correo; Cada 15 minutos → Mantenimiento de verificaciones |
| Entrada | `verificacion.solicitada` `{evento, ref, tipoInstitucion, consultarEntidad, [nit], timestamp}`; `verificacion.requiere_revision` `{evento, ref, motivo, timestamp}`; `verificacion.actualizada` `{email, estado, evento, timestamp}` |
| Salida | `POST {BACKEND_BASE_URL}/api/automatizaciones/verificaciones/resultado` con `{ref, componente:'entidad', metodo, resultado, fuente, consultadoEn, nonce}` firmado con `N8N_W11_CALLBACK_SECRET` (distinto del de ida) |
| Clasificación | `confirmado`, `ambiguo`, `no_coincide`, `datos_insuficientes` (ausencia ≠ fraude), `fuente_no_disponible`, `respuesta_invalida` |
| Variables | `N8N_W11_SECRET`, `N8N_W11_CALLBACK_SECRET`, `N8N_W11_MAINTENANCE_TOKEN`, `BACKEND_BASE_URL`, `DATOS_GOV_APP_TOKEN` (opcional), `ADMIN_ALERT_FROM/TO`, `VERIFICATION_FROM_EMAIL`/`MFA_FROM_EMAIL`; credencial SMTP |
| Ejecuciones | Guardado desactivado |
| Datos | Envía el **NIT de persona jurídica** a n8n y a datos.gov.co (BUG-014, decisión pendiente); nunca cédulas |
| Detalle | `../../docs/FLUJO_N8N_VERIFICACION.md` |

## W12 — Avisos de solicitudes de registro (`W12-avisos-registro.json`, generado por `n8n/generar-w12.js`)

| Aspecto | Detalle |
|---|---|
| Propósito | Recibir avisos `registro.recibido`, `registro.aprobado`, `registro.rechazado` |
| Disparador | Webhook `POST /webhook/registro-avisos` |
| Nodos | Webhook W12 firmado → Verificar firma (Code) → Responder recibido (200) / Responder rechazado (401) |
| Entrada | Exactamente `{evento, solicitud_id, resultado}`; `X-Timestamp` (s) y `X-Signature` = hex(HMAC-SHA256(`N8N_REGISTRO_SECRET`, `timestamp.evento.solicitud_id`)) |
| Origen | `src/seguridad/avisosN8n.js` en segundo plano, timeout 3 s; un fallo solo queda en el log |
| Observación | La firma no cubre `resultado` (informativo). El workflow solo valida y responde; no envía correos |
| Requisitos | `NODE_FUNCTION_ALLOW_BUILTIN=crypto`, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` |

## Resumen de estados

| WF | Lado backend | Workflow en n8n |
|---|---|---|
| W1, W3, W6, W8, W11 (salientes) | IMPLEMENTADO Y VERIFICADO (firma y outbox) | NO DETERMINADO |
| W2, W4, W7, W11 (entrantes) | IMPLEMENTADO Y VERIFICADO (tokens) | NO DETERMINADO |
| W12 | IMPLEMENTADO Y VERIFICADO (firma y nodo Code) | NO DETERMINADO |
| W5, W9 | NO APLICA (retirados) | Sin uso |
| W10 | NO APLICA (no conectado) | Inactivo por diseño |

## Referencias

- [contratos-eventos-backend-n8n.md](contratos-eventos-backend-n8n.md) · [../10_INTEGRACIONES_Y_AUTOMATIZACIONES.md](../10_INTEGRACIONES_Y_AUTOMATIZACIONES.md)
- [../../06_IMPLEMENTACION/07_CONFIGURACION_DE_INTEGRACIONES.md](../../06_IMPLEMENTACION/07_CONFIGURACION_DE_INTEGRACIONES.md)
