# Tratamiento de datos personales en el registro y la verificación

> **Requiere revisión jurídica antes de operar en producción.** Este documento describe lo que hace el sistema y las obligaciones identificadas. No es un concepto legal. Los textos normativos oficiales no pudieron consultarse durante el trabajo: el Gestor Normativo respondió con error de TLS el 2026-10-13. Ver también [MATRIZ_NORMATIVA_COLOMBIA.md](MATRIZ_NORMATIVA_COLOMBIA.md).

## 1. Inventario y finalidad

| Dato | Cuándo se pide | Finalidad | Clasificación (Ley 1581 / Decreto 1377) | Almacenamiento | Acceso |
|---|---|---|---|---|---|
| Nombre completo | Registro | Identificar al titular de la cuenta y en las comunicaciones | Personal (público según el contexto) | Cifrado AES-256-GCM | Titular; staff con `verificacion.ver` |
| Correo | Registro | Acceso, MFA, avisos | Personal | Usuarios: en claro (identificador de acceso); cliente: cifrado | Titular; staff |
| Contraseña | Registro | Autenticación | — | Hash bcrypt | Nadie |
| Tipo de institución y campo específico | Registro | Catálogo y reglas de elegibilidad | No personal en sí | Claro / cifrado | Staff |
| Datos de la entidad (nombre, NIT, dependencia, cargo, ubicación) | Al iniciar la verificación | Vincular a la persona con una entidad existente | Mayormente de la entidad; el cargo es personal | Mixto (cifrado en `datos_registro_cifrados`) | Staff |
| Documento de identidad (CC o CE) | Al iniciar la verificación, con autorización específica | Cotejar la evidencia con la persona y detectar duplicados | Personal **no público** (tratamiento conservador: la SIC no lo califica como público) | Cifrado v2 + índice HMAC; solo los 3 últimos dígitos son visibles | Titular (enmascarado); staff (enmascarado); `identificadores.ver` con justificación auditada |
| Evidencia documental | Al iniciar la verificación | Acreditar el vínculo y la existencia de la entidad | Personal; puede contener datos de terceros | Archivo cifrado, carpeta privada | Titular; `documentos.ver` (auditado) |
| Dirección de entrega y datos del comprador | En el checkout | Entrega y facturación | Personal | Cifrado | Titular; `pedidos.gestionar` |

**No se recogen** biometría (dato sensible, art. 5), placa policial, antecedentes en el registro ni información operativa o de seguridad de las instituciones.

## 2. Base jurídica y autorizaciones

- **Registro.** Aceptación de términos y autorización previa, expresa e informada del tratamiento de nombre y correo (art. 9 de la Ley 1581). Se guarda `clientes.acepta_terminos_en`.
- **Documento de identidad.** Autorización específica y separada en el momento de pedirlo (`autorizaTratamiento: true`, `identificadores_personales.autorizado_en`). Sin ella el servidor no lo recibe.
- **Pendiente jurídico.**
  - Redactar el aviso de privacidad y la política de tratamiento. La página `leyes.html` y el modal de política existen, pero su texto no se revisó en este trabajo.
  - Confirmar si aplica la inscripción en el RNBD.
  - Confirmar el régimen de los productos restringidos (ver `MATRIZ_ELEGIBILIDAD_PRODUCTOS.md`).

## 3. Derechos de los titulares

Conocer, actualizar, rectificar y suprimir. Hoy se ejercen por *Mi cuenta → solicitudes* (corrección o eliminación, atendidas por staff con `clientes.gestionar`) y por *Contacto*. **Pendiente:** un flujo para que el titular solicite borrar su documento de identidad cuando ya no lo necesite. Hoy lo hace el equipo, borrando la fila de `identificadores_personales`.

## 4. Conservación

| Dato | Plazo propuesto (a validar) |
|---|---|
| Documento de identidad | Mientras la verificación esté vigente y 5 años después, por trazabilidad de ventas de equipos restringidos. Requiere validación jurídica |
| Evidencia documental | Igual |
| Solicitudes y comprobaciones | Igual (no contienen el número de documento) |
| Autorizaciones de compra | Vinculadas al pedido; se conservan con la contabilidad |
| Nonces de n8n | 24 horas |

**No hay borrado automático implementado.** Hay que definir los plazos y programar la depuración.

## 5. Terceros y fuentes

- **n8n** (encargado, autoalojado). Recibe referencias opacas, el NIT de personas jurídicas y, para avisar al titular, su correo (cifrado en el outbox, en claro solo durante el envío). No guarda datos de ejecución.
- **datos.gov.co** (RUES, CHIP). Datos públicos de **entidades**, consultados por NIT y con columnas limitadas. Que un dato esté publicado **no autoriza** reutilizarlo sin finalidad; por eso no se consultan personas.
- **SMTP.** Envío de códigos y avisos.
- **No se consultan:** SIGEP (sin acceso autorizado para esta finalidad), Registraduría (requiere convenio), antecedentes ni listas PEP.

## 6. Incidentes

- Los registros del servidor no contienen documentos de identidad ni códigos: se comprobó automáticamente en la prueba 17.
- Ante una sospecha de compromiso de la base, el índice HMAC no permite enumerar cédulas sin `IDENT_HMAC_KEY`. Hay que rotar las claves (ver [ARQUITECTURA_VERIFICACION.md](ARQUITECTURA_VERIFICACION.md) §5).
- **Pendiente:** un procedimiento formal de notificación a la SIC y a los titulares, con plazos y responsables.
