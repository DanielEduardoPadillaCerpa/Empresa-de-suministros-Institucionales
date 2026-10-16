# Registro de defectos

| Campo | Valor |
|---|---|
| ID documental | DOC-05-09 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar los defectos y hallazgos BUG-001…BUG-031 identificados en la auditoría del 2026-10-16 (por inspección de código, `npm audit` y revisión documental) junto con los conocidos de auditorías previas, sin corregirlos (la auditoría es documental).

## Alcance

Ningún defecto proviene de una prueba fallida: la corrida automatizada del 2026-10-16 no tuvo fallos. La severidad es una inferencia [INF] pendiente de validación.

## 1. Resumen

| ID | Título | Severidad | Módulo | REQ afectado | Estado |
|---|---|---|---|---|---|
| BUG-001 | Reporte mensual accesible sin autenticación | Alta | MOD-12 | REQ-F-033, REQ-NF-017 | Abierto |
| BUG-002 | Calificaciones sin autenticación ni límite de tasa | Baja | MOD-11 | REQ-F-032, REQ-NF-004 | Abierto |
| BUG-003 | `API_BASE` fijo en `http://localhost:8081` | Media | MOD-17 | REQ-F-039 (despliegue) | Abierto |
| BUG-004 | Mi cuenta sin pantalla | Media | MOD-03 | REQ-F-010…REQ-F-013 | Abierto |
| BUG-005 | Resolución de solicitudes de cuenta sin pantalla | Baja | MOD-03 | REQ-F-013 | Abierto |
| BUG-006 | `nodemailer` 6.10.1 con vulnerabilidades altas | Alta | MOD-09 | REQ-F-025, REQ-F-006 | Abierto (conocido desde 2026-10-13) |
| BUG-007 | Constante sin uso con hash bcrypt embebido | Baja | MOD-15 | REQ-NF-009 | Abierto |
| BUG-008 | Documentación previa inconsistente | Baja | Transversal | — | Abierto |
| BUG-009 | Archivos residuales versionados | Baja | Transversal | — | Abierto |
| BUG-010 | Captcha y limitadores en memoria del proceso | Media | MOD-01 | REQ-NF-004 | Abierto (conocido) |
| BUG-011 | Tokens de sesión en `localStorage` | Media | MOD-01/17 | REQ-NF-015 | Abierto (conocido) |
| BUG-012 | Sin HTTPS, CSP ni HSTS | Media | MOD-16 | REQ-NF-005, REQ-NF-016 | Abierto (conocido) |
| BUG-013 | Datos heredados con clave derivada de texto, sin recifrado | Media | MOD-16 | REQ-NF-001 | Abierto (conocido) |
| BUG-014 | W11 envía el NIT de la entidad a n8n | Baja | MOD-14 | REQ-NF-008 | Decisión pendiente |
| BUG-015 | Sin borrado por plazos de conservación | Media | MOD-03/04 | REQ-NF-017 | Abierto (conocido) |
| BUG-016 | Páginas nuevas sin traducción | Baja | MOD-17 | REQ-F-038 | Abierto (conocido) |
| BUG-017 | Dos librerías bcrypt | Info | MOD-01/15 | REQ-NF-002 | Abierto |
| BUG-018 | Sin etiquetas de versión y trabajo sin fusionar a `main` | Media | Gestión | — | Abierto |
| BUG-019 | Con `NODE_ENV=production` el servidor no arranca | Alta | MOD-07 | REQ-F-040, REQ-NF-016 | Abierto |
| BUG-020 | El diagnóstico del superadministrador muestra `mfaN8n`, configuración obsoleta | Baja | MOD-04 | REQ-F-030 | Abierto |
| BUG-021 | En laboratorio sin SMTP el correo completo, código MFA incluido, se imprime en consola | Media | MOD-09 | REQ-NF-009 | Abierto |
| BUG-022 | Rutas heredadas registran el error completo (`console.error(err)`) | Baja | MOD-06/08/10/12/13 | REQ-NF-009 | Abierto |
| BUG-023 | Archivos residuales adicionales: `package-lock.json` sin `package.json` en la raíz; `backend/probar-mfa-n8n.js` no funciona (requiere `src/mfaCourier`, inexistente) | Baja | — | — | Abierto |
| BUG-024 | El cambio de contraseña y el administrador inicial usan costo bcrypt fijo 10, sin respetar `BCRYPT_COST` | Media | MOD-03/15 | REQ-NF-002 | Abierto |
| BUG-025 | El estado `usuarios.estado_cuenta = suspendida` nunca se asigna | Baja | MOD-01/04 | REQ-F-028 | Abierto |
| BUG-026 | Librerías de CDN sin integridad (SRI) | Baja | MOD-17 | REQ-NF-005 | Abierto |
| BUG-027 | `.env.example` desalineado con el código | Baja | MOD-16 | — | Abierto |
| BUG-028 | Funciones sin pantalla: auditoría, solicitudes de contacto (PQRS) e inventario bajo | Baja | MOD-11/12/13 | REQ-F-016, REQ-F-032, REQ-F-034 | Abierto |
| BUG-029 | `clientes.nit`, `nombre_unidad` y `direccion_instalacion` se guardan en claro; la documentación previa afirma que las direcciones se cifran | Baja | MOD-10 | REQ-NF-001, REQ-NF-017 | Abierto |
| BUG-030 | W6 no desactiva el guardado de ejecuciones en n8n | Baja | MOD-14 | REQ-NF-008 | Abierto |
| BUG-031 | Borrar un cliente elimina en cascada pedidos, pagos y comprobantes | Media | MOD-10/15 | REQ-F-026 | Abierto |

## 2. Detalle

### BUG-001 — Reporte mensual accesible sin autenticación
- **Evidencia:** `backend/src/routes/reportes.js` línea 6 define `router.get('/mensual', async …)` sin middleware; `backend/src/app.js` monta `/api/reportes`. El consumidor es `frontend/js/reportes.js`.
- **Pasos para reproducir (entorno de pruebas, no ejecutados):** sin cabecera `Authorization`, `GET /api/reportes/mensual`.
- **Resultado esperado:** 401/403. **Resultado según el código:** 200 con conteos de atenciones, calificación promedio, pedidos por estado, 5 productos más vendidos y 20 comentarios de calificaciones ≤3 (texto libre que puede contener datos personales).
- **Caso relacionado:** TC-033, TC-208. **Riesgo:** RSK-008.

### BUG-002 — Calificaciones sin autenticación ni límite
- **Evidencia:** `backend/src/routes/atencion.js` línea 62 (`POST /calificacion`) sin limitador, a diferencia de `/solicitudes` (5 cada 15 min).
- **Impacto [INF]:** llenado de `atenciones` y alteración de los indicadores de BUG-001. **Caso:** TC-032.

### BUG-003 — `API_BASE` fijo
- **Evidencia:** `frontend/js/auth.js` línea 10 `const API_BASE = 'http://localhost:8081';`.
- **Impacto:** desplegar el frontend en otro origen requiere editar código. **Caso:** TC-039.

### BUG-004 — Mi cuenta sin pantalla
- **Evidencia:** ninguna página de `frontend/` llama a `/api/mi-cuenta` salvo `cambiar-password.html` (`/api/mi-cuenta/password`).
- **Impacto:** perfil, cambio de correo, cerrar sesiones y solicitudes de datos solo vía API. **Casos:** TC-010…TC-013.

### BUG-005 — Resolución de solicitudes de cuenta sin pantalla
- **Evidencia:** `GET/PATCH /api/mi-cuenta/solicitudes` existen en `backend/src/routes/miCuenta.js`; ninguna página las usa. **Caso:** TC-013.

### BUG-006 — `nodemailer` vulnerable
- **Evidencia:** `npm audit --omit=dev` del 2026-10-16: 1 vulnerabilidad alta (`nodemailer` ≤10.0.5; instalada 6.10.1; corrección 10.1.2, cambio mayor).
- **Acción [REC]:** actualizar en una rama, ejecutar TC-025, TC-006, TC-011. **Riesgo:** RSK-005.

### BUG-007 — Hash embebido sin uso
- **Evidencia:** `backend/src/db.js` línea 63, constante `USUARIOS_SEED` (cuenta admin@empresa.com) no referenciada. El valor no se reproduce aquí.
- **Acción [REC]:** eliminarla y confirmar que esa cuenta no exista con esa credencial en ninguna base.

### BUG-008 — Documentación previa inconsistente
- **Evidencia:** `docs/AUDITORIA_TECNICA.md` y `docs/FLUJO_AUTENTICACION_ACTUAL.md` citan `src/mfaCourier.js` (no existe); `README.md` y `backend/README.md` citan `.vscode/settings.json` (no existe); `README.md` contiene encabezados residuales; `backend/README.md` describe MFA y comprobantes vía n8n W5/W9 (hoy nodemailer); `docs/VARIABLES_ENTORNO.md` marca `N8N_MFA_*` como obligatorias y PORT por defecto 8080 (`.env.example` usa 8081). **Riesgo:** RSK-016.

### BUG-009 — Archivos residuales
- **Evidencia:** `file.md` (vacío, raíz), `backend/scratch_detalle.js`, `backend/probar-mfa-n8n.js` (prueba de W5, sin uso).

### BUG-010 — Estado en memoria
- **Evidencia:** `backend/src/seguridad/captcha.js` (Map en memoria); `express-rate-limit` con almacén por defecto. **Riesgo:** RSK-014.

### BUG-011 — Tokens en `localStorage`
- **Evidencia:** `frontend/js/auth.js` (comentario de cabecera y uso de `localStorage`). **Caso:** TC-115. **Riesgo:** RSK-006.

### BUG-012 — Sin HTTPS, CSP ni HSTS
- **Evidencia:** `backend/src/app.js` (comentario: sin HSTS por falta de HTTPS en laboratorio). **Casos:** TC-105, TC-116. **Riesgo:** RSK-007.

### BUG-013 — Datos heredados con clave débil
- **Evidencia:** `backend/src/crypto.js` (`claveHeredada()` rellena/recorta `CRYPTO_KEY` a 32 bytes); no hay script de recifrado. **Riesgo:** RSK-001, RSK-002.

### BUG-014 — NIT de entidad hacia n8n
- **Evidencia:** [`docs/REGISTRO_VERIFICADO.md`](../docs/REGISTRO_VERIFICADO.md) §4; prueba «solo NIT de persona jurídica sale hacia n8n» pasó. Decisión del interesado pendiente.

### BUG-015 — Sin borrado por plazos
- **Evidencia:** [`docs/TRATAMIENTO_DATOS_PERSONALES.md`](../docs/TRATAMIENTO_DATOS_PERSONALES.md) §3–4. **Caso:** TC-117. **Riesgo:** RSK-010.

### BUG-016 — Páginas sin traducción
- **Evidencia:** conteo de `data-i18n`: `mi-verificacion.html`, `checkout.html`, `contacto.html`, `leyes.html`, `cambiar-password.html` = 0; `admin-productos.html`, `admin-solicitudes.html`, `admin-verificaciones.html` = 1. **Caso:** TC-038.

### BUG-017 — Dos librerías bcrypt
- **Evidencia:** `backend/package.json` (`bcrypt`, `bcryptjs`); `src/seguridad/contrasenas.js` usa `bcrypt` con respaldo `bcryptjs`; `src/db.js` usa `bcryptjs`. Hashes compatibles; impacto bajo.

### BUG-018 — Sin etiquetas y sin fusionar
- **Evidencia:** `git tag` vacío; `main` no contiene los commits de `feature/verificacion-seguridad`. **Riesgo:** RSK-017.

## 2b. Hallazgos adicionales de la verificación cruzada (BUG-019…BUG-031)

Identificados al consolidar la documentación el 2026-10-16 y **confirmados por inspección de código** (no por ejecución). [OBS]

### BUG-019 — Con `NODE_ENV=production` el servidor no arranca
- **Evidencia:** `backend/src/paymentProvider.js` prohíbe el proveedor mock en producción y los modos `sandbox`/`prod` lanzan error; `backend/server.js` llama a `getPaymentProvider()` al iniciar. **Propuesta [REC]:** Implementar y validar un adaptador de pasarela, o desacoplar la validación del proveedor del arranque.

### BUG-020 — El diagnóstico del superadministrador muestra `mfaN8n`, configuración obsoleta
- **Evidencia:** `backend/src/routes/verificacion.js` (diagnóstico) lee `N8N_MFA_WEBHOOK_URL`, sin uso desde 2026-10-15. **Propuesta [REC]:** Reemplazarlo por el estado de SMTP.

### BUG-021 — En laboratorio sin SMTP el correo completo, código MFA incluido, se imprime en consola
- **Evidencia:** `backend/src/seguridad/correo.js` (bloque `[correo-laboratorio]`); no ocurre en producción. **Propuesta [REC]:** Imprimir solo destinatario y asunto, o exigir una bandera explícita.

### BUG-022 — Rutas heredadas registran el error completo (`console.error(err)`)
- **Evidencia:** `backend/src/routes/` auth (refresh, logout), categorias, clientes, misreportes, pedidos, productos, reportes, auditoria. **Propuesta [REC]:** Registrar solo `err.code`, como el resto del backend.

### BUG-023 — Archivos residuales adicionales: `package-lock.json` sin `package.json` en la raíz; `backend/probar-mfa-n8n.js` no funciona (requiere `src/mfaCourier`, inexistente)
- **Evidencia:** raíz y `backend/`. **Propuesta [REC]:** Retirar o actualizar tras confirmación.

### BUG-024 — El cambio de contraseña y el administrador inicial usan costo bcrypt fijo 10, sin respetar `BCRYPT_COST`
- **Evidencia:** `backend/src/routes/miCuenta.js` (línea 429), `backend/src/db.js` (línea 1265), `backend/scripts/crear-cuentas-prueba.js`. **Propuesta [REC]:** Usar `hashContrasena()` de `src/seguridad/contrasenas.js`.

### BUG-025 — El estado `usuarios.estado_cuenta = suspendida` nunca se asigna
- **Evidencia:** La suspensión opera sobre `clientes.estado_verificacion` y `session_version`. **Propuesta [REC]:** Unificar el modelo de suspensión.

### BUG-026 — Librerías de CDN sin integridad (SRI)
- **Evidencia:** `frontend/*.html` cargan Bootstrap 5.3.3 y Chart.js 4.4.4 sin `integrity`. **Propuesta [REC]:** Agregar `integrity` y `crossorigin`, o servir las librerías localmente.

### BUG-027 — `.env.example` desalineado con el código
- **Evidencia:** Variables declaradas sin uso: `N8N_CHAT_WEBHOOK_URL`, `N8N_API_TOKEN`, `N8N_RECEIPT_WEBHOOK_*`, `N8N_MFA_WEBHOOK_SECRET`; `STOCK_MINIMO` se usa (`src/assistant/motor.js`) y no está declarada. **Propuesta [REC]:** Actualizar la plantilla.

### BUG-028 — Funciones sin pantalla: auditoría, solicitudes de contacto (PQRS) e inventario bajo
- **Evidencia:** Solo existen `GET /api/auditoria`, `POST /api/atencion/solicitudes` (sin consulta) y `GET /api/productos/bajo-inventario`. **Propuesta [REC]:** Diseñar pantallas administrativas.

### BUG-029 — `clientes.nit`, `nombre_unidad` y `direccion_instalacion` se guardan en claro; la documentación previa afirma que las direcciones se cifran
- **Evidencia:** `backend/src/db.js`, `backend/src/routes/clientes.js`, `backend/src/routes/miCuenta.js`. **Propuesta [REC]:** Confirmar si son datos de la entidad y, si no, cifrarlos.

### BUG-030 — W6 no desactiva el guardado de ejecuciones en n8n
- **Evidencia:** `n8n/workflows/W6-asistente-escalado.json` (`settings` sin `saveData*`). **Propuesta [REC]:** Agregar los ajustes al workflow.

### BUG-031 — Borrar un cliente elimina en cascada pedidos, pagos y comprobantes
- **Evidencia:** Claves foráneas `ON DELETE CASCADE` desde `pedidos`, `pagos`, `comprobantes` (`backend/src/db.js`). **Propuesta [REC]:** Borrado lógico o restricción de borrado.

## 3. Ciclo de vida de un defecto

Abierto → En análisis → En corrección → Corregido (con prueba) → Verificado → Cerrado. Responsable de cada transición: PENDIENTE DE ASIGNACIÓN. Plantilla para nuevos defectos:

| Campo | Valor |
|---|---|
| ID | BUG-0NN |
| Título | |
| Severidad | Crítica / Alta / Media / Baja / Info |
| Módulo / REQ | |
| Entorno y commit | |
| Pasos | |
| Esperado / Observado | |
| Evidencia | ruta en [13_EVIDENCIAS/](13_EVIDENCIAS/README.md) |
| Estado | |

## Referencias

- [06_PRUEBAS_DE_SEGURIDAD.md](06_PRUEBAS_DE_SEGURIDAD.md) · [`../07_MANTENIMIENTO_Y_SOPORTE/07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md`](../07_MANTENIMIENTO_Y_SOPORTE/07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md) · [`../00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md`](../00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md)
