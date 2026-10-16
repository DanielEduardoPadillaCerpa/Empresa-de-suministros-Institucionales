# Pruebas de seguridad

| Campo | Valor |
|---|---|
| ID documental | DOC-05-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir los casos de seguridad TC-201…TC-212, su estado real y los hallazgos obtenidos por inspección de código en esta auditoría.

## Alcance

Controles de aplicación del backend y del frontend. **No** se realizaron ataques, escaneos ni pruebas contra servicios externos o la base de Clever Cloud; ningún hallazgo fue explotado. Este documento no es un informe de pruebas de penetración ni certifica la seguridad del sistema.

## 1. Casos

| TC | Objetivo | Resultado esperado | Evidencia | Estado |
|---|---|---|---|---|
| TC-201 | Escalada horizontal: leer o modificar datos de otro cliente | 404/403; nunca datos ajenos | `mi-cuenta.spec.js` («GET devuelve únicamente el perfil asociado al cliente del JWT»), `assistant.spec.js` («el estado consulta únicamente pedidos del cliente autenticado»), `account-registration-phase0.spec.js` («un cliente no puede enviar datos sensibles a otro cliente»). Documentos ajenos e ids de otra institución: histórico (integración C, E, J) | APROBADO (parcial) |
| TC-202 | Escalada vertical: administrador sin permiso concede restringidos, gestiona clientes o resuelve solicitudes | 403 | `account-registration-phase0.spec.js` («un administrador sin el permiso no puede conceder restringidos (escalada vertical)», «un administrador sin el permiso clientes.gestionar no gestiona clientes…»), `mi-cuenta.spec.js` («un administrador sin clientes.gestionar no resuelve solicitudes de cuenta») | APROBADO |
| TC-203 | Enumeración de correos | Registro con correo existente = misma respuesta 202; login sin revelar existencia | `account-registration-phase0.spec.js` («un correo ya registrado recibe exactamente la misma respuesta»). Igualdad de tiempos del login con hash de relleno: no medida | APROBADO (registro) |
| TC-204 | Fuerza bruta del código MFA de inicio de sesión | Bloqueo tras 5 intentos; 15 verificaciones/IP/15 min | `backend/src/routes/auth.js` (`MFA_INTENTOS_MAXIMOS = 5`, `limitarVerificacionMfa`). El análogo para cambio de correo pasó («código incorrecto, vencido y reutilizado no actualizan el correo») | NO EJECUTADO |
| TC-205 | Manipulación de precio o cantidad en el checkout | Total con precio de MySQL | Histórico integración L | BLOQUEADO (MySQL de pruebas) |
| TC-206 | Webhook de pago con firma inválida o vencida | 401; sin cambio de estado | `backend/src/paymentProvider.js`, `routes/pagos.js`; firmas de automatización sí pasaron («automation signatures verify payload, timestamp, and tampering») | BLOQUEADO |
| TC-207 | Repetición de respuestas de n8n (nonce, ventana de 5 min) | 409 por nonce repetido; 401 por firma | Histórico `compra-verificada` 10, 10b; firma de W11 sí pasó («W11 valida la firma…») | BLOQUEADO |
| TC-208 | Acceso sin autenticación a `GET /api/reportes/mensual` | 401 sin sesión | Inspección: la ruta no tiene middleware de autenticación (BUG-001) | NO EJECUTADO — hallazgo por inspección |
| TC-209 | XSS almacenado en paneles (datos del solicitante) | Datos escapados | Revisión pendiente de `frontend/admin-*.html`; widget del asistente con «tarjeta DOM segura» pasó | NO EJECUTADO |
| TC-210 | Inyección SQL en filtros (`estado`, `entidad`, `limite`, búsquedas) | Consultas parametrizadas, sin error ni fuga | Inspección: `mysql2` con `?` en las rutas revisadas; `assistant.spec.js` («rechaza mensajes de inyección sin consultar tablas ajenas») cubre el asistente | NO EJECUTADO |
| TC-211 | Subida de archivos maliciosos (ejecutable renombrado, PDF con JavaScript, >5 MB) | 400; archivo no almacenado | Histórico integración 10.1 archivos | BLOQUEADO |
| TC-212 | Secretos débiles o de ejemplo en producción | El servidor no arranca | `verificacion-compra.test.js` («configuración segura: en producción rechaza secretos de ejemplo») | APROBADO |

## 2. Hallazgos por inspección de código (2026-10-16)

| Hallazgo | Descripción | Archivo | Defecto |
|---|---|---|---|
| Endpoint de reportes público | `router.get('/mensual', …)` sin `requiereAutenticacion` ni permiso; responde conteos de atenciones, pedidos por estado, productos más vendidos y los 20 últimos comentarios con calificación ≤3 | `backend/src/routes/reportes.js` línea 6 | BUG-001 |
| Calificaciones sin límite | `POST /api/atencion/calificacion` sin autenticación ni limitador | `backend/src/routes/atencion.js` línea 62 | BUG-002 |
| Dependencia vulnerable | `nodemailer` 6.10.1, alta (npm audit del 2026-10-16) | `backend/package.json` | BUG-006 |
| Sesión en localStorage | Access y refresh token accesibles a JavaScript | `frontend/js/auth.js` | BUG-011 |
| Sin TLS, CSP ni HSTS | Cabeceras básicas presentes; CSP/HSTS ausentes | `backend/src/app.js` | BUG-012 |
| Estado en memoria | Captcha y limitadores por proceso | `backend/src/seguridad/captcha.js` | BUG-010 |
| Hash embebido sin uso | Constante `USUARIOS_SEED` | `backend/src/db.js` línea 63 | BUG-007 |

No se reproduce aquí ningún valor sensible (hashes, secretos ni datos personales).

## 3. Controles verificados hoy

Cifrado por campo con AAD y detección de alteraciones, índices ciegos HMAC, comparación en tiempo constante, captcha de un solo uso, firmas HMAC de n8n (W8, W11, W12), minimización de datos hacia n8n, revocación por `session_version`, cambio obligatorio de contraseña, validación de secretos en producción (ver [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md)).

## 4. Recomendaciones [REC]

1. Proteger `/api/reportes/mensual` con autenticación y un permiso de staff, y añadir prueba (TC-208).
2. Limitar `/api/atencion/calificacion` por IP.
3. Ejecutar TC-204, TC-209 y TC-210 en entorno local de pruebas.
4. Planificar la actualización mayor de `nodemailer` con regresión de TC-025.

## Referencias

- [`../03_DISENO/10_DISENO_DE_SEGURIDAD.md`](../03_DISENO/10_DISENO_DE_SEGURIDAD.md) · [`../docs/MODELO_AMENAZAS.md`](../docs/MODELO_AMENAZAS.md) · [09_REGISTRO_DE_DEFECTOS.md](09_REGISTRO_DE_DEFECTOS.md)
