# Flujo n8n W11: orquestación de la verificación

Archivo: `n8n/workflows/W11-verificacion-compra.json`, generado con `node n8n/generar-w11.js`. El código de los nodos se revisa en el generador. Como el resto de los workflows del repositorio, se entrega **inactivo** (`active: false`).

**No se importó ni se ejecutó en el n8n local**: la API de n8n rechazó la `N8N_API_KEY` disponible (401). Su lógica se probó ejecutando el código de sus nodos en `test/verificacion-compra.test.js`, y el contrato con el backend se probó con respuestas firmadas en `compra-verificada.int.spec.js`.

## 1. Qué hace y qué no hace

n8n **coordina**: consulta la entidad en datos.gov.co, avisa al equipo y al titular y dispara el mantenimiento. **No decide.**

- No recibe cédulas, nombres, documentos ni el id interno del cliente.
- No puede aprobar ni rechazar.
- Solo puede informar el resultado del componente `entidad`. El backend lo valida y lo trata como un insumo más de la tabla de decisión.

## 2. Disparadores

### a) Webhook `POST /webhook/verification-events` (eventos del backend por el *outbox*)

Firma HMAC-SHA256 con `N8N_W11_SECRET` sobre `timestamp.cuerpo`, ventana de 5 minutos. El nodo "Verificar firma y repartir" exige las claves exactas de cada evento:

| Evento | Claves | Origen | Tareas generadas |
|---|---|---|---|
| `verificacion.solicitada` | `evento, ref, tipoInstitucion, consultarEntidad, [nit], timestamp` | Envío o renovación de una solicitud; reintentos del mantenimiento | `entidad` (si `consultarEntidad`) y `aviso_staff` |
| `verificacion.requiere_revision` | `evento, ref, motivo, timestamp` | Una comprobación deja la solicitud no concluyente | `aviso_staff` |
| `verificacion.actualizada` | `email, estado, evento, timestamp` (payload cifrado en el outbox) | Aprobación, rechazo o pedido de información | `aviso_titular` |

El `nit` solo viaja si es de **persona jurídica** (9 dígitos que empiezan por 8 o 9). Los NIT de personas naturales contienen la cédula y nunca salen del backend. El nodo lo vuelve a validar.

### b) Programado cada 15 minutos → `POST /api/automatizaciones/verificaciones/mantenimiento`

Con la cabecera `x-automation-token: N8N_W11_MAINTENANCE_TOKEN`. El mantenimiento:

- reintenta las consultas de entidad sin respuesta (más de 10 minutos, hasta 5 intentos);
- expira las solicitudes de más de 30 días y las autorizaciones de compra vencidas;
- depura los nonces de más de 24 horas.

Es idempotente. El backend corre el mismo proceso cada 5 minutos por si n8n no está activo.

## 3. Consulta de la entidad

1. `GET https://www.datos.gov.co/resource/5c7g-ptic.json` (CHIP) con `$select=nit,razon_social,a_o`, `$where=starts_with(nit, '<nit>:')`, `$order=a_o DESC` y `$limit=5`.
2. `GET https://www.datos.gov.co/resource/c82u-588k.json` (RUES) con `$select=razon_social,nit,estado_matricula,ultimo_ano_renovado` (sin columnas personales), `nit=<nit>` y `$limit=5`.
3. Ambas peticiones llevan `X-App-Token: DATOS_GOV_APP_TOKEN` si existe, con un timeout de 10 segundos y sin fallar ante errores HTTP: el error se clasifica.

Clasificación (nodo "Clasificar y firmar resultado"):

| Situación | Resultado |
|---|---|
| Entidad pública con NIT en CHIP del año actual o el anterior | `confirmado` (fuente `datos.gov.co/5c7g-ptic`) |
| Matrícula RUES `ACTIVA` y renovada el año actual o el anterior | `confirmado` (fuente `datos.gov.co/c82u-588k`) |
| Matrícula RUES activa pero sin renovar | `ambiguo` |
| Matrícula RUES no activa y sin CHIP vigente | `no_coincide` |
| No aparece en ninguna | `datos_insuficientes` (**la ausencia no es fraude**) |
| Ambas fuentes caídas (5xx, 429, red) | `fuente_no_disponible` |
| Respuestas sin el formato esperado | `respuesta_invalida` |

## 4. Respuesta al backend

`POST {BACKEND_BASE_URL}/api/automatizaciones/verificaciones/resultado`:

```json
{ "ref": "<32 hex>", "componente": "entidad", "metodo": "registro_publico",
  "resultado": "confirmado", "fuente": "datos.gov.co/5c7g-ptic",
  "consultadoEn": "2026-10-13T20:00:00.000Z", "nonce": "<48 hex>" }
```

Va firmada con HMAC-SHA256 usando **`N8N_W11_CALLBACK_SECRET`**, un secreto distinto del de ida. El backend la rechaza (sin cambiar nada) si:

- la firma no es válida o tiene más de 5 minutos (401);
- el esquema no es exacto: otro componente, campos extra, una fuente que no está en la lista o un `confirmado` sin fuente (400);
- `consultadoEn` tiene más de 15 minutos (400);
- el nonce ya se usó (409);
- la `ref` no existe, venció o está cerrada (404);
- la comprobación no esperaba un resultado automático (409).

## 5. Avisos por correo

- **Equipo** (`ADMIN_ALERT_FROM` → `ADMIN_ALERT_TO`): "revisión pendiente" con los 8 primeros caracteres de la referencia, sin datos personales.
- **Titular** (`VERIFICATION_FROM_EMAIL` o `MFA_FROM_EMAIL`): "Novedades sobre tu verificación". No dice el motivo ni qué fuente falló; el detalle se ve en *Mi verificación* después de iniciar sesión.

El aviso de **bienvenida** sigue siendo el inicio de sesión con código, que confirma el correo. La verificación para comprar es otro proceso y no se confunde con la confirmación del registro.

## 6. Variables en n8n

| Variable | Uso |
|---|---|
| `N8N_W11_SECRET` | Verificar los eventos del backend (igual a la del backend) |
| `N8N_W11_CALLBACK_SECRET` | Firmar las respuestas (igual a la del backend; distinta de la anterior) |
| `N8N_W11_MAINTENANCE_TOKEN` | Llamar al mantenimiento |
| `BACKEND_BASE_URL` | URL HTTPS del backend |
| `DATOS_GOV_APP_TOKEN` | Opcional; evita compartir el cupo por IP de datos.gov.co |
| `ADMIN_ALERT_FROM`, `ADMIN_ALERT_TO`, `VERIFICATION_FROM_EMAIL` o `MFA_FROM_EMAIL` | Correos |

Los nodos de código usan `require('crypto')`, así que n8n necesita `NODE_FUNCTION_ALLOW_BUILTIN=crypto` (igual que W8). La configuración guarda `saveDataSuccessExecution: none` y `saveDataErrorExecution: none` para no conservar los datos de las ejecuciones.

## 7. Activación

1. Importar el JSON en n8n y asignar la credencial SMTP "SMTP para cuenta".
2. Definir las variables de la sección 6 en n8n y, en el backend, `N8N_W11_VERIFICATION_WEBHOOK_URL` (URL de producción del webhook, nunca `/webhook-test/`), `N8N_W11_SECRET`, `N8N_W11_CALLBACK_SECRET` y `N8N_W11_MAINTENANCE_TOKEN`.
3. Activar el workflow y comprobar en *Diagnóstico* (superadministrador) que `w11Eventos`, `w11Respuestas` y `w11Mantenimiento` aparecen configurados.
4. Enviar una solicitud de prueba con una cuenta sintética y verificar que la comprobación `entidad` cambia de estado.
