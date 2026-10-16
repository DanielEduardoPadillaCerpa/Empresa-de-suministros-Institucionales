# Manual de usuario

| Campo | Valor |
|---|---|
| ID documental | DOC-06-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Explicar a cada tipo de usuario cómo usar las pantallas existentes de la plataforma.

## Alcance

Pantallas de `../frontend/` servidas por el backend (por ejemplo `http://localhost:8081/landing.html` en laboratorio). **[OBS]** Este manual se redactó leyendo el código de las páginas; **no se ejecutó la interfaz ni se tomaron capturas**. Los pasos son PENDIENTE DE VALIDAR con usuarios. Las páginas nuevas solo están en español (BUG-016).

## Roles

| Rol | Actor | Cómo se obtiene |
|---|---|---|
| Visitante | ACT-01 | Sin cuenta |
| Solicitante | ACT-02 | Envió el registro; espera aprobación |
| Cliente | ACT-03 | Cuenta aprobada por un administrador |
| Cliente verificado | ACT-04 | Cliente con verificación institucional aprobada y autorización de restringidos |
| Administrador | ACT-05 | Cuenta de personal con permisos asignados |
| Superadministrador | ACT-06 | Creado por comando del equipo técnico |

## 1. Visitante

- **Portada** (`landing.html`): presentación, productos populares, exploración por industria, enlaces a contacto y políticas.
- **Catálogo** (`index.html`): productos en modo "vitrina" (sin precio ni inventario); los restringidos no aparecen. Filtros por categoría y macrocategoría, asistente de chat.
- **Detalle** (`producto-detalle.html`): descripción y ficha técnica; para comprar se pide iniciar sesión.
- **Contacto** (`contacto.html`): radicar PQRS, soporte o cotización (tipo de entidad, entidad, NIT de 9–10 dígitos, correo, criticidad, mensaje de 20–2000 caracteres y autorización de datos). Se entrega un número de radicado `SI-00000000`.
- **Normatividad** (`leyes.html`): resumen informativo de Ley 1581 de 2012, Ley 1712 de 2014 y Ley 80 de 1993 (no es asesoría jurídica).

## 2. Solicitante: crear la cuenta

1. Abrir **Registro** (`registro.html`) y elegir el tipo de institución.
2. Escribir nombre completo (mínimo dos palabras), NIT de la entidad (con o sin dígito de verificación), institución, correo y contraseña (10 a 72 caracteres, sin contener el usuario del correo).
3. Aceptar los términos y el tratamiento de datos y resolver la operación del captcha (vence en 5 minutos y sirve una vez).
4. Al enviar se muestra "Solicitud recibida". El mensaje es el mismo aunque el correo ya exista.
5. Esperar el correo de aprobación o rechazo. Si inicia sesión antes, verá que la cuenta está en revisión.
6. Si la solicitud se rechaza, el correo indica el motivo y puede registrarse de nuevo con datos correctos.

> [OBS] `registro.html` contiene además secciones heredadas de un formulario anterior por pasos ("Datos de la entidad", "Datos comerciales"…), usadas también en modo edición; qué secciones se muestran lo decide `js/registro-wizard.js`. NO DETERMINADO sin ejecutar la interfaz.

## 3. Cliente

### Iniciar sesión (`login.html`)
1. Correo, contraseña y captcha.
2. Escribir el código de 6 dígitos que llega al correo (vence en 5 min; 5 intentos). Se puede pedir reenvío tras 60 s (máx. 5) o cancelar.
3. La sesión dura 2 h y se renueva automáticamente hasta 7 días.
4. Si la cuenta tiene contraseña inicial, se redirige a **Cambiar contraseña** (`cambiar-password.html`).

### Comprar
1. En el catálogo, agregar productos al carrito (guardado en el navegador).
2. **Checkout** (`checkout.html`): revisar el carrito → "Continuar con mis datos" (se prellenan los datos del perfil; se pueden editar) → elegir si se desea el comprobante por correo → "Crear pedido y simular pago".
3. **[OBS]** El pago es **simulado** (proveedor mock): no se realizan cobros. El resultado depende de los centavos del total (RN-014).
4. Ver el resultado, consultar el estado, descargar el comprobante PDF o pedir su reenvío (máx. 3 por hora).

### Pedidos y reportes
- **Historial de compras** (`historial.html`): seguimiento, cancelación de pedidos permitidos y comprobantes.
- **Historial de pedidos** (`mis-pedidos.html`).
- **Mis reportes y sugerencias** (`mis-reportes.html`): crear, editar y eliminar comentarios con calificación.
- **Asistente**: preguntas sobre productos que el usuario puede ver; calificar la atención de 1 a 5.

### Mi cuenta
- Solo existe la pantalla de cambio de contraseña. Editar el perfil, cambiar el correo, cerrar todas las sesiones y solicitar corrección o eliminación de datos **no tienen pantalla** (BUG-004); hoy deben hacerse por la API o mediante **Contacto**.

## 4. Cliente verificado (productos restringidos)

1. **Mi verificación** (`mi-verificacion.html`): completar "Datos de tu entidad", registrar el "Documento de identidad" (CC o CE, con autorización expresa), adjuntar documentos (PDF/PNG/JPEG, máx. 5 MB, máx. 10) y enviar la solicitud. Allí se ven el estado, las comprobaciones y el historial.
2. La verificación aprobada dura 365 días.
3. Al comprar productos restringidos, el checkout pide un **código de autorización** enviado al correo, válido para ese carrito y una sola vez.

## 5. Administrador (según permisos)

| Pantalla | Uso | Permiso |
|---|---|---|
| `admin-dashboard.html` | Pedidos por día, productos por categoría, últimos pedidos | Varios |
| `admin-solicitudes.html` | Pestañas Pendientes/Aprobadas/Rechazadas; abrir una solicitud ve lo declarado junto al padrón; **Aprobar** (si no coincide, exige confirmación) o **Rechazar** con motivo de 5–500 caracteres. El contador del menú se refresca cada 12 s | `clientes.gestionar` |
| `admin-verificaciones.html` | Cola de verificaciones, comprobaciones, decisión, suspensión, restringidos, cumplimiento de productos, personal y permisos, descarga auditada de documentos | `verificacion.*`, `documentos.ver`, `cuentas.suspender`, `restringidos.autorizar`, `productos.cumplimiento`, `staff.permisos` |
| `admin-productos.html` | Crear, editar, eliminar productos; inventario bajo | `catalogo.gestionar` |
| `admin-pedidos.html` | Pedidos de todos los clientes y resumen financiero | `pedidos.gestionar` |
| `admin-clientes.html` | Clientes, edición, eliminación, compras | `clientes.gestionar` |
| `reportes.html` | Reporte mensual (clientes atendidos, calificación, sugerencias, más vendidos) | Ninguno en el servidor (BUG-001) |

## 6. Superadministrador

Igual que el administrador con todos los permisos excepto `documentos.ver` e `identificadores.ver` (deben concederse explícitamente). Además ve la pestaña **Diagnóstico** en `admin-verificaciones.html` y puede conceder permisos reservados.

## Mensajes frecuentes

| Mensaje | Significado |
|---|---|
| "Tu solicitud de cuenta está en revisión" | Cuenta pendiente de aprobación |
| "El resultado de la verificación no es correcto o ya venció" | Captcha incorrecto o vencido |
| "Debes cambiar tu contraseña inicial" | Contraseña temporal |
| "La sesión fue revocada" | Se cambió correo/contraseña o se suspendió la cuenta |
| "Demasiados intentos…" | Límite por IP; esperar |

## Referencias

- [12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md](12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md)
- [../03_DISENO/09_DISENO_DE_INTERFACES_Y_NAVEGACION.md](../03_DISENO/09_DISENO_DE_INTERFACES_Y_NAVEGACION.md)
- [../docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
