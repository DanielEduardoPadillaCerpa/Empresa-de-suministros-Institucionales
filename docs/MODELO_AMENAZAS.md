# Modelo de amenazas — registro y autorización de compradores

Activos: autorización para comprar (en especial productos restringidos), datos personales y documentos de acreditación, precios institucionales, decisiones administrativas.

| Amenaza | Vector | Control implementado | Prueba |
|---|---|---|---|
| Suplantar una institución al registrarse | Escribir "Policía Nacional" en el formulario | La cuenta nace en `borrador`; precios y compra exigen aprobación humana con evidencia y correo verificado | Integración B, 10.1 |
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
