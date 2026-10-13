# Modelo de amenazas — registro y autorización de compradores

Activos: autorización para comprar (en especial productos restringidos), datos personales y documentos de acreditación, precios institucionales, decisiones administrativas.

| Amenaza | Vector | Control implementado | Prueba |
|---|---|---|---|
| Suplantar una institución al registrarse | Escribir "Policía Nacional" en el formulario | Desde la migración 002 la cuenta nace activa **solo para uso general**. Los productos restringidos exigen una verificación con doble comprobación y una autorización por compra | Integración B, `compra-verificada` 1–3 |
| Saltarse requisitos cambiando el tipo en la petición | Enviar campos de otro tipo u omitir los propios | Esquema `zod` estricto por tipo en el servidor; campos ajenos → 400 | 10.1 |
| Autoasignarse privilegios | `rol`, `clienteId`, `autorizacionGeneral`, `estadoVerificacion` en el cuerpo | Rechazados por el esquema estricto; el servidor fija `borrador` y `FALSE` | 10.1 manipulación |
| Acceso horizontal a otra institución | Cambiar el id de producto en URL o carrito | `evaluarProducto` en listado, detalle, asistente y checkout; respuesta igual a inexistente | C, E |
| Enumerar productos restringidos | Listado, detalle, búsqueda o asistente como visitante | Restringidos ocultos salvo cuenta aprobada y elegible | A, B, regresión asistente |
| Token vigente tras perder la autorización | Seguir comprando con un JWT emitido antes | Estado y autorización se leen de MySQL en cada decisión; la suspensión incrementa `session_version` y revoca refresh tokens | G, I |
| Carrera entre la validación y la compra | Revocar o cambiar elegibilidad durante el checkout | Contexto y productos leídos con `FOR UPDATE` en la misma transacción | K |
| Manipular precio | Enviar `precio` en el carrito | El total se calcula con precios de MySQL | L |
| Escalada vertical entre administradores | Admin sin permiso aprueba, cambia reglas o se da permisos | `requierePermiso` desde `staff_permisos`; restricción e institución de productos y restringidos de clientes exigen permiso | H, unitarias PUT clientes |
| Fuga de documentos | Descargar documentos de otro cliente o por URL pública | Archivos cifrados fuera de carpetas estáticas, nombres aleatorios; descarga del titular limitada a su `cliente_id`; staff requiere `documentos.ver` y queda auditado | J |
| Archivo malicioso | Ejecutable renombrado `.pdf`, PDF con JavaScript | Validación por firma (PDF/PNG/JPEG), rechazo de marcadores de contenido activo, 5 MB, 10 por cliente, descarga `attachment` + `nosniff` + CSP `sandbox` | 10.1 archivos |
| Abuso del registro y fuerza bruta | Scripts masivos | Límites por IP en registro (10/h), login, MFA y subidas | Configurable |
| Reutilización de código MFA | Reenviar un código usado | Sin cambios: código de un solo uso, 5 min, 5 intentos | Pruebas existentes |
| Inyección SQL | Parámetros de filtro | Consultas parametrizadas; validación de fechas, estados, ids | Revisión de código |
| XSS en paneles | Datos del solicitante renderizados | Escape de todo dato dinámico en las páginas nuevas | Revisión de código |
| Exposición de secretos | Logs, respuestas | No se registran contraseñas, códigos ni tokens; se eliminó la impresión de la contraseña del administrador inicial | Revisión de código |

## Riesgos residuales

- Un revisor con `verificacion.decidir` puede aprobar erróneamente: la decisión queda auditada con autor, fecha y motivo.
- El correo institucional prueba control del buzón, no facultades de compra: por eso solo exime del documento de vinculación, nunca de la revisión.
- Sin antivirus ni cabeceras CSP/HSTS globales; JWT en `localStorage` (ver auditoría).
- No se encontró una API oficial para validar la pertenencia a cada institución; la verificación es documental.

## Verificación en la compra (migración 002, 2026-10-13)

Activos nuevos: documento de identidad, resultados de las comprobaciones, autorizaciones de compra, canal con n8n y cuenta de superadministrador.

| Amenaza | Vector | Control implementado | Prueba |
|---|---|---|---|
| Robo de la base y enumeración de cédulas | Volcado de MySQL | Número cifrado AES-256-GCM (`v2`) con clave fuera de la base; índice HMAC con una clave independiente (no un SHA-256 simple) | `verificacion-compra.test` (HMAC, cifrado); `compra-verificada` 17 |
| Alteración de datos cifrados | Modificar `numero_cifrado` o un archivo | GCM autentica; `DECRYPT_FAILED` sin devolver el texto cifrado | `verificacion-compra.test` |
| Respuesta falsa de n8n o de un tercero | `POST /verificaciones/resultado` con `verified: true` | HMAC propio del canal de vuelta, ventana de 5 min, nonce único, esquema estricto, solo el componente `entidad`, sin poder de aprobación | `compra-verificada` 10, 10b |
| Compromiso de n8n | Atacante controla el workflow | n8n no tiene datos personales ni capacidad de aprobar; lo peor que puede hacer es marcar la entidad como confirmada, y aún hacen falta el vínculo documental y el canal independiente confirmados por personas | Diseño + 10 |
| Aprobación con una sola persona | Revisor corrupto o equivocado | Cuatro ojos entre la revisión documental y la confirmación institucional; tabla de decisión en el servidor | `compra-verificada` "cuatro ojos" |
| Reutilizar una aprobación | Otro usuario, otro carrito, otra vez, vencida | Autorización ligada al usuario, al cliente y al hash del carrito, de un solo uso, 15 min y consumida en la transacción del pedido | `compra-verificada` 11, 11b |
| Robo de sesión para comprar restringidos | JWT robado (por ejemplo, por XSS) | Además de la sesión, cada compra restringida exige un código enviado al correo | `compra-verificada` 5, 6 |
| Fuerza bruta del código de compra | Probar 10^6 códigos | 5 intentos por autorización, 5 autorizaciones por usuario cada 15 min, 20 peticiones por IP cada 15 min | `compra-verificada` límite |
| Escalada a superadministrador | Admin con `staff.permisos` se concede todo | Permisos reservados; solo se conceden o retiran los propios; no puede tocar a superadministradores ni a sí mismo | `compra-verificada` 15 |
| Superadministrador como puerta trasera | Credencial conocida o creada por HTTP | Solo por comando con confirmación de la base; contraseña aleatoria o propia; cambio obligatorio; MFA; auditado | `compra-verificada` 16 |
| Abuso del superadministrador sobre datos personales | Ver cédulas o documentos | No los tiene por defecto; concesión explícita y justificación auditada en cada acceso | `compra-verificada` 16b |
| Cuentas de prueba usadas en producción | Script contra la base real | El script se niega por `NODE_ENV` y por nombre de base; las cuentas sintéticas no compran en producción | `compra-verificada` 9.3 |
| Secretos débiles en producción | Valores "cambia…" en `.env` | El arranque en producción falla (`configSegura.js`) | `verificacion-compra.test` |
| Duplicidad de identidad | Misma cédula en varias cuentas | Índice HMAC → aviso al revisor (no bloqueo automático) | `compra-verificada` 17 |

### Riesgos residuales nuevos

- La evidencia documental puede falsificarse con calidad. Lo mitiga el segundo canal independiente, pero no lo elimina. Hace falta un convenio con fuentes oficiales para reducirlo.
- El correo institucional prueba el control del buzón, no las facultades de compra.
- El código de compra va al mismo correo que el MFA: si el buzón está comprometido, ambos factores caen juntos. Un segundo factor distinto (TOTP o llave) queda pendiente.
- Los datos cifrados con la clave heredada (`CRYPTO_KEY` débil) siguen así hasta ejecutar un recifrado (pendiente).
