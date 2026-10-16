# Procesos del negocio

| Campo | Valor |
|---|---|
| ID documental | DOC-02-03 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir los procesos de negocio que el sistema ejecuta realmente, con diagramas y la evidencia de código que los respalda.

## Alcance

Seis procesos principales (P-01 a P-06) y tres procesos de soporte (P-07 a P-09). Solo se modela lo que aparece en el código. Los procesos son **[OBS]** salvo indicación. No hay evidencia de procesos manuales fuera del sistema (despacho físico, facturación, cobro real): quedan **NO DETERMINADO**.

| ID | Proceso | Casos de uso | Evidencia principal |
|---|---|---|---|
| P-01 | Registro y aprobación de cuentas | UC-001, UC-002 | `routes/auth.js` `/registro`, `seguridad/registroVerificado.js`, `routes/solicitudesRegistro.js` |
| P-02 | Inicio de sesión con MFA | UC-003, UC-004, UC-005 | `routes/auth.js` |
| P-03 | Compra de uso general | UC-007 a UC-010 | `routes/checkout.js`, `routes/pagos.js` |
| P-04 | Compra con productos restringidos (verificación institucional) | UC-012, UC-013, UC-014 | `routes/verificacion.js`, `verificacionCompra.js`, `routes/checkout.js` |
| P-05 | Expiración de pedidos y liberación de inventario | UC-023 | `paymentJobs.js`, `routes/automatizaciones.js` |
| P-06 | Emisión y envío de comprobantes | UC-011 | `receiptService.js`, `emailOutbox.js`, `routes/comprobantes.js` |
| P-07 | Sincronización del padrón | UC-023 | `seguridad/padron.js` |
| P-08 | Atención: asistente, calificación, PQRS | UC-019, UC-020 | `routes/asistente.js`, `routes/atencion.js` |
| P-09 | Administración del catálogo y cumplimiento | UC-015 | `routes/productos.js`, `routes/verificacion.js` (`/admin/productos`) |

Todas las rutas de código de este documento son relativas a `../backend/src/`.

## P-01 Registro y aprobación de cuentas

**Regla central:** registrarse no habilita (RN-001). La respuesta al navegador es siempre la misma (RN-004).

```mermaid
flowchart TD
    A["Visitante abre registro.html"] --> B["GET /api/auth/captcha"]
    B --> C["Envía tipo, nombre, NIT, correo, contraseña, aceptaciones y captcha"]
    C --> D{"Captcha válido"}
    D -- No --> D1["400 CAPTCHA_INVALIDO"]
    D -- Sí --> E{"Validación zod"}
    E -- No --> E1["400 con errores por campo"]
    E -- Sí --> F["En paralelo: bcrypt, buscar correo, verificar terna en padrón"]
    F --> G{"Correo ya existe y no está rechazado"}
    G -- Sí --> G1["Correo de aviso al titular existente"]
    G -- No --> H["Lote transaccional: clientes + usuarios pendiente + historial + solicitudes_registro"]
    H --> H1["Aviso W12 registro.recibido en segundo plano"]
    G1 --> R["202 Solicitud recibida"]
    H1 --> R
    R --> I["Admin abre admin-solicitudes.html"]
    I --> J["Detalle descifrado + padrón + verificación repetida"]
    J --> K{"Decisión"}
    K -- Aprobar --> L{"Resultado coincide o confirmar=true"}
    L -- No --> L1["409 CONFIRMACION_REQUERIDA"]
    L -- Sí --> M["solicitud aprobada, usuario activa, auditoría, W12, correo"]
    K -- Rechazar con motivo --> N["solicitud rechazada, usuario rechazada, auditoría, W12, correo con motivo"]
```

- Resultados posibles de la verificación: `coincide`, `nit_no_existe`, `nombre_no_coincide`, `institucion_no_coincide`, `persona_inactiva`, `padron_no_disponible` (`seguridad/padron.js`).
- Una cuenta **rechazada** puede volver a solicitar: el lote `SQL_NUEVA_SOLICITUD` reactiva la cuenta como `pendiente` y crea una nueva solicitud (RN-023).
- Decisión concurrente: el `UPDATE` exige `estado = 'pendiente'`; si otro administrador ya decidió, responde 409 `YA_DECIDIDA`.

## P-02 Inicio de sesión con MFA

```mermaid
flowchart TD
    A["login.html: correo, contraseña, captcha"] --> B{"Captcha válido"}
    B -- No --> B1["400 CAPTCHA_INVALIDO"]
    B -- Sí --> C["Compara contra hash real o de relleno"]
    C --> D{"Contraseña correcta"}
    D -- No --> D1["401 genérico"]
    D -- Sí --> E{"estado_cuenta activa"}
    E -- No --> E1["403 CUENTA_PENDIENTE, RECHAZADA o SUSPENDIDA"]
    E -- Sí --> F{"Menos de 5 retos en 15 min"}
    F -- No --> F1["429"]
    F -- Sí --> G["Reto MFA: guarda HMAC del código, envía correo"]
    G --> H["202 mfaRequired + challengeId"]
    H --> I["Usuario envía código de 6 dígitos"]
    I --> J{"Reto pendiente, vigente y con intentos"}
    J -- Vencido --> J1["410"]
    J -- Sin intentos --> J2["429 y reto bloqueado"]
    J -- Sí --> K{"Código correcto"}
    K -- No --> K1["401 con intentos restantes"]
    K -- Sí --> L["JWT 2 h + refresh 7 días; marca correo verificado"]
    L --> M{"debe_cambiar_password"}
    M -- Sí --> M1["cambiar-password.html"]
    M -- No --> N["Navegación normal"]
```

## P-03 Compra de uso general

**Condición:** cuenta activa (`estado_cuenta = 'activa'`, correo verificado, no suspendida) y producto elegible para la institución del catálogo (RN-009, `autorizacion.js`).

```mermaid
flowchart TD
    A["Catálogo index.html"] --> B["Carrito en localStorage"]
    B --> C["checkout.html: datos del comprador y método"]
    C --> D["POST /api/checkout con Idempotency-Key"]
    D --> E["Transacción: contexto FOR UPDATE, productos e inventario FOR UPDATE"]
    E --> F{"Productos visibles, comprables y con stock"}
    F -- No --> F1["403 o 409"]
    F -- Sí --> G["Pedido pendiente_pago + detalle + reserva de stock + pago creado"]
    G --> H["201 con pedido_id y datos del widget mock"]
    H --> I["POST /api/pagos/dev/simular-webhook"]
    I --> J["Webhook firmado HMAC procesado en servidor"]
    J --> K{"Resultado por centavos"}
    K -- Aprobado --> L["Pedido pagado; comprobante; outbox W1"]
    K -- Rechazado --> M["Pedido rechazado; libera reserva; outbox W1"]
    K -- Pendiente --> N["Pago pendiente hasta expirar"]
    L --> O["historial.html / mis-pedidos.html"]
```

- El precio y el total se calculan con los valores de MySQL (RN-013).
- Las referencias institucionales con `cotizacion_requerida` no se pueden comprar; el motivo se informa como `cotizacion_requerida`.
- **[INF]** El cobro real no existe: el proceso termina en un pago simulado (REQ-F-040, RSK-015).

## P-04 Compra con productos restringidos

```mermaid
flowchart TD
    A["Cliente activo quiere un restringido"] --> B["mi-verificacion.html: entidad, documento CC o CE con autorización, evidencias"]
    B --> C["POST /mi-solicitud/enviar con Idempotency-Key"]
    C --> D["Solicitud de verificación + 3 comprobaciones pendientes"]
    D --> E["Revisor A: vínculo documental"]
    D --> F["Canal independiente: correo institucional o revisor B"]
    D --> G["Entidad: W11 consulta datos.gov.co o revisión manual"]
    E --> H{"Tabla de decisión en servidor"}
    F --> H
    G --> H
    H -- Incompleta --> H1["422 COMPROBACIONES_INCOMPLETAS"]
    H -- Lista --> I["Persona con verificacion.decidir aprueba"]
    I --> J["verificado_hasta = hoy + 365 días"]
    J --> K["Staff con restringidos.autorizar concede autorización"]
    K --> L["Checkout con restringido: 403 REQUIERE_AUTORIZACION_COMPRA"]
    L --> M["POST /api/verificacion/compra/autorizacion: código al correo"]
    M --> N["POST /compra/autorizacion/confirmar"]
    N --> O["POST /api/checkout con autorizacionCompra: se consume en la transacción"]
```

- Cuatro ojos: vínculo y canal deben registrarlos personas distintas (RN-011).
- La autorización se liga al usuario, al cliente y al hash del carrito; si el carrito cambia, el checkout responde 403 con motivo `carrito_distinto`.
- Una revisión legal `pendiente` o `bloqueada` del producto impide la venta (RN-008).

## P-05 Expiración de pedidos

```mermaid
flowchart LR
    A["Job interno cada 60 s"] --> C["expirarPedidosPendientes"]
    B["W4 n8n cada minuto con x-automation-token"] --> C
    C --> D["Pagos creado o pendiente vencidos, lote de 25, FOR UPDATE"]
    D --> E["Pedido y pago expirados"]
    E --> F["Libera inventario reservado"]
```

**[OBS]** Ambos caminos son idempotentes; el job interno garantiza la expiración aunque n8n no esté activo (`paymentJobs.js`). Verificado por `paymentJobs.test` (REQ-F-022).

## P-06 Comprobantes

```mermaid
flowchart LR
    A["Webhook de pago aprobado"] --> B["Misma transacción: comprobante CP-número"]
    B --> C["correo_outbox tipo admin"]
    B --> D{"enviarComprobante en el checkout"}
    D -- Sí --> E["correo_outbox tipo cliente"]
    C --> F["Worker cada 5 s, máx. 5 intentos"]
    E --> F
    F --> G["nodemailer SMTP: enlace HMAC válido 24 h"]
    H["Cliente autenticado"] --> I["GET /api/comprobantes/:pedidoId JSON o PDF"]
    H --> J["POST /reenviar máx. 3 por hora"]
```

## P-07 Sincronización del padrón

**[OBS]** Al arrancar y cada `PADRON_SYNC_MINUTOS` (10 por defecto), el backend lee la fuente (solo `SELECT`), calcula `nit_hash` (HMAC), cifra nombre y entidad, compara una huella para no reescribir filas sin cambios y marca `inactiva` las filas que desaparecen (`seguridad/padron.js`). Estado: IMPLEMENTADO, NO VERIFICADO (REQ-F-003).

## P-08 Atención

- Asistente: reglas locales sobre el índice del catálogo filtrado por `evaluarProducto`; 20 mensajes por minuto por IP; preguntas sin respuesta se guardan en `asistente_pendientes`; escalamiento W6 sin datos personales.
- Calificación 1–5 (`/api/atencion/calificacion`) — sin autenticación ni límite (BUG-002).
- PQRS/soporte/cotización (`/api/atencion/solicitudes`): radicado `SI-00000000`, NIT y correo cifrados, 5 por IP cada 15 min. **[OBS]** No existe en el repositorio una pantalla para que el personal gestione estas solicitudes: su gestión posterior es **NO DETERMINADO**.

## P-09 Catálogo y cumplimiento

- Crear, editar y retirar productos y categorías exige `catalogo.gestionar`; cambiar la restricción o la institución de un producto exige además `productos.cumplimiento` (403 en `routes/productos.js`).
- Elegibilidad M:N y revisión legal se gestionan en `PUT /api/verificacion/admin/productos/:id/cumplimiento` con sustento obligatorio (mínimo 10 caracteres).

## Referencias

- [05_CASOS_DE_USO.md](05_CASOS_DE_USO.md), [07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md](07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md)
- [Reglas de negocio](../01_INGENIERIA_DE_REQUERIMIENTOS/07_REGLAS_DE_NEGOCIO.md)
- [docs/POLITICA_VERIFICACION_IDENTIDAD.md](../docs/POLITICA_VERIFICACION_IDENTIDAD.md), [docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
