# Objetivos y alcance

| Campo | Valor |
|---|---|
| ID documental | DOC-00-03 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Establecer los objetivos del sistema y delimitar el alcance, distinguiendo lo que el código demuestra de lo que se propone.

## Alcance

[OBS] No existe en el repositorio un documento de objetivos aprobado por un cliente. Los objetivos se **infieren** de la implementación y de la documentación previa (`README.md`, `docs/ARQUITECTURA_OBJETIVO.md`, `docs/REGISTRO_VERIFICADO.md`). Deben ser validados por el patrocinador.

## Objetivo general [INF]

Proveer una plataforma web en la que entidades públicas e institucionales adquieran suministros, garantizando que solo personas verificadas obtengan cuenta, que cada institución vea únicamente su catálogo y que los productos restringidos solo se vendan con verificación y autorización explícitas.

## Objetivos específicos [INF]

| ID | Objetivo | Requerimientos | Estado |
|---|---|---|---|
| OE-01 | Restringir la creación de cuentas a personas del padrón institucional con aprobación humana | REQ-F-001…004 | IMPLEMENTADO Y VERIFICADO |
| OE-02 | Autenticar con contraseña, captcha y segundo factor por correo, con sesiones revocables | REQ-F-005…009 | Mayormente IMPLEMENTADO Y VERIFICADO (REQ-F-008 no verificado) |
| OE-03 | Mostrar y vender el catálogo según institución, estado de cuenta y régimen del producto | REQ-F-014…017 | IMPLEMENTADO (reglas verificadas; flujo HTTP no reproducido) |
| OE-04 | Completar compras con precios del servidor, reserva de inventario, pago (mock) y comprobante | REQ-F-018…025 | IMPLEMENTADO; pasarela real DOCUMENTADO, NO IMPLEMENTADO (REQ-F-040) |
| OE-05 | Verificar la vinculación institucional antes de vender productos restringidos | REQ-F-027…030 | IMPLEMENTADO, NO VERIFICADO (salvo tabla de decisión) |
| OE-06 | Proteger datos personales (cifrado, minimización, auditoría) | REQ-NF-001, 008, 009, 017; REQ-F-034 | PARCIALMENTE (validación jurídica pendiente) |
| OE-07 | Automatizar avisos y tareas sin delegar decisiones a n8n | REQ-F-035, 036 | Backend verificado; workflows NO DETERMINADO |
| OE-08 | Operar a costo cero en laboratorio | REQ-NF-018 | NO DETERMINADO (restricción) |

## Alcance demostrado (existe en el código) [OBS]

| Área | Incluye |
|---|---|
| Cuentas | Registro verificado, panel de solicitudes, login con captcha + MFA, refresh, logout, cambio de contraseña, API de "mi cuenta" |
| Catálogo | Listado y detalle por contexto, categorías, administración, cumplimiento (restricción, elegibilidad, revisión legal) |
| Compra | Carrito local, checkout idempotente, pago mock, expiración de reservas, pedidos, comprobantes PDF y correo |
| Verificación | Mi verificación, documentos cifrados, identificador con índice HMAC, doble comprobación, autorización por compra |
| Administración | Clientes, pedidos, productos, verificaciones, personal y permisos, superadministrador, diagnóstico, auditoría, reportes |
| Apoyo | Asistente de catálogo por reglas, contacto/PQRS, calificaciones, normatividad, i18n parcial |
| Automatización | Outbox firmado, endpoints con token, 12 workflows n8n exportados |
| Operación | Migraciones automáticas y reversibles, scripts de claves, padrón, superadmin, cuentas de prueba, medición |

## Alcance parcial o pendiente

| Elemento | Estado | Referencia |
|---|---|---|
| Pantallas de "mi cuenta" (perfil, correo, sesiones, solicitudes) | IMPLEMENTADO Y VERIFICADO (2026-10-16; el formulario de cambio de correo no se recorrió en la prueba de interfaz) | BUG-004, BUG-005 corregidos |
| Traducción de páginas nuevas | PARCIALMENTE IMPLEMENTADO | BUG-016 |
| Workflows n8n activos | NO DETERMINADO | REQ-F-036 |
| Pasarela de pagos real | DOCUMENTADO, NO IMPLEMENTADO | REQ-F-040 |
| HTTPS, CSP, HSTS, cookie HttpOnly | PENDIENTE | REQ-NF-015, 016 |
| Borrado por plazos de conservación | PENDIENTE | BUG-015 |

## Fuera de alcance [OBS en docs previos]

Consulta a SIGEP II o Registraduría (sin acceso autorizado), biometría, placa policial, antecedentes judiciales en el registro, facturación electrónica DIAN.

## Alcance propuesto [REC]

Propuestas no solicitadas ni aprobadas por un cliente; se listan para decisión:

1. Corregir BUG-001 (reporte mensual sin autenticación) y BUG-006 (nodemailer).
2. Completar las pantallas de "mi cuenta".
3. Endurecer para producción: HTTPS, CSP/HSTS, sesión en cookie HttpOnly, captcha gestionado, almacén compartido para límites.
4. Integrar una pasarela real y un convenio con fuentes oficiales.
5. Fusionar `feature/verificacion-seguridad` a `main` y etiquetar versiones.

## Criterios de éxito

PENDIENTE DE DEFINICIÓN por el patrocinador. Propuesta [REC]: criterios de aceptación de [09_CRITERIOS_DE_ACEPTACION](../01_INGENIERIA_DE_REQUERIMIENTOS/09_CRITERIOS_DE_ACEPTACION.md) aprobados, cero defectos altos abiertos y lista de [verificación preproducción](../06_IMPLEMENTACION/13_LISTA_DE_VERIFICACION_PREPRODUCCION.md) completa.

## Referencias

- [Requerimientos funcionales](../01_INGENIERIA_DE_REQUERIMIENTOS/05_REQUERIMIENTOS_FUNCIONALES.md)
- [Documento de visión](../01_INGENIERIA_DE_REQUERIMIENTOS/01_DOCUMENTO_DE_VISION_Y_PROPOSITO.md)
- [docs/ARQUITECTURA_OBJETIVO.md](../docs/ARQUITECTURA_OBJETIVO.md)
