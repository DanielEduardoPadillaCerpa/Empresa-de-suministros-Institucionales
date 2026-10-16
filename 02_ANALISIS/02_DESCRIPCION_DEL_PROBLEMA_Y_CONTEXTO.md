# Descripción del problema y contexto

| Campo | Valor |
|---|---|
| ID documental | DOC-02-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir el problema de negocio que el software resuelve y el contexto en que opera, a partir de lo que el código y la documentación previa permiten demostrar.

## Alcance

El problema se reconstruye desde la implementación y los documentos del repositorio. **No existen** en el repositorio entrevistas, actas ni un documento de necesidades firmado por un cliente; por eso el planteamiento es **[INF]** salvo donde se indica **[OBS]**.

## 1. Problema

**[INF]** Una empresa proveedora necesita vender suministros (dotación, protección personal, herramientas, comunicaciones, papelería, equipos de rescate) a instituciones públicas y de seguridad de Colombia, con tres dificultades:

1. **Quién compra.** Parte del catálogo es sensible (chalecos y placas balísticas, grilletes, fundas; `restringido = TRUE` en `backend/src/db.js`). Vender a cualquiera que se registre es un riesgo. **[OBS]** La auditoría previa (H1–H3 en [docs/AUDITORIA_TECNICA.md](../docs/AUDITORIA_TECNICA.md)) encontró que la institución se deducía del dominio del correo y que los visitantes veían productos restringidos.
2. **Qué ve y qué puede comprar cada institución.** Cada tipo de institución tiene su catálogo (`productos.institucion_id`, `productos_elegibilidad`) y hay productos de uso general (`institucion_id = 'general'`).
3. **Protección de datos personales.** Se manejan nombres, correos, NIT, documentos de identidad y evidencia documental, sujetos a la Ley 1581 de 2012 ([docs/TRATAMIENTO_DATOS_PERSONALES.md](../docs/TRATAMIENTO_DATOS_PERSONALES.md)).

## 2. Respuesta implementada (resumen)

| Problema | Respuesta en el código | Estado |
|---|---|---|
| Suplantación al registrarse | Registro contra padrón cifrado (terna NIT + nombre + institución) y aprobación humana obligatoria (RN-001, RN-003) | IMPLEMENTADO Y VERIFICADO (REQ-F-001, 002, 004) |
| Acceso a restringidos | Verificación institucional con doble comprobación y autorización por compra (RN-009, RN-011) | IMPLEMENTADO, NO VERIFICADO de extremo a extremo (REQ-F-027 a 029) |
| Segmentación del catálogo | `evaluarProducto()` decide visibilidad, nivel y compra en cada petición (RN-007) | IMPLEMENTADO Y VERIFICADO en reglas (REQ-F-014) |
| Robo de credenciales | MFA por correo, sesión revocable (RN-005, REQ-F-007) | IMPLEMENTADO Y VERIFICADO |
| Confidencialidad de datos | Cifrado por campo e índices ciegos (REQ-NF-001) | IMPLEMENTADO Y VERIFICADO |
| Venta y cobro | Checkout con reserva de inventario y pago mock (REQ-F-019, 021) | IMPLEMENTADO, NO VERIFICADO; pasarela real PENDIENTE (REQ-F-040) |

## 3. Contexto

### 3.1 Contexto institucional y normativo

- **[OBS]** Tipos de institución cerrados en `backend/src/tenancy.js` y `backend/src/registroInstitucional.js`: `policia`, `defensa`, `bomberos`, `socorro`, `penitenciario`, `corporativo` (y `general` como ámbito de productos).
- **[OBS]** Referencias normativas recopiladas en [docs/MATRIZ_NORMATIVA_COLOMBIA.md](../docs/MATRIZ_NORMATIVA_COLOMBIA.md) y [docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md](../docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md); la página `frontend/leyes.html` advierte que su contenido es informativo. La validación jurídica está **PENDIENTE** (RSK-010).
- **[OBS]** No hay acceso a fuentes oficiales de pertenencia (SIGEP, Registraduría); ver [docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md](../docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md). El padrón de laboratorio (tabla `personas_institucionales_prueba`) reemplaza a la fuente del Estado.

### 3.2 Contexto técnico

- **[OBS]** Laboratorio de costo cero: MySQL en plan gratuito (5 conexiones), Mailpit para correo, captcha propio, n8n autoalojado en Docker (`n8n/docker-compose.yml`).
- **[OBS]** Latencia de ~150 ms por viaje a MySQL desde el equipo del laboratorio (medición del 2026-10-15 en [docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md) §5; no reproducida).
- **[OBS]** Historia corta: 23 commits entre 2026-10-11 y 2026-10-15; el trabajo más reciente está en `feature/verificacion-seguridad`, sin fusionar en `main` (BUG-018).

### 3.3 Mercado

**[OBS]** El repositorio contiene análisis de mercado B2G y catálogos de referencia ([docs/inteligencia-mercado-b2g-colombia.md](../docs/inteligencia-mercado-b2g-colombia.md), [docs/catalogos-institucionales.md](../docs/catalogos-institucionales.md)). Las referencias institucionales sembradas tienen precio 0 y `metadatos.cotizacion_requerida = true`, es decir, se cotizan y no se compran directamente (motivo `cotizacion_requerida` en `evaluarProducto`).

## 4. Fuera del problema demostrado

- Facturación electrónica DIAN: **NO APLICA** al alcance actual; el comprobante declara "Documento informativo. No es factura electrónica DIAN." (`backend/src/routes/comprobantes.js`, `backend/src/email.js`).
- Logística, despacho y transportadoras: **NO DETERMINADO**; solo existen estados de pedido (`preparado`, `enviado`, `entregado`).
- Biometría y placa policial: excluidas por decisión documentada ([docs/POLITICA_VERIFICACION_IDENTIDAD.md](../docs/POLITICA_VERIFICACION_IDENTIDAD.md) §7).

## Referencias

- [01_DOCUMENTO_DE_ANALISIS_DEL_SISTEMA.md](01_DOCUMENTO_DE_ANALISIS_DEL_SISTEMA.md)
- [Documento de visión](../01_INGENIERIA_DE_REQUERIMIENTOS/01_DOCUMENTO_DE_VISION_Y_PROPOSITO.md)
- [docs/AUDITORIA_TECNICA.md](../docs/AUDITORIA_TECNICA.md)
