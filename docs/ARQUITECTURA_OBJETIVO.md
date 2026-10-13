# Arquitectura objetivo — verificación institucional y autorización de compra

Principio: **registrarse no autoriza a comprar.** Se separan tres cosas:

| Concepto | Dónde vive | Quién lo fija |
|---|---|---|
| A. Tipo de institución (policía, defensa, bomberos, socorro, penitenciario, corporativo) | `clientes.tipo_institucion` | El solicitante, al registrarse; cambios posteriores pasan por revisión |
| B. Institución concreta (entidad, NIT, dependencia, municipio) | `clientes.nombre_unidad`, `nit`, `datos_registro_cifrados` | El solicitante; el revisor la contrasta con la evidencia |
| C. Usuario y autorización (estado, institución aprobada, restringidos) | `clientes.estado_verificacion`, `institucion_aprobada`, `autorizacion_general` | Solo personal con el permiso correspondiente |

## Flujo

```
registro.html (5 pasos) ──POST /api/auth/registro──► cuenta en BORRADOR
        │
login.html + código MFA ─────────────────────────► correo verificado (usuarios.correo_verificado_en)
        │
mi-verificacion.html ── documentos cifrados ── "Enviar a revisión" ──► PENDIENTE
        │
admin-verificaciones.html (permiso verificacion.decidir)
        ├─ aprobar ─────────────► APROBADO (institucion_aprobada = tipo)
        ├─ pedir información ──► REQUIERE_INFORMACION ── el titular corrige y reenvía
        └─ rechazar ───────────► RECHAZADO ── hasta 3 reenvíos
APROBADO ──(cuentas.suspender)──► SUSPENDIDO (cierra todas las sesiones) ──► reactivar
```

Transiciones en `backend/src/verificacion.js` (`TRANSICIONES`). Cada una escribe `verificacion_historial` y, si la hace el staff, `auditoria`.

Requisitos para enviar y para aprobar: tipo definido, correo verificado por MFA y documentos obligatorios del tipo. Un correo del dominio institucional (p. ej. `@policia.gov.co`), ya verificado, exime del documento de vinculación, **no** de la revisión humana. La configuración de campos y documentos por tipo está en `backend/src/registroInstitucional.js` y se publica en `GET /api/auth/registro/tipos`, de modo que frontend y backend usan la misma fuente.

## Servicio central de autorización

`backend/src/autorizacion.js`:

- `obtenerContexto(usuarioToken)` lee de MySQL rol, estado, institución aprobada y autorización de restringidos. El JWT solo identifica a la persona.
- `evaluarProducto(producto, ctx)` devuelve `{ visible, nivel, puedeComprar, motivo }`. Lo usan **todas** las vías: listado y detalle (`productos.js`), checkout dentro de la transacción con `FOR UPDATE` (`checkout.js`) y asistente (`asistente.js`).
- `requierePermiso(...)` valida permisos de staff leídos de `staff_permisos`.

| Solicitante | Producto general no restringido | Producto de su institución | Producto de otra institución | Producto restringido |
|---|---|---|---|---|
| Visitante | Vitrina (sin precio ni stock) | Vitrina | Vitrina | **No existe (404)** |
| Cuenta no aprobada | Vitrina, motivo `cuenta_no_aprobada` | Vitrina | Vitrina | **No existe (404)** |
| Aprobada | Completo y comprable | Completo y comprable | **No existe (404)** | Visible si es elegible; compra solo con autorización de restringidos y `revision_legal = aprobada` |
| Staff | Completo, no compra | | | |

`revision_legal` en `pendiente` o `bloqueada` impide la venta (política preventiva); `bloqueada` además lo oculta. La elegibilidad es muchos-a-muchos: institución principal (`productos.institucion_id`) + `productos_elegibilidad`.

## Roles administrativos

| Permiso | Facultad |
|---|---|
| `verificacion.ver` | Consultar solicitudes y sus datos |
| `verificacion.decidir` | Aprobar, rechazar, pedir información, resolver cambios de tipo |
| `documentos.ver` | Descargar documentos (cada descarga queda auditada; si la auditoría falla, no se entrega) |
| `cuentas.suspender` | Suspender y reactivar |
| `restringidos.autorizar` | Conceder o revocar productos restringidos |
| `productos.cumplimiento` | Restricción, elegibilidad y revisión legal de productos |
| `staff.permisos` | Crear personal y asignar permisos (no puede quitarse este permiso a sí mismo) |

El rol `admin` existente se conserva para las funciones previas (productos, pedidos, clientes). Los administradores que existían antes de la migración recibieron todos los permisos; el personal nuevo empieza sin ninguno.

## Endpoints nuevos

| Método y ruta | Acceso |
|---|---|
| `GET /api/auth/registro/tipos` | Público |
| `GET /api/verificacion/mi-solicitud` | Titular |
| `POST /api/verificacion/mi-solicitud/documentos` (multipart) · `GET`/`DELETE …/documentos/:id` | Titular |
| `POST /api/verificacion/mi-solicitud/enviar` · `POST …/clasificacion` | Titular |
| `GET /api/verificacion/admin/mis-permisos` | Staff |
| `GET /api/verificacion/admin/solicitudes[?estado&tipo&desde&hasta&q&cambio]` · `GET …/:clienteId` | `verificacion.ver` |
| `POST …/solicitudes/:id/decision` · `POST …/:id/cambio-tipo` | `verificacion.decidir` |
| `POST …/solicitudes/:id/suspension` | `cuentas.suspender` |
| `POST …/solicitudes/:id/restringidos` | `restringidos.autorizar` |
| `GET /api/verificacion/admin/documentos/:id` | `documentos.ver` |
| `GET …/admin/productos` · `PUT …/admin/productos/:id/cumplimiento` | `productos.cumplimiento` |
| `GET …/admin/permisos` · `PUT …/admin/permisos/:usuarioId` · `POST …/admin/personal` | `staff.permisos` |

Contratos que cambiaron: `POST /api/auth/registro` exige `tipoInstitucion` y los campos de ese tipo (el formato anterior responde 400); las respuestas de login y refresh agregan `estadoVerificacion` y `tipoInstitucion`, e `institucionId` es `null` mientras la cuenta no esté aprobada; los productos agregan `acceso` y `revision_legal`.
