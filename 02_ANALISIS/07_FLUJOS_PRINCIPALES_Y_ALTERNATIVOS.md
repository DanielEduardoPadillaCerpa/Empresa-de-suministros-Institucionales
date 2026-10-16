# Flujos principales y alternativos

| Campo | Valor |
|---|---|
| ID documental | DOC-02-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Representar con diagramas de secuencia los flujos críticos, incluidos los caminos de error, los permisos insuficientes y los casos límite que el código maneja explícitamente.

## Alcance

Ocho flujos (FL-01 a FL-08) y una tabla de casos límite. Los códigos HTTP y las condiciones son **[OBS]** en `backend/src/routes/*.js`. Se complementa con [06_ESPECIFICACION_DE_CASOS_DE_USO.md](06_ESPECIFICACION_DE_CASOS_DE_USO.md).

## FL-01 Registro (UC-001)

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitante
    participant F as registro.html
    participant API as Backend /api/auth
    participant DB as MySQL
    participant M as SMTP
    participant N as n8n W12
    V->>F: Completa el formulario
    F->>API: GET /captcha
    API-->>F: 200 id y svg
    F->>API: POST /registro
    alt Captcha incorrecto o reutilizado
        API-->>F: 400 CAPTCHA_INVALIDO
    else Datos inválidos
        API-->>F: 400 errores por campo
    else Más de 10 registros por hora desde la IP
        API-->>F: 429 RATE_LIMITED
    else Claves de cifrado ausentes
        API-->>F: 503
    else Correo ya registrado
        API->>M: Aviso al titular del correo
        API-->>F: 202 Solicitud recibida
    else Registro nuevo
        API->>DB: Lote transaccional con cliente, usuario pendiente y solicitud
        API--)N: registro.recibido firmado, 3 s máximo
        API-->>F: 202 Solicitud recibida
    end
```

**Caso límite:** la respuesta `202` es idéntica para correos nuevos y existentes (RN-004); el aviso a n8n nunca bloquea la respuesta y un fallo solo queda en el log.

## FL-02 Aprobación de la solicitud (UC-002)

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador
    participant P as admin-solicitudes.html
    participant API as Backend /api/admin/solicitudes
    participant DB as MySQL
    A->>P: Abre la solicitud
    P->>API: GET /:id
    API->>DB: Autoriza y lee la solicitud cifrada
    API-->>P: 200 declarado, padrón y resultado actual
    A->>P: Aprobar
    P->>API: POST /:id/aprobar
    API->>DB: Un lote con validación del admin y UPDATE condicionado
    alt Sesión revocada
        API-->>P: 401
    else Sin rol admin, sin permiso o con contraseña inicial pendiente
        API-->>P: 403
    else No coincide y sin confirmar
        API-->>P: 409 CONFIRMACION_REQUERIDA
    else Otro administrador ya decidió
        API-->>P: 409 YA_DECIDIDA
    else Aplicada con affectedRows 2
        API-->>P: 200 aprobada
        API--)DB: Auditoría aprobar_registro
    end
```

## FL-03 Inicio de sesión con MFA (UC-003)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant L as login.html
    participant API as Backend /api/auth
    participant DB as MySQL
    participant M as SMTP
    U->>L: Correo, contraseña y captcha
    L->>API: POST /login
    API->>DB: Busca el usuario
    alt Correo inexistente o contraseña incorrecta
        API-->>L: 401 genérico, mismo tiempo por hash de relleno
    else Cuenta pendiente, rechazada o suspendida
        API-->>L: 403 con código del estado
    else Más de 5 retos en 15 minutos
        API-->>L: 429
    else Correcto
        API->>DB: Reto con HMAC del código
        API--)M: Código de 6 dígitos
        API-->>L: 202 challengeId
    end
    U->>L: Código recibido
    L->>API: POST /mfa/verificar
    alt Código vencido
        API-->>L: 410
    else Intentos agotados
        API-->>L: 429 y reto bloqueado
    else Código incorrecto
        API-->>L: 401 con intentos restantes
    else Cuenta suspendida entre paso 1 y 2
        API-->>L: 401
    else Correcto
        API->>DB: Refresh token, reto verificado, correo verificado
        API-->>L: 200 token, refreshToken, debeCambiarPassword
    end
```

## FL-04 Petición autenticada y revocación (UC-004)

```mermaid
sequenceDiagram
    autonumber
    participant B as Navegador
    participant MW as requiereAutenticacion
    participant DB as MySQL
    participant R as Ruta protegida
    B->>MW: Authorization Bearer JWT
    MW->>MW: Verifica firma HS256 y mfa true
    MW->>DB: session_version, estado_cuenta, rol, debe_cambiar_password
    alt Versión distinta
        MW-->>B: 401 sesión revocada
    else Cuenta no activa
        MW-->>B: 403 CUENTA_NO_ACTIVA
    else Contraseña inicial pendiente
        MW-->>B: 403 PASSWORD_CHANGE_REQUIRED
    else Base no disponible
        MW-->>B: 503
    else Válida
        MW->>R: Continúa con el rol leído de la base
    end
```

## FL-05 Checkout y pago mock (UC-009)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant K as checkout.html
    participant API as Backend /api/checkout
    participant PG as Backend /api/pagos
    participant DB as MySQL
    C->>K: Confirma la compra
    K->>API: POST con Idempotency-Key
    API->>DB: START TRANSACTION y contexto FOR UPDATE
    alt Clave ya usada con otro contenido
        API-->>K: 409
    else Cuenta no habilitada
        API-->>K: 403 CUENTA_NO_ACTIVA
    else Producto no disponible o sin inventario
        API-->>K: 409
    else Restringido sin autorización por compra
        API-->>K: 403 REQUIERE_AUTORIZACION_COMPRA
    else Correcto
        API->>DB: Pedido pendiente_pago, detalle, reserva y pago creado
        API-->>K: 201 pedido_id
    end
    K->>PG: POST /dev/simular-webhook
    PG->>PG: Firma el evento según los centavos del total
    PG->>DB: Aplica el evento con deduplicación por event_id
    alt Aprobado
        PG->>DB: Pedido pagado, comprobante y outbox
    else Rechazado
        PG->>DB: Pedido rechazado y reserva liberada
    else Timeout simulado
        PG-->>K: 504
    end
    PG-->>K: 200 ok
    K->>PG: GET /:pedidoId/estado
    PG-->>K: Estado del pedido y del pago
```

**Casos límite:** un reintento con la misma `Idempotency-Key` y el mismo contenido devuelve `200` con el pedido existente; en producción o con `PAYMENT_MODE≠mock` la simulación responde `404`.

## FL-06 Verificación y autorización de compra restringida (UC-012 a UC-014)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    actor RA as Revisor A
    actor RB as Revisor B
    participant API as Backend /api/verificacion
    participant N as n8n W11
    participant DB as MySQL
    C->>API: POST /mi-solicitud/enviar
    alt Requisitos incompletos
        API-->>C: 422 requisitos
    else Reenvíos agotados tras rechazo
        API-->>C: 409
    else Correcto
        API->>DB: Solicitud y tres comprobaciones pendientes
        API--)N: verificacion.solicitada firmada
    end
    N->>API: POST /api/automatizaciones/verificaciones/resultado
    alt Firma inválida o antigua
        API-->>N: 401
    else Nonce repetido
        API-->>N: 409
    else Válido
        API->>DB: Comprobación entidad
    end
    RA->>API: Comprobación vinculo_documental
    RB->>API: Comprobación canal_independiente
    RA->>API: POST /admin/solicitudes/id/decision aprobar
    alt Comprobaciones incompletas o misma persona
        API-->>RA: 422 COMPROBACIONES_INCOMPLETAS
    else Completa
        API->>DB: Aprobado y verificado_hasta
    end
    C->>API: POST /compra/autorizacion
    API-->>C: 201 referencia, código al correo
    C->>API: POST /compra/autorizacion/confirmar
    C->>API: POST /api/checkout con autorizacionCompra
    alt Carrito distinto
        API-->>C: 403 carrito_distinto
    else Coincide
        API->>DB: Autorización consumida con el pedido
    end
```

## FL-07 Automatizaciones con token (UC-023)

```mermaid
sequenceDiagram
    autonumber
    participant N as n8n
    participant API as Backend /api/automatizaciones
    participant DB as MySQL
    N->>API: POST /pedidos/expirar con x-automation-token
    alt Variable no configurada o menor de 32 caracteres
        API-->>N: 503
    else Token distinto
        API-->>N: 401
    else Correcto
        API->>DB: Expira pagos vencidos y libera reservas
        API-->>N: 200 ok
    end
```

## FL-08 Cancelación de pedido (UC-010)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant API as Backend /api/pedidos
    participant DB as MySQL
    C->>API: PUT /id/cancelar
    API->>DB: Pago y pedido FOR UPDATE
    alt No existe
        API-->>C: 404
    else Pedido de otro cliente
        API-->>C: 403
    else Estado distinto de pendiente o pendiente_pago
        API-->>C: 400
    else Cambió durante la operación
        API-->>C: 409
    else Correcto
        API->>DB: Pedido cancelado, pago expirado, reserva liberada
        API-->>C: 200 ok
    end
```

## Tabla de casos límite y códigos

| Situación | Código | Ruta | Fundamento |
|---|---|---|---|
| Endpoint retirado de creación de pedidos | 410 | `POST /api/pedidos`, `POST /api/pagos/procesar` | Pedidos solo por checkout |
| Código MFA o de cambio de correo vencido | 410 | `/api/auth/mfa/verificar`, `/api/mi-cuenta/correo/confirmar` | Vigencia de 5 min |
| Reto de reenvío vencido | 410 | `/api/auth/mfa/reenviar` | — |
| Producto oculto, restringido no elegible o de otra institución | 404 | `GET /api/productos/:id` | Respuesta idéntica a inexistente (no revela) |
| Documento de otro titular | 404 | `/api/verificacion/mi-solicitud/documentos/:id` | Limitado al `cliente_id` |
| Admin intenta comprar | 403 | `POST /api/checkout` | Staff no compra |
| Cambio de restricción sin `productos.cumplimiento` | 403 | `PUT /api/productos/:id` | Escalada vertical |
| Quitarse `staff.permisos` | 409 | `PUT /api/verificacion/admin/permisos/:usuarioId` | RN-017 |
| Cambio de estado de pago manual | 409 | `PUT /api/pedidos/:id` | Solo por evento verificado |
| JSON mal formado | 400 | Todas | Manejador de errores de `app.js` |
| Cuerpo demasiado grande | 413 | `/api/auth`, `/api/admin/solicitudes` (10 kb), resto (100 kb) | `app.js` |
| Base de datos no disponible al validar sesión o permisos | 503 | Middlewares | Fallo cerrado |
| Automatización sin configurar | 503 | `/api/automatizaciones/*`, resumen semanal | Fallo cerrado |
| Reporte mensual sin sesión | **200** | `GET /api/reportes/mensual` | **BUG-001** |

## Referencias

- [03_PROCESOS_DEL_NEGOCIO.md](03_PROCESOS_DEL_NEGOCIO.md)
- [Pruebas funcionales](../05_PRUEBAS/04_PRUEBAS_FUNCIONALES.md)
- [Diseño de API](../03_DISENO/08_DISENO_DE_API.md)
