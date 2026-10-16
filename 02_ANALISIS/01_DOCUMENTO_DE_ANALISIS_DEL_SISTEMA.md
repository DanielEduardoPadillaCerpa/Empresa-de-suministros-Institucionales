# Documento de análisis del sistema

| Campo | Valor |
|---|---|
| ID documental | DOC-02-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Presentar el análisis del sistema "Suministros Institucionales" tal como existe en el repositorio: qué hace, para quién, con qué procesos, datos e integraciones, y qué límites tiene. Es el documento de entrada a la carpeta `02_ANALISIS/`; los detalles están en los documentos 02 a 12.

## Alcance

Cubre el backend Node.js/Express (`backend/`), el frontend HTML estático (`frontend/`), los flujos n8n exportados (`n8n/`) y la documentación previa (`docs/`). No cubre la instancia real de MySQL en Clever Cloud, la instancia de n8n ni servidores SMTP, que no se consultaron (ver [10_LIMITACIONES_Y_SUPUESTOS](../00_GESTION_DEL_PROYECTO/10_LIMITACIONES_Y_SUPUESTOS.md)).

Convenciones: **[OBS]** hecho observado en archivos o en la ejecución de pruebas del 2026-10-16; **[INF]** inferencia; **[REC]** recomendación.

## 1. Resumen del sistema

**[OBS]** Plataforma web de venta de suministros a entidades públicas e instituciones (policía, defensa, bomberos, socorro, penitenciario, corporativo). Sus capacidades principales:

| Capacidad | Módulos | Evidencia |
|---|---|---|
| Registro verificado contra un padrón institucional cifrado, con aprobación humana | MOD-02 | `backend/src/routes/auth.js`, `backend/src/seguridad/registroVerificado.js`, `backend/src/routes/solicitudesRegistro.js` |
| Inicio de sesión con captcha propio y segundo factor por correo | MOD-01 | `backend/src/routes/auth.js`, `backend/src/seguridad/captcha.js` |
| Catálogo segmentado por institución y nivel de acceso | MOD-05, MOD-06 | `backend/src/autorizacion.js` (`evaluarProducto`), `backend/src/routes/productos.js` |
| Carrito, checkout idempotente y pago simulado (mock) | MOD-07 | `backend/src/routes/checkout.js`, `backend/src/routes/pagos.js`, `backend/src/paymentProvider.js` |
| Pedidos, comprobantes no-DIAN y correos | MOD-08, MOD-09 | `backend/src/routes/pedidos.js`, `backend/src/routes/comprobantes.js`, `backend/src/emailOutbox.js` |
| Verificación institucional para productos restringidos (doble comprobación, cuatro ojos, autorización por compra) | MOD-04 | `backend/src/routes/verificacion.js`, `backend/src/verificacionCompra.js` |
| Administración: clientes, productos, pedidos, permisos, auditoría, reportes | MOD-05, MOD-10, MOD-12, MOD-13 | rutas homónimas y `frontend/admin-*.html` |
| Asistente de catálogo por reglas y atención (PQRS) | MOD-11 | `backend/src/routes/asistente.js`, `backend/src/routes/atencion.js` |
| Automatizaciones n8n (avisos, resúmenes, mantenimiento) | MOD-14 | `backend/src/automationOutbox.js`, `n8n/workflows/*.json` |

## 2. Contexto operativo

- **[OBS]** Entorno declarado de **laboratorio**, sin HTTPS y con servicios gratuitos ([docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)).
- **[OBS]** MySQL gestionado (Clever Cloud según la documentación previa); el pool se limita a 3 + 1 conexiones (`backend/src/db.js`).
- **[OBS]** Pagos solo con proveedor `mock`; `PAYMENT_MODE=sandbox|prod` no tienen adaptador (REQ-F-040).
- **[OBS]** Los 12 workflows n8n del repositorio están `active: false`.

## 3. Actores

Ver [04_MAPA_DE_ACTORES_Y_PERMISOS.md](04_MAPA_DE_ACTORES_Y_PERMISOS.md). Resumen: ACT-01 Visitante, ACT-02 Solicitante, ACT-03 Cliente activo, ACT-04 Cliente verificado, ACT-05 Administrador/staff, ACT-06 Superadministrador, ACT-07 n8n, ACT-08 Proveedor de pago mock, ACT-09 Fuente del padrón, ACT-10 SMTP, ACT-11 Tareas programadas del backend.

## 4. Procesos y casos de uso

- Procesos de negocio: [03_PROCESOS_DEL_NEGOCIO.md](03_PROCESOS_DEL_NEGOCIO.md).
- Casos de uso UC-001 a UC-023: [05_CASOS_DE_USO.md](05_CASOS_DE_USO.md) y [06_ESPECIFICACION_DE_CASOS_DE_USO.md](06_ESPECIFICACION_DE_CASOS_DE_USO.md).
- Flujos con errores y casos límite: [07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md](07_FLUJOS_PRINCIPALES_Y_ALTERNATIVOS.md).

## 5. Datos

- Modelo conceptual: [08_MODELO_CONCEPTUAL_DE_DATOS.md](08_MODELO_CONCEPTUAL_DE_DATOS.md).
- Diccionario de negocio: [09_DICCIONARIO_DE_DATOS.md](09_DICCIONARIO_DE_DATOS.md). El diccionario técnico (columnas y tipos) está en [03_DISENO/07_DICCIONARIO_TECNICO_DE_DATOS.md](../03_DISENO/07_DICCIONARIO_TECNICO_DE_DATOS.md).
- **[OBS]** Los datos personales se guardan cifrados (AES-256-GCM) y los identificadores buscables como HMAC (REQ-NF-001).

## 6. Integraciones y riesgos

- Integraciones: [10_ANALISIS_DE_DEPENDENCIAS_E_INTEGRACIONES.md](10_ANALISIS_DE_DEPENDENCIAS_E_INTEGRACIONES.md).
- Riesgos técnicos: [11_ANALISIS_DE_RIESGOS_TECNICOS.md](11_ANALISIS_DE_RIESGOS_TECNICOS.md).

## 7. Estado general (síntesis)

| Aspecto | Estado | Fuente |
|---|---|---|
| Pruebas unitarias (Jest 107/107, node:test 51/51) | Aprobadas el 2026-10-16 | Ejecución de `npm test` en esta auditoría |
| Pruebas de integración con MySQL e interfaz jsdom | No ejecutadas en esta auditoría (evidencia histórica del 2026-10-13) | [docs/RESULTADOS_PRUEBAS.md](../docs/RESULTADOS_PRUEBAS.md) |
| Pasarela de pagos real | DOCUMENTADO, NO IMPLEMENTADO | `backend/src/paymentProviderInstance.js` |
| Pantalla "Mi cuenta" | PARCIALMENTE IMPLEMENTADO (solo API, salvo cambio de contraseña) | BUG-004 |
| Reporte mensual | Expuesto sin autenticación | BUG-001 |
| Workflows n8n desplegados | NO DETERMINADO | REQ-F-036 |

**[INF]** El sistema es funcional como prototipo de laboratorio con controles de seguridad notables (cifrado por campo, MFA, autorización leída de la base en cada petición), pero no está listo para producción: faltan HTTPS, pasarela real, validación jurídica, respaldos verificados y la corrección de los defectos abiertos.

## Referencias

- [Requerimientos funcionales](../01_INGENIERIA_DE_REQUERIMIENTOS/05_REQUERIMIENTOS_FUNCIONALES.md)
- [Arquitectura actual](../03_DISENO/02_ARQUITECTURA_ACTUAL.md)
- [docs/ARQUITECTURA_OBJETIVO.md](../docs/ARQUITECTURA_OBJETIVO.md), [docs/ARQUITECTURA_VERIFICACION.md](../docs/ARQUITECTURA_VERIFICACION.md), [docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
