# Diccionario de datos de negocio

| Campo | Valor |
|---|---|
| ID documental | DOC-02-09 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir, en lenguaje de negocio, los atributos que el sistema captura, sus reglas de validación, su clasificación de privacidad y dónde se almacenan conceptualmente.

## Alcance

Atributos de negocio de las entidades del [modelo conceptual](08_MODELO_CONCEPTUAL_DE_DATOS.md). **No** repite columnas ni tipos SQL: para eso ver [03_DISENO/07_DICCIONARIO_TECNICO_DE_DATOS.md](../03_DISENO/07_DICCIONARIO_TECNICO_DE_DATOS.md). Las validaciones son **[OBS]** (`backend/src/registroInstitucional.js`, `seguridad/normalizacion.js`, rutas). La clasificación de privacidad sigue [docs/TRATAMIENTO_DATOS_PERSONALES.md](../docs/TRATAMIENTO_DATOS_PERSONALES.md) y está **PENDIENTE DE VALIDACIÓN** jurídica.

Leyenda de protección: **C** = cifrado AES-256-GCM; **H** = índice HMAC (buscable, no reversible); **B** = hash bcrypt; **Claro** = sin cifrar; **Mem** = solo en memoria.

## 1. Cuenta y registro

| Atributo | Definición | Regla / validación | Privacidad | Protección |
|---|---|---|---|---|
| Correo de acceso | Identificador de inicio de sesión y canal de MFA | Formato `x@y.z`, máx. 254, minúsculas; único | Personal | Claro en la cuenta (identificador), C en la ficha del cliente |
| Contraseña | Secreto del usuario | 10–72 caracteres; no puede contener el usuario del correo (≥4 caracteres) | Credencial | B |
| Nombre completo | Nombre de la persona solicitante | ≥2 palabras; se normaliza sin tildes, mayúsculas, palabras ordenadas para comparar | Personal | C |
| NIT de la entidad | Identificación tributaria de la entidad a la que pertenece el solicitante | Solo dígitos, sin dígito de verificación (`999.000.001-2` = `999000001`) | De la entidad **[INF]** | C + H |
| Tipo de institución | Categoría declarada | `policia`, `defensa`, `bomberos`, `socorro`, `penitenciario`, `corporativo` | No personal | Claro |
| Aceptación de términos y tratamiento | Consentimiento del registro | Obligatoria; se guarda la fecha | — | Claro |
| Captcha | Suma dibujada para frenar bots | Un intento, 5 minutos | — | Mem |
| Estado de la cuenta | Habilitación del acceso | pendiente, activa, rechazada, suspendida | — | Claro |
| Resultado de verificación del registro | Bandera para el administrador | coincide, nit_no_existe, nombre_no_coincide, institucion_no_coincide, persona_inactiva, padron_no_disponible | — | Claro |
| Motivo de rechazo | Explicación al solicitante | 5–500 caracteres; no se guarda en auditoría | Puede contener datos | Claro en la solicitud |
| Rol | Tipo de cuenta | cliente o admin | — | Claro |
| Superadministrador | Marca de máxima administración | Solo por comando | — | Claro |
| Cambio de contraseña obligatorio | Credencial inicial pendiente | Se apaga al cambiarla | — | Claro |
| Cuenta de prueba | Cuenta sintética | No compra en producción | — | Claro |

## 2. Sesión y MFA

| Atributo | Definición | Regla | Protección |
|---|---|---|---|
| Código MFA | Código de un solo uso enviado por correo | 6 dígitos, 5 min, 5 intentos, reenvío ≥60 s, máx. 5 reenvíos | HMAC con pepper |
| Reto MFA | Identificador del desafío | 64 caracteres hexadecimales | Claro |
| Token de acceso | Credencial de sesión | JWT HS256, 2 h, contiene uid, rol, clienteId, sv, mfa | En el navegador (`localStorage`, BUG-011) |
| Token de renovación | Credencial para renovar | 7 días, rotativo, un uso | SHA-256 en la base |
| Versión de sesión | Contador para revocar sesiones | Aumenta al cambiar correo/contraseña o cerrar sesiones | Claro |
| Correo verificado | Fecha del primer MFA correcto | — | Claro |

## 3. Cliente, verificación e identidad

| Atributo | Definición | Regla | Privacidad | Protección |
|---|---|---|---|---|
| Nombre del funcionario, teléfono, direcciones | Datos de contacto y entrega | Teléfono colombiano; sin HTML; editables por el titular | Personal | C |
| Datos de registro de la entidad | Dependencia, cargo, municipio, campos del tipo | Según tipo de institución | Mixto | C |
| Estado de verificación | Situación de la acreditación institucional | borrador, pendiente, requiere_informacion, aprobado, rechazado, suspendido | — | Claro |
| Institución aprobada | Institución acreditada por el revisor | Determina el catálogo de restringidos | — | Claro |
| Verificado hasta | Vigencia de la acreditación | Aprobación + 365 días (máx. 730) | — | Claro |
| Autorización general (restringidos) | Habilitación para productos restringidos | Solo con `restringidos.autorizar` y cuenta aprobada | — | Claro |
| Documento de identidad | Cédula (CC) o cédula de extranjería (CE) | CC 4–10 dígitos sin ceros a la izquierda; CE 4–15 alfanuméricos; requiere autorización específica | Personal no público | C + H; visibles solo 3 últimos dígitos |
| Evidencia documental | Archivo que acredita el vínculo | PDF/PNG/JPEG por firma de contenido; sin contenido activo; tamaño y cantidad máximos por cliente | Personal | Archivo C fuera de carpetas públicas; nombre original C; SHA-256 |
| Comprobación | Resultado de cada uno de los tres componentes | Ver estados en el modelo conceptual | — | Claro |
| Referencia de solicitud | Identificador opaco que viaja a n8n | 32 hexadecimales; nunca el id del cliente | — | Claro |
| Dato sensible (antecedentes) | Número de consulta de antecedentes (heredado) | Solo con autorización expresa | Sensible | C |

## 4. Catálogo y compra

| Atributo | Definición | Regla |
|---|---|---|
| Producto: nombre, descripción, imagen, categoría | Ficha del producto | Nombre y precio obligatorios al crear |
| Precio | Valor unitario en COP | Siempre del servidor; el carrito no lo decide |
| Inventario disponible | Unidades vendibles | Se reserva en el checkout y se libera al vencer, rechazar o cancelar |
| Institución del producto | Ámbito principal | Una de las instituciones o `general` |
| Instituciones elegibles | Ámbitos adicionales | Relación M:N |
| Restringido | Producto sensible | Oculto salvo cuenta verificada elegible |
| Revisión legal | Estado de cumplimiento | `pendiente`/`bloqueada` impiden la venta |
| Cotización requerida | Referencia que no se vende directo | Marca en metadatos; precio 0 |
| Clave de idempotencia | Identificador único del intento de compra | 16–128 caracteres |
| Datos del comprador y dirección de entrega | Datos para entregar y facturar | Cifrados (C) |
| Enviar comprobante | Consentimiento para el correo del comprobante | Desmarcado por defecto |
| Monto en centavos | Importe del pago | Entero; moneda COP |
| Número de comprobante | Consecutivo del comprobante | `CP-` + id del pedido con 10 dígitos |
| Enlace de comprobante | Acceso sin sesión | HMAC, 24 h |

## 5. Atención y reportes

| Atributo | Definición | Regla | Protección |
|---|---|---|---|
| Calificación | Satisfacción con la atención | Entero 1–5; comentario ≤1000 | Claro |
| Solicitud de contacto | PQRS, soporte o cotización | Mensaje 20–2000; NIT 9–10 dígitos; criticidad baja/media/alta/urgente | NIT y correo C |
| Radicado | Número entregado al ciudadano | `SI-` + id con 8 dígitos | Claro |
| Pregunta pendiente del asistente | Consulta no resuelta | Texto normalizado sin correos ni números largos | Claro |
| Reporte de cliente | Comentario y calificación del cliente | Comentario obligatorio, calificación 1–5 | Claro |

## 6. Auditoría y automatización

| Atributo | Definición | Regla |
|---|---|---|
| Acción auditada | Qué hizo el usuario | Texto ≤40 (p. ej. `aprobar_registro`, `ver_documento`, `ver_identificador`) |
| Detalle de auditoría | Contexto de la acción | Sin valores personales (se auditan nombres de campos) |
| Evento de automatización | Mensaje a n8n | Payload mínimo firmado; cifrado cuando contiene correo |
| Nonce | Valor de un solo uso de respuestas de n8n | Se depura a las 24 h |

## Referencias

- [08_MODELO_CONCEPTUAL_DE_DATOS.md](08_MODELO_CONCEPTUAL_DE_DATOS.md), [12_GLOSARIO_DEL_NEGOCIO.md](12_GLOSARIO_DEL_NEGOCIO.md)
- [Reglas de negocio](../01_INGENIERIA_DE_REQUERIMIENTOS/07_REGLAS_DE_NEGOCIO.md)
