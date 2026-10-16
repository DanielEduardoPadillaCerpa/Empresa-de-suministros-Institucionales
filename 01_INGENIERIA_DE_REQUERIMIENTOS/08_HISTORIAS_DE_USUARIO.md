# Historias de usuario

| Campo | Valor |
|---|---|
| ID documental | DOC-01-08 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Expresar los requerimientos funcionales desde la perspectiva de cada actor, para facilitar su validación con el negocio.

## Alcance

Historias **reconstruidas** a partir del comportamiento existente (no provienen de sesiones con usuarios). Cada HU se enlaza a su REQ-F y a sus criterios en [09_CRITERIOS_DE_ACEPTACION.md](09_CRITERIOS_DE_ACEPTACION.md). Estimación y sprint: PENDIENTE (no hay evidencia de planificación ágil).

| ID | Como… | Quiero… | Para… | REQ | CA | Estado del REQ |
|---|---|---|---|---|---|---|
| HU-001 | visitante de una entidad | solicitar una cuenta con mi nombre, NIT, institución y correo | comprar suministros de mi institución | REQ-F-001 | CA-001 | IMPLEMENTADO Y VERIFICADO |
| HU-002 | responsable de la plataforma | que cada solicitud se compare con el padrón | detectar suplantaciones | REQ-F-002 | CA-002 | IMPLEMENTADO Y VERIFICADO |
| HU-003 | operador | que el padrón se copie cifrado periódicamente | trabajar con datos actualizados sin exponerlos | REQ-F-003 | CA-003 | IMPLEMENTADO, NO VERIFICADO |
| HU-004 | administrador | ver, aprobar o rechazar solicitudes con la verificación al lado | decidir con información suficiente | REQ-F-004 | CA-004 | IMPLEMENTADO Y VERIFICADO |
| HU-005 | usuario registrado | iniciar sesión con correo, contraseña y captcha | acceder a mi cuenta sin que otros sepan si existo | REQ-F-005 | CA-005 | IMPLEMENTADO Y VERIFICADO |
| HU-006 | usuario | recibir un código por correo y poder reenviarlo | completar el segundo factor | REQ-F-006 | CA-006 | IMPLEMENTADO Y VERIFICADO |
| HU-007 | administrador | que una suspensión o revocación surta efecto de inmediato | cortar accesos indebidos | REQ-F-007 | CA-007 | IMPLEMENTADO Y VERIFICADO |
| HU-008 | usuario | mantener la sesión sin reingresar cada 2 h y poder cerrarla | trabajar cómodamente y con seguridad | REQ-F-008 | CA-008 | IMPLEMENTADO, NO VERIFICADO |
| HU-009 | administrador recién creado | cambiar mi contraseña inicial antes de operar | eliminar credenciales conocidas | REQ-F-009 | CA-009 | IMPLEMENTADO Y VERIFICADO |
| HU-010 | cliente | ver y corregir mi nombre, teléfono y direcciones | mantener mis datos actualizados | REQ-F-010 | CA-010 | PARCIALMENTE IMPLEMENTADO |
| HU-011 | cliente | cambiar mi correo confirmándolo con un código | no perder el acceso | REQ-F-011 | CA-011 | PARCIALMENTE IMPLEMENTADO |
| HU-012 | cliente | cambiar mi contraseña y cerrar todas mis sesiones | proteger mi cuenta | REQ-F-012 | CA-012 | IMPLEMENTADO Y VERIFICADO |
| HU-013 | titular de datos | pedir corrección o eliminación de mis datos | ejercer mis derechos | REQ-F-013 | CA-013 | PARCIALMENTE IMPLEMENTADO |
| HU-014 | visitante o cliente | ver solo los productos que me corresponden | no acceder a información restringida | REQ-F-014 | CA-014 | IMPLEMENTADO Y VERIFICADO |
| HU-015 | cliente | ver el detalle y filtrar por categoría | encontrar lo que necesito | REQ-F-015 | CA-015 | IMPLEMENTADO, NO VERIFICADO |
| HU-016 | administrador de catálogo | crear, editar y retirar productos y categorías | mantener la oferta | REQ-F-016 | CA-016 | IMPLEMENTADO, NO VERIFICADO |
| HU-017 | responsable de cumplimiento | marcar restricción, elegibilidad y revisión legal | evitar ventas indebidas | REQ-F-017 | CA-017 | IMPLEMENTADO, NO VERIFICADO |
| HU-018 | cliente | guardar productos en un carrito | comprarlos juntos | REQ-F-018 | CA-018 | IMPLEMENTADO, NO VERIFICADO |
| HU-019 | cliente activo | confirmar la compra una sola vez con precios reales | evitar cobros duplicados o erróneos | REQ-F-019 | CA-019 | IMPLEMENTADO, NO VERIFICADO |
| HU-020 | cliente | que el checkout se llene con mis datos | ahorrar tiempo | REQ-F-020 | CA-020 | IMPLEMENTADO Y VERIFICADO |
| HU-021 | cliente | pagar y consultar el estado del pago | saber si mi pedido quedó pagado | REQ-F-021 | CA-021 | IMPLEMENTADO, NO VERIFICADO |
| HU-022 | operador | que los pedidos no pagados expiren y liberen inventario | no bloquear stock | REQ-F-022 | CA-022 | IMPLEMENTADO Y VERIFICADO |
| HU-023 | cliente | ver mis pedidos y cancelar los pendientes | controlar mis compras | REQ-F-023 | CA-023 | IMPLEMENTADO, NO VERIFICADO |
| HU-024 | administrador de pedidos | ver y actualizar todos los pedidos | gestionar entregas | REQ-F-024 | CA-024 | IMPLEMENTADO, NO VERIFICADO |
| HU-025 | cliente | descargar o recibir el comprobante | tener soporte de mi compra | REQ-F-025 | CA-025 | IMPLEMENTADO Y VERIFICADO |
| HU-026 | administrador de clientes | gestionar fichas de clientes | mantener la información | REQ-F-026 | CA-026 | IMPLEMENTADO Y VERIFICADO |
| HU-027 | cliente | acreditar mi vínculo institucional con documentos | acceder a productos restringidos | REQ-F-027 | CA-027 | IMPLEMENTADO, NO VERIFICADO |
| HU-028 | revisor | registrar comprobaciones y decidir con cuatro ojos | aprobar solo a quien corresponde | REQ-F-028 | CA-028 | IMPLEMENTADO Y VERIFICADO |
| HU-029 | cliente verificado | confirmar con un código cada compra restringida | que nadie compre en mi nombre | REQ-F-029 | CA-029 | IMPLEMENTADO, NO VERIFICADO |
| HU-030 | superadministrador | crear personal y asignar permisos mínimos | delegar sin perder control | REQ-F-030 | CA-030 | IMPLEMENTADO, NO VERIFICADO |
| HU-031 | visitante o cliente | preguntar al asistente por productos y precios | resolver dudas rápido | REQ-F-031 | CA-031 | IMPLEMENTADO Y VERIFICADO |
| HU-032 | entidad | calificar la atención y radicar una PQRS o cotización | comunicarme con la empresa | REQ-F-032 | CA-032 | IMPLEMENTADO, NO VERIFICADO |
| HU-033 | administrador | consultar indicadores mensuales | evaluar el servicio | REQ-F-033 | CA-033 | IMPLEMENTADO, NO VERIFICADO |
| HU-034 | auditor | consultar quién hizo qué y cuándo | asegurar trazabilidad | REQ-F-034 | CA-034 | IMPLEMENTADO, NO VERIFICADO |
| HU-035 | operador | que los eventos lleguen firmados a n8n | automatizar avisos sin exponer datos | REQ-F-035 | CA-035 | IMPLEMENTADO Y VERIFICADO |
| HU-036 | operador | tener los workflows n8n activos | recibir alertas | REQ-F-036 | CA-036 | NO DETERMINADO |
| HU-037 | operador | que el esquema se actualice al arrancar y pueda revertirse | desplegar sin SQL manual | REQ-F-037 | CA-037 | IMPLEMENTADO Y VERIFICADO |
| HU-038 | usuario | usar el sitio en mi idioma | entender el contenido | REQ-F-038 | CA-038 | PARCIALMENTE IMPLEMENTADO |
| HU-039 | visitante | navegar desde una portada y consultar la normatividad | conocer la plataforma | REQ-F-039 | CA-039 | IMPLEMENTADO, NO VERIFICADO |
| HU-040 | cliente | pagar con un medio real | completar compras reales | REQ-F-040 | CA-040 | DOCUMENTADO, NO IMPLEMENTADO |

## Referencias

- [05_REQUERIMIENTOS_FUNCIONALES.md](05_REQUERIMIENTOS_FUNCIONALES.md), [../02_ANALISIS/05_CASOS_DE_USO.md](../02_ANALISIS/05_CASOS_DE_USO.md)
