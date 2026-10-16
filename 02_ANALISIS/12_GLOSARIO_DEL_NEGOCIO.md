# Glosario del negocio

| Campo | Valor |
|---|---|
| ID documental | DOC-02-12 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Unificar el vocabulario de negocio y técnico usado en el código y en la documentación.

## Alcance

Términos que aparecen en el código, las pantallas y los documentos del repositorio. Cuando un término tiene un identificador en el código se indica entre comillas invertidas.

| Término | Definición |
|---|---|
| AAD (datos autenticados adicionales) | Valor que acompaña al cifrado AES-GCM; aquí es el nombre del campo, de modo que un valor cifrado no puede moverse a otra columna. |
| Administrador / staff | Cuenta con `rol = 'admin'`; sus facultades dependen de los permisos asignados. |
| Anillo de claves | Conjunto de claves de cifrado versionadas (`CRYPTO_KEYS`, `ENC_KEY_V<n>`) que permite rotar sin perder datos. |
| Aprobación (registro) | Decisión de un administrador que pasa la cuenta a `activa`. |
| Aprobación (verificación) | Decisión de una persona con `verificacion.decidir` que acredita la institución por 365 días. |
| Autorización de compra | Permiso de un solo uso, ligado al carrito y confirmado con código, para comprar productos restringidos. |
| Autorización de restringidos (`autorizacion_general`) | Habilitación de una cuenta verificada para ver y comprar productos restringidos. |
| Captcha | Reto propio (suma dibujada con trazos en SVG) que vale una vez durante 5 minutos. |
| Canal independiente | Segunda comprobación de la verificación: correo institucional o confirmación oficial obtenida por otra persona. |
| Checkout | Proceso de confirmación de compra que crea el pedido, reserva inventario y crea el intento de pago. |
| CHIP | Consolidador de Hacienda e Información Pública; conjunto `5c7g-ptic` en datos.gov.co usado por W11 para entidades públicas. |
| Cliente | Ficha del comprador institucional (`clientes`), vinculada a una cuenta. |
| Comprobación | Cada uno de los tres componentes de la verificación: vínculo documental, canal independiente y entidad. |
| Comprobante | Documento informativo de un pedido pagado (`CP-…`); no es factura electrónica DIAN. |
| Cotización requerida | Marca de referencias institucionales que se cotizan y no se compran directamente. |
| Cuatro ojos | Regla por la cual el vínculo documental y el canal independiente deben registrarlos personas distintas. |
| Cuenta activa | Cuenta aprobada, con correo verificado y sin suspensión; puede comprar productos de uso general. |
| Cuenta de prueba | Cuenta sintética (`es_cuenta_prueba`) creada por script; no compra en producción. |
| Elegibilidad | Instituciones que pueden comprar un producto: la principal más las de `productos_elegibilidad`. |
| Entidad (comprobación) | Componente que confirma que la entidad existe en un registro público; es auxiliar, no prueba el vínculo de la persona. |
| Hash de relleno | Hash bcrypt aleatorio usado cuando el correo no existe, para que el tiempo de respuesta no revele cuentas. |
| Idempotency-Key | Clave que identifica un intento de compra o envío para que repetirlo no duplique efectos. |
| Índice ciego | HMAC de un dato (NIT, documento) que permite buscar coincidencias sin guardar el dato en claro. |
| Institución | Tipo de comprador: Policía, Defensa, Bomberos, Socorro, Penitenciario, Corporativo; `general` designa productos comunes. |
| Mailpit | Servidor SMTP de laboratorio con buzón web, usado para recibir los correos de prueba. |
| MFA | Autenticación de dos factores: contraseña más código de 6 dígitos enviado al correo. |
| Mock (pago) | Proveedor de pagos simulado; decide el resultado por los centavos del total; no cobra. |
| n8n | Herramienta de automatización autoalojada que recibe avisos firmados y ejecuta tareas programadas; no toma decisiones de negocio. |
| NIT | Número de Identificación Tributaria; se normaliza a dígitos sin dígito de verificación. |
| Nonce | Valor aleatorio de un solo uso que evita repetir una respuesta de n8n. |
| Outbox | Tabla de mensajes pendientes (`correo_outbox`, `automation_outbox`) que un proceso envía con reintentos. |
| Padrón institucional | Lista de personas habilitadas por entidad; en laboratorio, la tabla `personas_institucionales_prueba` copiada cifrada a `padron_institucional`. |
| Pepper | Secreto adicional (`MFA_TOKEN_PEPPER`) usado al calcular el HMAC de los códigos. |
| Permiso | Facultad administrativa concreta (13 en total), guardada en `staff_permisos`. |
| PQRS | Peticiones, quejas, reclamos y sugerencias; tipo de solicitud de contacto. |
| Producto restringido | Producto sensible (p. ej. chalecos balísticos) oculto salvo para cuentas verificadas y elegibles. |
| Radicado | Número entregado al registrar una solicitud de contacto (`SI-…`). |
| Refresh token | Credencial de 7 días que permite renovar la sesión; se rota en cada uso. |
| Reserva de inventario | Unidades apartadas al crear un pedido pendiente de pago; se liberan si vence, se rechaza o se cancela. |
| Revisión legal | Estado de cumplimiento del producto (`no_requerida`, `pendiente`, `aprobada`, `bloqueada`). |
| RUES | Registro Único Empresarial y Social; conjunto `c82u-588k` en datos.gov.co. |
| Session version (`session_version`) | Contador que invalida todas las sesiones de un usuario al incrementarse. |
| Solicitud de registro | Petición de cuenta comparada contra el padrón y decidida por un administrador. |
| Solicitud de verificación | Proceso de acreditación institucional con referencia opaca y tres comprobaciones. |
| Superadministrador | Administrador con facultades máximas, creado solo por comando; no accede por defecto a datos personales. |
| Suspensión | Estado de verificación `suspendido` que cancela solicitudes, revoca autorizaciones y cierra sesiones. |
| Terna | Combinación NIT + nombre + institución que se verifica contra el padrón. |
| Vínculo documental | Primera comprobación: el revisor coteja la evidencia del vínculo con la persona. |
| Vitrina | Nivel de visualización sin precio, inventario ni metadatos. |
| Webhook | Llamada HTTP entrante que notifica un evento (pago, n8n). |
| W1…W12 | Workflows de n8n del repositorio (ver [10_ANALISIS_DE_DEPENDENCIAS_E_INTEGRACIONES.md](10_ANALISIS_DE_DEPENDENCIAS_E_INTEGRACIONES.md)). |

## Referencias

- [09_DICCIONARIO_DE_DATOS.md](09_DICCIONARIO_DE_DATOS.md)
- [docs/POLITICA_VERIFICACION_IDENTIDAD.md](../docs/POLITICA_VERIFICACION_IDENTIDAD.md)
