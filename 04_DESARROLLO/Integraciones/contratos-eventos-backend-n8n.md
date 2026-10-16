# Contratos de eventos backend ↔ n8n

| Campo | Valor |
|---|---|
| ID documental | DOC-04-INT-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Especificar los mecanismos de firma y los cuerpos de los mensajes entre el backend y n8n para quien implemente o revise un workflow.

## Alcance

**[OBS]** `../../backend/src/automationOutbox.js`, `../../backend/src/automationSignatures.js`, `../../backend/src/automationAuth.js`, `../../backend/src/seguridad/avisosN8n.js`, `../../backend/src/routes/automatizaciones.js`.

## 1. Backend → n8n por outbox (W1, W3, W6, W8, W11)

```text
POST <N8N_Wx_..._WEBHOOK_URL>          (HTTPS obligatorio salvo localhost, sin usuario:clave en la URL)
Content-Type: application/json
x-automation-timestamp: <marca de tiempo>
x-automation-signature: <HMAC-SHA256 hex con el secreto del workflow>
Authorization: Bearer <secreto>        (solo W6)

<JSON canónico firmado>
```

- Ventana de validez de 5 minutos (`../../backend/README.md`).
- Entrega: worker cada 5 s, timeout 8 s, hasta 8 intentos; espera `min(30 × 2^(intentos−1), 3600)` s; los envíos `procesando` de más de 2 min se reclaman.
- Éxito: 2xx (W11 exige exactamente **202**). Error: se guarda `ultimo_error_code` (sin datos).
- Payloads con datos personales (W8, aviso al titular de W11) se guardan **cifrados** en `automation_outbox.payload` (`payload_cifrado=TRUE`) y solo se descifran al enviar.

| WF | Cuerpo |
|---|---|
| W1 | `{evento:'pago', pedido_id, estado, total, moneda, fecha}` |
| W3 | `{evento:'stock_bajo', fecha}` (deduplicado por día) |
| W6 | `{evento:'asistente.escalado', conversacion_id, motivo: consulta_de_politica\|solicitud_de_atencion, resumen (texto fijo), fecha}` sin el mensaje del usuario |
| W8 | `{evento:'admin.solicitud_cuenta', id, tipo}` (los demás eventos admitidos por el workflow ya no se producen) |
| W11 | Ver la sección W11 de [fichas-workflows-n8n.md](fichas-workflows-n8n.md) |

## 2. Backend → n8n directo (W12)

```text
POST <N8N_REGISTRO_WEBHOOK_URL>
X-Timestamp: <segundos Unix>
X-Signature: hex(HMAC-SHA256(N8N_REGISTRO_SECRET, "<timestamp>.<evento>.<solicitud_id>"))

{"evento":"registro.recibido","solicitud_id":14,"resultado":"coincide"}
```

Sin URL o con secreto de menos de 32 caracteres no se envía nada. Timeout 3 s, sin reintentos.

## 3. n8n → backend

| Endpoint | Autenticación | Cuerpo / respuesta |
|---|---|---|
| `GET /api/automatizaciones/resumen-diario` (W2) | `x-automation-token: <N8N_W2_DAILY_SUMMARY_TOKEN>` | → `{evento, total, moneda, fecha}` |
| `POST /api/automatizaciones/pedidos/expirar` (W4) | `x-automation-token: <N8N_W4_EXPIRY_TOKEN>` | → `{ok:true}` |
| `POST /api/automatizaciones/verificaciones/mantenimiento` (W11) | `x-automation-token: <N8N_W11_MAINTENANCE_TOKEN>` | → `{ok:true, …}` |
| `POST /api/automatizaciones/verificaciones/resultado` (W11) | HMAC con `N8N_W11_CALLBACK_SECRET` + nonce único (anti-repetición, tabla `automation_nonces`) | `{ref, componente:'entidad', metodo, resultado, fuente, consultadoEn, nonce}`; 401 firma, 400 esquema/antigüedad >15 min, 409 nonce o estado, 404 ref |
| `GET /api/asistente/pendientes/resumen-semanal` (W7) | `Authorization: Bearer <ASSISTANT_WEEKLY_SUMMARY_TOKEN>` | → `{periodo_dias, total, por_dia}` |

Tokens: mínimo 32 caracteres, no pueden empezar por `replace_`, comparados con SHA-256 + `timingSafeEqual`; si la variable falta el endpoint responde 503.

## Referencias

- [fichas-workflows-n8n.md](fichas-workflows-n8n.md) · [../08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../08_CONTRATOS_Y_ENDPOINTS_DE_API.md)
