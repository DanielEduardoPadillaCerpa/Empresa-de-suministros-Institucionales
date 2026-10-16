# Inventario de archivos relevantes

| Campo | Valor |
|---|---|
| ID documental | DOC-04-04 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Inventario técnico de todos los archivos versionados (salvo las imágenes individuales), con su función, módulo, importancia, dependencias, observaciones y si contienen información sensible.

## Alcance

**[OBS]** Generado a partir de `git ls-files` (381 archivos): se listan los **176** archivos que no son imágenes. Las **205** imágenes de `backend/img/` se resumen en [02_ESTRUCTURA_REAL_DEL_CODIGO.md](02_ESTRUCTURA_REAL_DEL_CODIGO.md) §2. La misma información está en [04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.csv](04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.csv) (UTF-8 con BOM, separador coma) para filtrarla en una hoja de cálculo.

Criterios: **Importancia** Crítica (sin él la aplicación no arranca o pierde seguridad), Alta, Media, Baja, Nula. **Sensible** = contiene o produce secretos/datos personales; los archivos marcados nunca deben compartirse fuera del equipo autorizado.

## Categorías excluidas (no inventariadas archivo por archivo)

| Categoría | Ubicación | Motivo | Acceso |
|---|---|---|---|
| Dependencias de terceros | `backend/node_modules/` | Generadas por `npm install` | Libre (regenerable) |
| Historial Git | `.git/` | Control de versiones | No modificar |
| Secretos locales | `backend/.env`, `backend/.env.respaldo-*`, `n8n/.env` | Variables con valores reales | **Restringido** — no se leyeron |
| Almacenamiento privado | `backend/storage/` (documentos cifrados, archivo de cuentas de prueba) | Datos personales cifrados | **Restringido** |
| Respaldos | `respaldos-n8n/`, `.respaldo-pre-verificacion/` | Credenciales n8n cifradas y código previo | **Restringido** |
| Herramientas locales | `.aider*`, `backend/generarHash.js` | Historial de herramienta y script con contraseña fija | **Restringido** |
| Imágenes subidas | `backend/img/productos/` (si existe) | Generadas desde el panel | Libre |

## Inventario

| Ruta relativa | Tipo | Función | Módulo | Importancia | Dependencias | Observaciones | Sensible |
|---|---|---|---|---|---|---|---|
| `.gitignore` | Configuración | Excluye .env, respaldos, storage, node_modules, .aider* | MOD-16 | Alta | - | Protege secretos; mantener al día | No |
| `INFORME-INSPECCION.md` | Markdown | Informe previo de corrección de 20 bugs | Documentación | Media | - | Histórico (2026-10-13); menciona contraseña por defecto ya retirada del código | No |
| `README.md` | Markdown | Inicio rápido y resumen del proyecto | Documentación | Alta | - | Encabezados residuales y referencias obsoletas (BUG-008) | No |
| `backend/.env.example` | Plantilla env | Plantilla de variables de entorno con valores de ejemplo | MOD-16 | Alta | server.js | Sin secretos reales (verificado por prefijos) | No |
| `backend/ASISTENTE-CATALOGO.md` | Markdown | Documentación del asistente de catálogo | MOD-11 | Media | - | Documentación previa | No |
| `backend/README.md` | Markdown | Guía previa del backend y endpoints | Documentación | Alta | - | Describe W5/W9 como canal de correo (obsoleto, BUG-008) | No |
| `backend/package-lock.json` | JSON | Versiones exactas de dependencias | MOD-16 | Alta | npm | No editar a mano | No |
| `backend/package.json` | JSON | Dependencias y scripts npm | MOD-16 | Crítica | npm | start, dev, test, test:integration, claves:generar, padron:importar, medir | No |
| `backend/probar-mfa-n8n.js` | JavaScript | Prueba manual de envío MFA por W5 | MOD-14 | Nula | src/mfaCourier.js (inexistente) | Roto: falla al requerir un módulo eliminado; envía correo real (BUG-009) | No |
| `backend/scratch_detalle.js` | JavaScript | Fragmento suelto de la ruta GET /api/productos/:id | MOD-06 | Nula | - | Sin uso (BUG-009) | No |
| `backend/scripts/crear-cuentas-prueba.js` | JavaScript | Crea cuentas sintéticas de prueba | MOD-04 | Media | src/db.js, .env | Se niega en producción; escribe contraseñas en backend/storage | Sí (genera credenciales) |
| `backend/scripts/crear-superadmin.js` | JavaScript | Crea o promueve superadministrador | MOD-05 | Alta | src/db.js, .env | Exige --confirmar-base; toca la base configurada | Sí (credencial inicial) |
| `backend/scripts/generar-claves.js` | JavaScript | Genera ENC_KEY, HMAC_KEY, JWT_SECRET | MOD-16 | Alta | crypto | --escribir modifica backend/.env (con respaldo) | Sí (produce secretos) |
| `backend/scripts/importar-padron.js` | JavaScript | Fuerza la sincronización del padrón cifrado | MOD-02 | Media | src/seguridad/padron.js, PADRON_DB_URI | Lee la fuente y escribe padron_institucional | Sí (datos personales) |
| `backend/scripts/medir-rendimiento.js` | JavaScript | Mide tiempos de registro, login y aprobación | MOD-02 | Media | src/app.js, base real | Crea y borra cuentas sintéticas en la base configurada | No |
| `backend/scripts/migraciones.js` | JavaScript | Estado y reversión de migraciones versionadas | MOD-15 | Alta | src/migraciones | revertir elimina tablas/columnas (destructivo) | No |
| `backend/server.js` | JavaScript | Punto de entrada: dotenv, validación, migración, workers, listen | MOD-16 | Crítica | src/app.js, src/db.js, workers | Puerto por defecto 8080 | No |
| `backend/sql/003_registro_verificado.sql` | SQL | SQL idempotente equivalente a la migración 003 | MOD-15 | Media | MySQL 8 | El servidor lo aplica solo vía JS; este archivo es para revisión/aplicación manual | No |
| `backend/src/app.js` | JavaScript | Construye la app Express: CORS, cabeceras, parsers, rutas, estáticos | MOD-16 | Crítica | routes/* | Usada por server.js y pruebas | No |
| `backend/src/assistant/indiceCatalogo.js` | JavaScript | Índice en memoria del catálogo y FAQ (refresco) | MOD-11 | Media | db.js | Caché 60 s | No |
| `backend/src/assistant/llmAdapter.js` | JavaScript | Adaptador opcional a Ollama local | MOD-11 | Baja | OLLAMA_URL | Solo si ASSISTANT_MODE=llm | No |
| `backend/src/assistant/motor.js` | JavaScript | Motor de reglas del asistente | MOD-11 | Media | normalizador.js | — | No |
| `backend/src/assistant/normalizador.js` | JavaScript | Normalización de texto y Levenshtein | MOD-11 | Media | - | — | No |
| `backend/src/assistant/sinonimos.json` | JSON | Sinónimos del asistente | MOD-11 | Baja | - | — | No |
| `backend/src/auditoria.js` | JavaScript | Registro de auditoría (normal y transaccional) | MOD-13 | Alta | db.js | — | No |
| `backend/src/automationAuth.js` | JavaScript | Middleware de token x-automation-token | MOD-14 | Alta | crypto | Comparación en tiempo constante | No |
| `backend/src/automationOutbox.js` | JavaScript | Worker del outbox hacia n8n (W1,W3,W6,W8,W11) y alerta de stock | MOD-14 | Alta | db.js, automationSignatures.js | 8 intentos, timeout 8 s | No |
| `backend/src/automationSignatures.js` | JavaScript | Firma y verificación HMAC de eventos | MOD-14 | Alta | crypto | — | No |
| `backend/src/autorizacion.js` | JavaScript | Contexto de autorización, evaluarProducto, permisos staff | MOD-05 | Crítica | db.js, tenancy.js | 13 permisos | No |
| `backend/src/configSegura.js` | JavaScript | Validación de secretos al arrancar; secreto JWT | MOD-16 | Crítica | crypto.js, cifradoCampos.js | — | No |
| `backend/src/crypto.js` | JavaScript | Cifrado heredado (CRYPTO_KEY) y v2 (CRYPTO_KEYS), buffers, índices de identificadores | MOD-16 | Crítica | crypto | Clave heredada derivada de texto (BUG-013) | No |
| `backend/src/db.js` | JavaScript | Pools MySQL, DDL tolerante, semillas, admin inicial, aplica migraciones | MOD-15 | Crítica | mysql2, bcryptjs, migraciones | Contiene constante sin uso con hash bcrypt (BUG-007) | Sí (hash embebido) |
| `backend/src/email.js` | JavaScript | Correos de comprobantes (cliente y admin) | MOD-09 | Media | seguridad/correo.js | — | No |
| `backend/src/emailOutbox.js` | JavaScript | Worker de la cola correo_outbox | MOD-09 | Alta | db.js, email.js, receiptTokens.js | 5 intentos, cada 5 s | No |
| `backend/src/inventoryReservations.js` | JavaScript | Libera reservas de inventario | MOD-07 | Alta | db.js | — | No |
| `backend/src/mfaCodes.js` | JavaScript | Genera y compara códigos MFA (HMAC con pepper) | MOD-01 | Crítica | crypto, MFA_TOKEN_PEPPER | — | No |
| `backend/src/migraciones/001_verificacion_institucional.js` | JavaScript | Migración 001: verificación, documentos, elegibilidad, permisos | MOD-15 | Alta | - | Reversible con pérdida de datos | No |
| `backend/src/migraciones/002_verificacion_en_compra.js` | JavaScript | Migración 002: solicitudes, comprobaciones, identificadores, autorizaciones, superadmin | MOD-15 | Alta | - | Reversible con pérdida de datos | No |
| `backend/src/migraciones/003_registro_verificado.js` | JavaScript | Migración 003: estado_cuenta, padrón, solicitudes de registro | MOD-15 | Alta | - | Equivale a sql/003 | No |
| `backend/src/migraciones/index.js` | JavaScript | Ejecutor de migraciones versionadas | MOD-15 | Crítica | schema_migraciones | — | No |
| `backend/src/paymentJobs.js` | JavaScript | Expiración de pedidos pendientes (cada 60 s) | MOD-07 | Alta | db.js, inventoryReservations.js | — | No |
| `backend/src/paymentProvider.js` | JavaScript | Proveedor de pago mock y firma de webhooks | MOD-07 | Alta | crypto | Resultado determinista por centavos | No |
| `backend/src/paymentProviderInstance.js` | JavaScript | Selección del proveedor según PAYMENT_MODE | MOD-07 | Media | paymentProvider.js | sandbox/prod no implementados | No |
| `backend/src/receiptService.js` | JavaScript | Crea comprobante y encola correos al aprobar el pago | MOD-09 | Alta | db.js | — | No |
| `backend/src/receiptTokens.js` | JavaScript | Enlaces firmados del comprobante (24 h) | MOD-09 | Alta | RECEIPT_LINK_SECRET | — | No |
| `backend/src/registroInstitucional.js` | JavaScript | Tipos de comprador, esquemas de registro y organización | MOD-02 | Crítica | zod | Fuente de /api/auth/registro/tipos | No |
| `backend/src/routes/asistente.js` | JavaScript | Router /api/asistente (mensaje, sugerencias, resumen semanal) | MOD-11 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/atencion.js` | JavaScript | Router /api/atencion (mensaje, solicitudes de contacto, calificación) | MOD-11 | Crítica | auth.js, autorizacion.js, db.js | Calificación sin límite (BUG-002) | No |
| `backend/src/routes/auditoria.js` | JavaScript | Router /api/auditoria | MOD-13 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/auth.js` | JavaScript | Router /api/auth y middlewares de autenticación | MOD-01 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/automatizaciones.js` | JavaScript | Router /api/automatizaciones (W2, W4, W11) | MOD-14 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/categorias.js` | JavaScript | Router /api/categorias | MOD-06 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/checkout.js` | JavaScript | Router /api/checkout | MOD-07 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/clientes.js` | JavaScript | Router /api/clientes | MOD-10 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/comprobantes.js` | JavaScript | Router /api/comprobantes (JSON/PDF, reenvío) | MOD-09 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/miCuenta.js` | JavaScript | Router /api/mi-cuenta | MOD-03 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/misreportes.js` | JavaScript | Router /api/mis-reportes | MOD-12 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/pagos.js` | JavaScript | Router /api/pagos (webhook, simulación, estado) | MOD-07 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/pedidos.js` | JavaScript | Router /api/pedidos | MOD-08 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/productos.js` | JavaScript | Router /api/productos (incluye carga multipart de imágenes) | MOD-06 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/reportes.js` | JavaScript | Router /api/reportes (mensual) | MOD-12 | Crítica | auth.js, autorizacion.js, db.js | Endpoint sin autenticación (BUG-001) | No |
| `backend/src/routes/solicitudesRegistro.js` | JavaScript | Router /api/admin/solicitudes | MOD-02 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/routes/verificacion.js` | JavaScript | Router /api/verificacion (titular, staff, compra) | MOD-04 | Crítica | auth.js, autorizacion.js, db.js | — | No |
| `backend/src/seguridad/avisosN8n.js` | JavaScript | Avisos firmados W12 en segundo plano | MOD-14 | Media | N8N_REGISTRO_* | Timeout 3 s | No |
| `backend/src/seguridad/captcha.js` | JavaScript | Captcha SVG propio en memoria | MOD-01 | Alta | crypto | Un solo proceso (BUG-010) | No |
| `backend/src/seguridad/cifradoCampos.js` | JavaScript | Cifrado por campo con AAD e índices ciegos | MOD-16 | Crítica | ENC_KEY, HMAC_KEY | — | No |
| `backend/src/seguridad/contrasenas.js` | JavaScript | bcrypt/bcryptjs, costo, hash de relleno | MOD-01 | Crítica | bcrypt | — | No |
| `backend/src/seguridad/correo.js` | JavaScript | Envío SMTP con nodemailer; consola en laboratorio | MOD-09 | Alta | nodemailer | Dependencia con vulnerabilidad alta (BUG-006) | No |
| `backend/src/seguridad/normalizacion.js` | JavaScript | Normalización de NIT y nombres | MOD-02 | Alta | - | — | No |
| `backend/src/seguridad/padron.js` | JavaScript | Verificación en padrón y sincronización periódica | MOD-02 | Crítica | mysql2, cifradoCampos.js | Fuente solo lectura | No |
| `backend/src/seguridad/registroVerificado.js` | JavaScript | Procesa registro en lote transaccional; retos MFA | MOD-02 | Crítica | db.js (poolTransacciones) | — | No |
| `backend/src/tenancy.js` | JavaScript | Catálogo de instituciones y datos públicos de invitado | MOD-05 | Alta | - | — | No |
| `backend/src/verificacion.js` | JavaScript | Máquina de estados de verificación y almacenamiento de documentos cifrados | MOD-04 | Crítica | crypto.js, fs | DOCUMENTOS_DIR | No |
| `backend/src/verificacionCompra.js` | JavaScript | Solicitudes, comprobaciones, tabla de decisión, autorizaciones de compra, resultados n8n, mantenimiento | MOD-04 | Crítica | db.js, crypto.js | — | No |
| `backend/src/verificacionJobs.js` | JavaScript | Job de mantenimiento de verificaciones (5 min) | MOD-04 | Media | verificacionCompra.js | — | No |
| `backend/test/account-registration-phase0.spec.js` | JavaScript | Prueba unitaria (Jest) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/assistant.spec.js` | JavaScript | Prueba unitaria (Jest) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/automation.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/db-account-migration.spec.js` | JavaScript | Prueba unitaria (Jest) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/integration/ayudantes.js` | JavaScript | Prueba de integración contra MySQL local (borra tablas) | Pruebas | Media | MySQL Docker, TEST_DB_* | No ejecutada el 2026-10-16 | No |
| `backend/test/integration/compra-verificada.int.spec.js` | JavaScript | Prueba de integración contra MySQL local (borra tablas) | Pruebas | Media | MySQL Docker, TEST_DB_* | No ejecutada el 2026-10-16 | No |
| `backend/test/integration/verificacion.int.spec.js` | JavaScript | Prueba de integración contra MySQL local (borra tablas) | Pruebas | Media | MySQL Docker, TEST_DB_* | No ejecutada el 2026-10-16 | No |
| `backend/test/mi-cuenta.spec.js` | JavaScript | Prueba unitaria (Jest) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/paymentJobs.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/receiptEmail.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/receiptService.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/receiptTokens.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/registro-verificado.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/tenancy.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `backend/test/ui/servidor-prueba.js` | JavaScript | Servidor de prueba en :8091 | Pruebas | Media | MySQL Docker | No ejecutada el 2026-10-16 | No |
| `backend/test/ui/ui-e2e.js` | JavaScript | Prueba de interfaz jsdom | Pruebas | Media | MySQL Docker | No ejecutada el 2026-10-16 | No |
| `backend/test/verificacion-compra.test.js` | JavaScript | Prueba unitaria (node:test) | Pruebas | Alta | BD simulada | Aprobada el 2026-10-16 | No |
| `docs/ARQUITECTURA_ACTUAL.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/ARQUITECTURA_OBJETIVO.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/ARQUITECTURA_VERIFICACION.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/AUDITORIA_TECNICA.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/CHANGELOG.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/FLUJO_AUTENTICACION_ACTUAL.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/FLUJO_N8N_VERIFICACION.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/Flujos-n8n.docx` | Word | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/GUIA_INSTALACION_Y_DESPLIEGUE.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/INVENTARIO_FUNCIONALIDADES.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/MATRIZ_FALSOS_POSITIVOS_NEGATIVOS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/MATRIZ_NORMATIVA_COLOMBIA.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/MODELO_AMENAZAS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/MODELO_DATOS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/PLAN_PRUEBAS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/POLITICA_VERIFICACION_IDENTIDAD.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/REGISTRO_VERIFICADO.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/RESULTADOS_PRUEBAS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/TRATAMIENTO_DATOS_PERSONALES.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/VARIABLES_ENTORNO.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/arquitectura-multitenant.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/catalogo-institucionales-referencias.csv` | CSV | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/catalogos-institucionales.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `docs/inteligencia-mercado-b2g-colombia.md` | Markdown | Documentación previa | Documentación | Media | - | Conservada en su lugar | No |
| `file.md` | Markdown | Archivo vacío | Ninguno | Nula | - | Residual (BUG-009) | No |
| `frontend/admin-clientes.html` | HTML | Panel de clientes | MOD-10 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/admin-dashboard.html` | HTML | Dashboard administrativo con Chart.js | MOD-12 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/admin-pedidos.html` | HTML | Gestión de pedidos | MOD-08 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/admin-productos.html` | HTML | Gestión de productos y categorías | MOD-06 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/admin-solicitudes.html` | HTML | Aprobación de solicitudes de registro | MOD-02 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/admin-verificaciones.html` | HTML | Revisión de verificaciones, cumplimiento, permisos y diagnóstico | MOD-04 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/cambiar-password.html` | HTML | Cambio de contraseña (incl. inicial obligatoria) | MOD-03 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/checkout.html` | HTML | Checkout en tres pasos, pago mock, comprobante | MOD-07 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/contacto.html` | HTML | Solicitudes de contacto institucional | MOD-11 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/css/admin-console.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/catalogo.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/global-ui.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/registro-premium.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/style.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/tenant-ui.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/theme-modern.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/css/verificacion.css` | CSS | Hoja de estilos | MOD-17 | Baja | Bootstrap | — | No |
| `frontend/historial.html` | HTML | Historial de pedidos y comprobantes | MOD-08 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/index.html` | HTML | Catálogo con carrito y asistente | MOD-06 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/js/admin-solicitudes-contador.js` | JavaScript | Contador de solicitudes pendientes en el menú (cada 12 s) | MOD-02 | Alta | auth.js | — | No |
| `frontend/js/auth.js` | JavaScript | Sesión en localStorage, API_BASE, refresh, logout | MOD-01 | Alta | auth.js | API_BASE fijo (BUG-003); tokens en localStorage (BUG-011) | No |
| `frontend/js/captcha.js` | JavaScript | Carga del captcha | MOD-01 | Alta | auth.js | — | No |
| `frontend/js/cart.js` | JavaScript | Carrito en localStorage | MOD-07 | Alta | auth.js | — | No |
| `frontend/js/chatbot.js` | JavaScript | Widget del asistente y calificación | MOD-11 | Alta | auth.js | — | No |
| `frontend/js/checkout-autofill.js` | JavaScript | Prellenado del checkout con el perfil | MOD-07 | Alta | auth.js | — | No |
| `frontend/js/global-layout.js` | JavaScript | Plantilla y menú común | MOD-17 | Alta | auth.js | — | No |
| `frontend/js/i18n.js` | JavaScript | Traducciones | MOD-17 | Alta | auth.js | — | No |
| `frontend/js/imagenes.js` | JavaScript | Resolución de imágenes de productos | MOD-06 | Alta | auth.js | — | No |
| `frontend/js/navbar.js` | JavaScript | Menú de navegación | MOD-17 | Alta | auth.js | — | No |
| `frontend/js/registro-wizard.js` | JavaScript | Asistente del formulario de registro | MOD-02 | Alta | auth.js | — | No |
| `frontend/js/reportes.js` | JavaScript | Gráficos del reporte mensual | MOD-12 | Alta | auth.js | — | No |
| `frontend/landing.html` | HTML | Portada | MOD-17 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/leyes.html` | HTML | Normatividad informativa | MOD-17 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/login.html` | HTML | Inicio de sesión con captcha y MFA | MOD-01 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/mi-verificacion.html` | HTML | Verificación institucional del titular | MOD-04 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/mis-pedidos.html` | HTML | Pedidos del cliente | MOD-08 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/mis-reportes.html` | HTML | Reportes/sugerencias del cliente | MOD-12 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/producto-detalle.html` | HTML | Detalle de producto | MOD-06 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/registro.html` | HTML | Solicitud de cuenta (asistente por pasos) | MOD-02 | Alta | js/auth.js, js/global-layout.js | — | No |
| `frontend/reportes.html` | HTML | Reporte mensual con Chart.js | MOD-12 | Alta | js/auth.js, js/global-layout.js | — | No |
| `n8n/docker-compose.yml` | YAML | Servicio n8n en Docker | MOD-14 | Media | .env de n8n | Valores en n8n/.env (no versionado) | No |
| `n8n/generar-w11.js` | JavaScript | Generador del JSON de W11 | MOD-14 | Media | - | Sobrescribe el JSON del workflow | No |
| `n8n/generar-w12.js` | JavaScript | Generador del JSON de W12 | MOD-14 | Media | - | Sobrescribe el JSON del workflow | No |
| `n8n/workflows/W1-alerta-pagos.json` | JSON | Workflow n8n W1 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W10-contexto-institucional.json` | JSON | Workflow n8n W10 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W11-verificacion-compra.json` | JSON | Workflow n8n W11 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W12-avisos-registro.json` | JSON | Workflow n8n W12 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W2-resumen-diario.json` | JSON | Workflow n8n W2 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W3-alerta-stock-bajo.json` | JSON | Workflow n8n W3 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W4-expirar-pedidos.json` | JSON | Workflow n8n W4 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W5-mfa-email.json` | JSON | Workflow n8n W5 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W6-asistente-escalado.json` | JSON | Workflow n8n W6 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W7-resumen-preguntas-asistente.json` | JSON | Workflow n8n W7 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W8-notificaciones-cuenta.json` | JSON | Workflow n8n W8 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `n8n/workflows/W9-comprobantes-email.json` | JSON | Workflow n8n W9 importable | MOD-14 | Media | n8n 1.110.1 | active:false | No |
| `package-lock.json` | JSON | Lockfile raíz sin dependencias | Ninguno | Baja | - | No hay package.json en la raíz | No |

## Observaciones del inventario

- **[OBS]** Archivos residuales o rotos: `file.md`, `backend/scratch_detalle.js`, `backend/probar-mfa-n8n.js` (BUG-009). El último requiere `src/mfaCourier.js`, que ya no existe.
- **[OBS]** `backend/src/db.js` contiene la constante sin uso `USUARIOS_SEED` con un hash bcrypt (BUG-007). No se reproduce aquí.
- **[REC]** Retirar los archivos residuales y la constante en una tarea de mantenimiento separada, con revisión.

## Referencias

- [02_ESTRUCTURA_REAL_DEL_CODIGO.md](02_ESTRUCTURA_REAL_DEL_CODIGO.md) · [03_MODULOS_Y_RESPONSABILIDADES.md](03_MODULOS_Y_RESPONSABILIDADES.md) · [15_INVENTARIO_DE_SCRIPTS.md](15_INVENTARIO_DE_SCRIPTS.md)
