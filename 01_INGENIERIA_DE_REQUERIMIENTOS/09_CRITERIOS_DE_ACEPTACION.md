# Criterios de aceptación

| Campo | Valor |
|---|---|
| ID documental | DOC-01-09 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir criterios verificables (formato Dado/Cuando/Entonces) para cada requerimiento, enlazados a su caso de prueba.

## Alcance

CA-001…CA-040 ↔ REQ-F-001…040 ↔ TC-001…040; CA-101…CA-117 ↔ REQ-NF-001…017 ↔ TC-101…117. Los criterios describen el comportamiento observado en el código; su aceptación formal por el negocio está PENDIENTE. La columna "Resultado" refleja el estado del TC al 2026-10-16.

## Criterios funcionales

| CA | REQ / TC | Dado | Cuando | Entonces | Resultado |
|---|---|---|---|---|---|
| CA-001 | REQ-F-001 / TC-001 | un captcha válido y datos válidos (nombre ≥2 palabras, NIT normalizable, contraseña 10–72, ambas aceptaciones) | se envía `POST /api/auth/registro` | responde 202 `solicitud_recibida`, se crean cliente, usuario `pendiente` y solicitud; con correo existente la respuesta es idéntica; sin captcha 400 `CAPTCHA_INVALIDO`; campos ajenos (rol, clienteId, teléfono) 400 | APROBADO |
| CA-002 | REQ-F-002 / TC-002 | un padrón cifrado con una persona de NIT X en Policía | se verifica la terna con nombre en otro orden y NIT con DV | resultado `coincide`; con otra institución `institucion_no_coincide`; con otro nombre `nombre_no_coincide`; NIT ausente `nit_no_existe`; base caída `padron_no_disponible` | APROBADO |
| CA-003 | REQ-F-003 / TC-003 | una fuente con N filas | arranca el servidor o se ejecuta `npm run padron:importar` | `padron_institucional` contiene N filas con `nit_hash` y campos cifrados; filas retiradas pasan a `inactiva`; la fuente no se modifica | BLOQUEADO |
| CA-004 | REQ-F-004 / TC-004 | un admin con `clientes.gestionar` y una solicitud pendiente | consulta lista, detalle y decide | la lista no contiene NIT ni nombre; aprobar sin `confirmar` con resultado ≠ coincide → 409 `CONFIRMACION_REQUERIDA`; rechazar sin motivo de 5–500 → 400; decisión repetida → 409 `YA_DECIDIDA`; sin permiso → 403 | APROBADO |
| CA-005 | REQ-F-005 / TC-005 | una cuenta pendiente y una activa | se envían credenciales correctas con captcha | pendiente → 403 `CUENTA_PENDIENTE`; activa → 202 con `challengeId`; credenciales erróneas o correo inexistente → 401 genérico | APROBADO |
| CA-006 | REQ-F-006 / TC-006 | un reto MFA vigente | se envía el código correcto | se emiten token y refresh token y se marca `correo_verificado_en`; código incorrecto descuenta intentos; tras 5 intentos el reto se bloquea; reenvío antes de 60 s → 429; vencido → 410 | APROBADO (cancelar: NO EJECUTADO) |
| CA-007 | REQ-F-007 / TC-007 | un JWT vigente | se incrementa `session_version` o la cuenta deja de estar activa | la siguiente petición responde 401 o 403 `CUENTA_NO_ACTIVA` | APROBADO |
| CA-008 | REQ-F-008 / TC-008 | un refresh token válido | se llama `POST /api/auth/refresh` dos veces con el mismo token | la primera devuelve tokens nuevos; la segunda 401; tras `logout` el token queda revocado | BLOQUEADO |
| CA-009 | REQ-F-009 / TC-009 | un usuario con `debe_cambiar_password` | accede a cualquier ruta distinta de `GET /api/mi-cuenta` y `POST /api/mi-cuenta/password` | responde 403 `PASSWORD_CHANGE_REQUIRED` | APROBADO |
| CA-010 | REQ-F-010 / TC-010 | un cliente autenticado | envía `PATCH /api/mi-cuenta` con un campo fuera de la lista o con HTML | 400 sin escribir; con campos permitidos actualiza y audita solo nombres de campo | APROBADO (API y pantalla `mi-cuenta.html`, 2026-10-16) |
| CA-011 | REQ-F-011 / TC-011 | un cliente con MFA | solicita el cambio con su contraseña y confirma con el código | ambos correos se sincronizan, se revocan sesiones y se avisa al correo anterior; código erróneo, vencido o reutilizado no cambia nada | APROBADO (API) |
| CA-012 | REQ-F-012 / TC-012 | un cliente con MFA en los últimos 15 min | cambia la contraseña | se actualiza y se revocan todas las sesiones; sin MFA reciente se rechaza | APROBADO |
| CA-013 | REQ-F-013 / TC-013 | un cliente | crea una solicitud de corrección | se guarda pendiente y se encola a W8 solo id y tipo; solo staff con `clientes.gestionar` la resuelve | APROBADO (API y pantallas `mi-cuenta.html` y `admin-contacto.html`, 2026-10-16) |
| CA-014 | REQ-F-014 / TC-014 | un visitante | consulta el catálogo | no recibe precio, inventario, restricción ni metadatos; productos restringidos o de otra institución no aparecen y su detalle da 404 | APROBADO (reglas unitarias) |
| CA-015 | REQ-F-015 / TC-015 | productos en varias categorías | se pide `GET /api/productos?categoria=` y `GET /api/productos/:id` | se filtra por categoría; id no numérico o no visible → 404 | BLOQUEADO |
| CA-016 | REQ-F-016 / TC-016 | un admin con `catalogo.gestionar` | crea, edita y elimina un producto | cambios persistidos y auditados; sin permiso → 403 | BLOQUEADO |
| CA-017 | REQ-F-017 / TC-017 | un producto restringido con `revision_legal=pendiente` | un cliente elegible intenta comprarlo | 409 `REVISION_LEGAL_PENDIENTE`; con `aprobada` y autorizaciones se permite; con `bloqueada` se oculta | BLOQUEADO |
| CA-018 | REQ-F-018 / TC-018 | un visitante | agrega productos al carrito y recarga | el carrito persiste en `localStorage` con ids y cantidades | NO EJECUTADO |
| CA-019 | REQ-F-019 / TC-019 | un cliente activo y un carrito válido | envía `POST /api/checkout` dos veces con la misma `Idempotency-Key` | se crea un solo pedido `pendiente_pago` con total de precios de MySQL; misma clave con otro cuerpo → 409; sin clave → 400; inventario insuficiente → 409 | BLOQUEADO |
| CA-020 | REQ-F-020 / TC-020 | un cliente autenticado | pide `GET /api/checkout/perfil` | recibe solo su perfil con `Cache-Control: no-store`; sin JWT → 401 | APROBADO |
| CA-021 | REQ-F-021 / TC-021 | un pedido pendiente con total terminado en .01 | se simula el webhook | el pago queda rechazado; firma inválida o marca de tiempo >5 min → rechazo; `evento_id` repetido con otro cuerpo → 409; estado consultable solo por el dueño | BLOQUEADO (parte de estado: APROBADO) |
| CA-022 | REQ-F-022 / TC-022 | un pago vencido con reserva | corre la expiración | pedido y pago quedan vencidos y el inventario se repone en una sola transacción; si falla, se revierte | APROBADO |
| CA-023 | REQ-F-023 / TC-023 | un cliente con un pedido pendiente | lo cancela | queda `cancelado` y se libera la reserva; pedido ajeno → 403; pedido pagado → 400 | BLOQUEADO |
| CA-024 | REQ-F-024 / TC-024 | un admin con `pedidos.gestionar` | consulta `/api/pedidos/todos` y cambia un estado | ve todos los pedidos y el cambio se audita; sin permiso → 403 | BLOQUEADO |
| CA-025 | REQ-F-025 / TC-025 | un pago aprobado | se crea el comprobante | se encola aviso admin y, solo con consentimiento, correo al cliente; el enlace valida solo para su pedido y no después de 24 h; en producción sin SMTP el envío falla | APROBADO |
| CA-026 | REQ-F-026 / TC-026 | usuarios sin sesión, cliente y admin sin permiso | intentan crear/editar clientes o conceder restringidos | 401/403; solo staff con permiso y cuenta aprobada concede restringidos | APROBADO |
| CA-027 | REQ-F-027 / TC-027 | un cliente activo | sube un PDF válido, registra su CC con autorización y envía | documento cifrado en disco, identificador cifrado con índice HMAC y últimos 3 dígitos; ejecutable renombrado → rechazo; reenvío con la misma clave no duplica | BLOQUEADO (normalización/HMAC/cifrado: APROBADO) |
| CA-028 | REQ-F-028 / TC-028 | una solicitud con las tres comprobaciones | se intenta aprobar | solo se permite si las tres están confirmadas y vínculo y canal los registraron personas distintas; ninguna combinación aprueba o rechaza sola | APROBADO (tabla de decisión) |
| CA-029 | REQ-F-029 / TC-029 | un cliente verificado con carrito restringido | solicita y confirma el código y compra | la autorización se consume en el pedido; otro carrito, otro usuario, reutilización o vencimiento → rechazo | BLOQUEADO (hash del carrito: APROBADO) |
| CA-030 | REQ-F-030 / TC-030 | un admin con `staff.permisos` no superadmin | intenta concederse permisos o conceder reservados | 403; el superadmin solo se crea por comando con `--confirmar-base` | BLOQUEADO |
| CA-031 | REQ-F-031 / TC-031 | un visitante | pregunta precios al asistente | no revela productos, precios ni disponibilidad; mensajes >500 caracteres → 400; >20/min → 429 | APROBADO |
| CA-032 | REQ-F-032 / TC-032 | un visitante | radica una solicitud con NIT de 9–10 dígitos, correo y autorización | 201 con radicado `SI-########`; sin autorización → 400; campo `website` lleno → 400; 6.ª en 15 min → 429 | BLOQUEADO |
| CA-033 | REQ-F-033 / TC-033 | un administrador autenticado | consulta el reporte mensual | recibe los indicadores; **un visitante sin sesión debería recibir 401** (hoy recibe 200: BUG-001) | BLOQUEADO |
| CA-034 | REQ-F-034 / TC-034 | una acción administrativa | se consulta `/api/auditoria` con `auditoria.ver` | aparece con usuario, acción, entidad y fecha, sin valores sensibles; sin permiso → 403 | BLOQUEADO |
| CA-035 | REQ-F-035 / TC-035 | un evento en el outbox | se entrega a n8n | lleva firma HMAC válida y solo los campos permitidos; una alteración invalida la firma; endpoints de automatización sin token → 401, sin configurar → 503 | APROBADO |
| CA-036 | REQ-F-036 / TC-036 | una instancia n8n | se importan y activan W1–W12 con credenciales | cada flujo procesa un evento de prueba sin conservar ejecuciones | BLOQUEADO |
| CA-037 | REQ-F-037 / TC-037 | una base con columnas ya instaladas | se ejecuta la migración | no falla y deja tablas/ENUM correctos; `revertir` elimina solo lo de la versión | APROBADO (idempotencia); reversión BLOQUEADO |
| CA-038 | REQ-F-038 / TC-038 | el selector en inglés | se visita cada página | todos los textos visibles cambian de idioma | NO EJECUTADO (se espera FALLIDO en páginas nuevas) |
| CA-039 | REQ-F-039 / TC-039 | un navegador que pide `/` | se carga el sitio | redirige a `landing.html` y el menú común funciona | NO EJECUTADO |
| CA-040 | REQ-F-040 / TC-040 | `PAYMENT_MODE=sandbox` | arranca el servidor | hoy falla de forma segura; el criterio futuro es procesar un pago sandbox real | PENDIENTE |

## Criterios no funcionales

| CA | REQ / TC | Criterio | Resultado |
|---|---|---|---|
| CA-101 | REQ-NF-001 / TC-101 | Un valor cifrado no se descifra en otra columna (AAD), detecta alteraciones y la clave anterior sigue descifrando tras rotar | APROBADO |
| CA-102 | REQ-NF-002 / TC-102 | Contraseñas <10 o >72 caracteres se rechazan; solo se almacena hash bcrypt | APROBADO |
| CA-103 | REQ-NF-003 / TC-103 | Con secretos de ejemplo en producción el servidor no arranca | APROBADO |
| CA-104 | REQ-NF-004 / TC-104 | Superar los límites por IP produce 429 | APROBADO (parcial) |
| CA-105 | REQ-NF-005 / TC-105 | Toda respuesta incluye las cabeceras de seguridad; existe CSP | NO EJECUTADO (se espera FALLIDO en CSP) |
| CA-106 | REQ-NF-006 / TC-106 | Medianas dentro de las metas en `npm run medir` | BLOQUEADO |
| CA-107 | REQ-NF-007 / TC-107 | Con carga concurrente el backend no abre más de 4 conexiones | NO EJECUTADO |
| CA-108 | REQ-NF-008 / TC-108 | Ningún payload hacia n8n contiene datos personales (salvo NIT jurídico de W11) | APROBADO |
| CA-109 | REQ-NF-009 / TC-109 | Registros y respuestas no contienen contraseñas, códigos, tokens ni documentos | BLOQUEADO |
| CA-110 | REQ-NF-010 / TC-110 | Con n8n caído, el checkout y el pago no se bloquean y el outbox reintenta | APROBADO (parcial) |
| CA-111 | REQ-NF-011 / TC-111 | `npm test` pasa en Node 18 y en la versión de despliegue | NO EJECUTADO |
| CA-112 | REQ-NF-012 / TC-112 | `npm test` termina sin fallos | APROBADO (107 + 51) |
| CA-113 | REQ-NF-013 / TC-113 | Sin barra horizontal a 360 px de ancho | NO EJECUTADO |
| CA-114 | REQ-NF-014 / TC-114 | El widget del asistente es operable con teclado y lector | APROBADO (parcial) |
| CA-115 | REQ-NF-015 / TC-115 | Los tokens no son accesibles desde JavaScript | PENDIENTE |
| CA-116 | REQ-NF-016 / TC-116 | Todo el tráfico usa HTTPS con HSTS | PENDIENTE |
| CA-117 | REQ-NF-017 / TC-117 | Aviso de privacidad, autorizaciones y plazos de conservación validados por jurídica y aplicados | NO EJECUTADO |

## Referencias

- [../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md](../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md), [11_MATRIZ_DE_TRAZABILIDAD.md](11_MATRIZ_DE_TRAZABILIDAD.md)
