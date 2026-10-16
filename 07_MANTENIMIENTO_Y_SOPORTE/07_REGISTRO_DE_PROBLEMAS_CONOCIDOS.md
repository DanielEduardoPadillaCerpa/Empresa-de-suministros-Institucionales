# Registro de problemas conocidos

| Campo | Valor |
|---|---|
| ID documental | DOC-07-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Dar a soporte una referencia operativa de cada defecto o hallazgo conocido: cómo se manifiesta, por qué ocurre, qué hacer mientras tanto y qué corrección se propone.

## Alcance

BUG-001 a BUG-031 del catálogo (BUG-019…031 añadidos en la verificación cruzada) de la auditoría (2026-10-16). El registro de defectos desde el punto de vista de pruebas está en [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md). Las severidades son inferencias [INF]; las soluciones definitivas son propuestas [REC] no aprobadas.

## Registro

| ID | Sev. | Síntoma | Causa [OBS] | Solución temporal | Solución definitiva propuesta [REC] | Estado |
|---|---|---|---|---|---|---|
| BUG-001 | Alta | `GET /api/reportes/mensual` responde datos a cualquiera, sin sesión | `backend/src/routes/reportes.js` no usa `requiereAutenticacion` ni permisos | No exponer el backend fuera del laboratorio; bloquear la ruta en el proxy | Añadir `requiereAutenticacion, requiereAdmin, requierePermiso(...)` y no devolver comentarios libres | Abierto |
| BUG-002 | Baja | Calificaciones de atención pueden enviarse sin límite | `POST /api/atencion/calificacion` sin autenticación ni rate limit (`atencion.js`) | Revisar `atenciones` si los KPIs cambian bruscamente | Limitador por IP y validar `conversacionId` | Abierto |
| BUG-003 | Media | El frontend falla al servirse desde otro dominio o puerto | `API_BASE = 'http://localhost:8081'` en `frontend/js/auth.js` | Servir el frontend desde el propio backend en `localhost:8081` | Usar origen relativo (`''`) o configuración por entorno | Abierto |
| BUG-004 | Media | El usuario no encuentra dónde editar perfil, cambiar correo o cerrar sesiones | No existe pantalla para `/api/mi-cuenta` (solo `cambiar-password.html`) | Soporte guía uso por API o gestiona por solicitud | Crear página "Mi cuenta" | Abierto |
| BUG-005 | Baja | Solicitudes de corrección/eliminación sin bandeja para el administrador | Sin pantalla para `/api/mi-cuenta/solicitudes` | Consultar `solicitudes_cuenta` en BD (solo lectura) | Pantalla administrativa | Abierto |
| BUG-006 | Alta | `npm audit` reporta vulnerabilidad alta | `nodemailer` 6.10.1 | Destinatarios solo de la base; sin `jsonTransport`/OAuth2 | Actualizar a 10.1.2 ([05_GESTION_DE_DEPENDENCIAS.md](05_GESTION_DE_DEPENDENCIAS.md) §3) | Abierto |
| BUG-007 | Baja | Código sin uso con un hash bcrypt en el repositorio | Constante `USUARIOS_SEED` en `backend/src/db.js` | Ninguna (no se ejecuta) | Eliminar la constante y verificar que ninguna cuenta use ese hash | Abierto |
| BUG-008 | Baja | Instrucciones contradictorias entre documentos | Referencias a `src/mfaCourier.js` y `.vscode/settings.json` inexistentes; README raíz con encabezados residuales; `backend/README.md` describe MFA/comprobantes por n8n; `VARIABLES_ENTORNO.md` con N8N_MFA_* obligatorias y PORT 8080 vs 8081 | Usar esta estructura documental como referencia vigente | Corregir los documentos previos | Abierto |
| BUG-009 | Baja | Archivos sin función en el repositorio | `file.md` vacío, `backend/scratch_detalle.js`, `backend/probar-mfa-n8n.js` (W5 sin uso) | Ignorarlos | Eliminarlos tras confirmar | Abierto |
| BUG-010 | Media | Captcha inválido tras reiniciar; límites desiguales con varias instancias | Retos de captcha y contadores de rate limit en memoria | Una sola instancia; reiniciar libera límites | Captcha gestionado o almacén compartido | Abierto (conocido) |
| BUG-011 | Media | Riesgo de robo de sesión por XSS | Tokens en `localStorage` | Escape de datos en páginas; MFA | Cookie `HttpOnly` + CSRF (REQ-NF-015) | Abierto (conocido) |
| BUG-012 | Media | Tráfico en claro; sin CSP/HSTS | Laboratorio sin TLS (`app.js`) | Uso solo local | HTTPS, HSTS y CSP (REQ-NF-016) | Abierto (conocido) |
| BUG-013 | Media | Datos antiguos protegidos con clave débil | `CRYPTO_KEY` rellenada/recortada a 32 bytes (`crypto.js`); sin script de recifrado | Proteger `.env` | Script de recifrado al anillo v2 | Abierto (conocido) |
| BUG-014 | Baja | NIT de la entidad sale hacia n8n en W11 | Diseño de W11 (consulta RUES) | W11 está inactivo | Decisión del interesado: mantener o eliminar | Decisión pendiente |
| BUG-015 | Media | Datos se conservan indefinidamente | Sin borrado automático ni flujo de borrado del documento de identidad | Borrado manual por el equipo | Definir plazos jurídicos y job de depuración | Abierto (conocido) |
| BUG-016 | Baja | Textos en español aunque se elija otro idioma | Páginas nuevas sin claves `data-i18n` | — | Completar `i18n.js` | Abierto (conocido) |
| BUG-017 | Info | Dos librerías de hash con costos distintos | `bcrypt` y `bcryptjs` | — | Unificar en `seguridad/contrasenas.js` | Abierto |
| BUG-018 | Media | Lo desplegado no se puede identificar por versión; `main` desactualizada | Sin etiquetas Git; rama sin fusionar | Usar hash de commit como referencia | Fusionar tras revisión y etiquetar liberaciones | Abierto |
| BUG-019 | Alta | Con `NODE_ENV=production` el servidor no arranca | `backend/src/paymentProvider.js` prohíbe el proveedor mock en producción y los modos `sandbox`/`prod` lanzan error; `backend/server.js` llama a `getPaymentProvider()` al iniciar | Mantener el laboratorio sin `NODE_ENV=production` | Implementar y validar un adaptador de pasarela, o desacoplar la validación del proveedor del arranque | Abierto |
| BUG-020 | Baja | El diagnóstico del superadministrador muestra `mfaN8n`, configuración obsoleta | `backend/src/routes/verificacion.js` (diagnóstico) lee `N8N_MFA_WEBHOOK_URL`, sin uso desde 2026-10-15 | Ignorar ese indicador | Reemplazarlo por el estado de SMTP | Abierto |
| BUG-021 | Media | En laboratorio sin SMTP el correo completo, código MFA incluido, se imprime en consola | `backend/src/seguridad/correo.js` (bloque `[correo-laboratorio]`); no ocurre en producción | Usar Mailpit y no compartir la consola | Imprimir solo destinatario y asunto, o exigir una bandera explícita | Abierto |
| BUG-022 | Baja | Rutas heredadas registran el error completo (`console.error(err)`) | `backend/src/routes/` auth (refresh, logout), categorias, clientes, misreportes, pedidos, productos, reportes, auditoria | — | Registrar solo `err.code`, como el resto del backend | Abierto |
| BUG-023 | Baja | Archivos residuales adicionales: `package-lock.json` sin `package.json` en la raíz; `backend/probar-mfa-n8n.js` no funciona (requiere `src/mfaCourier`, inexistente) | raíz y `backend/` | — | Retirar o actualizar tras confirmación | Abierto |
| BUG-024 | Media | El cambio de contraseña y el administrador inicial usan costo bcrypt fijo 10, sin respetar `BCRYPT_COST` | `backend/src/routes/miCuenta.js` (línea 429), `backend/src/db.js` (línea 1265), `backend/scripts/crear-cuentas-prueba.js` | — | Usar `hashContrasena()` de `src/seguridad/contrasenas.js` | Abierto |
| BUG-025 | Baja | El estado `usuarios.estado_cuenta = suspendida` nunca se asigna | La suspensión opera sobre `clientes.estado_verificacion` y `session_version` | — | Unificar el modelo de suspensión | Abierto |
| BUG-026 | Baja | Librerías de CDN sin integridad (SRI) | `frontend/*.html` cargan Bootstrap 5.3.3 y Chart.js 4.4.4 sin `integrity` | — | Agregar `integrity` y `crossorigin`, o servir las librerías localmente | Abierto |
| BUG-027 | Baja | `.env.example` desalineado con el código | Variables declaradas sin uso: `N8N_CHAT_WEBHOOK_URL`, `N8N_API_TOKEN`, `N8N_RECEIPT_WEBHOOK_*`, `N8N_MFA_WEBHOOK_SECRET`; `STOCK_MINIMO` se usa (`src/assistant/motor.js`) y no está declarada | — | Actualizar la plantilla | Abierto |
| BUG-028 | Baja | Funciones sin pantalla: auditoría, solicitudes de contacto (PQRS) e inventario bajo | Solo existen `GET /api/auditoria`, `POST /api/atencion/solicitudes` (sin consulta) y `GET /api/productos/bajo-inventario` | Consultar por API o SQL | Diseñar pantallas administrativas | Abierto |
| BUG-029 | Baja | `clientes.nit`, `nombre_unidad` y `direccion_instalacion` se guardan en claro; la documentación previa afirma que las direcciones se cifran | `backend/src/db.js`, `backend/src/routes/clientes.js`, `backend/src/routes/miCuenta.js` | — | Confirmar si son datos de la entidad y, si no, cifrarlos | Abierto |
| BUG-030 | Baja | W6 no desactiva el guardado de ejecuciones en n8n | `n8n/workflows/W6-asistente-escalado.json` (`settings` sin `saveData*`) | `EXECUTIONS_DATA_SAVE_ON_*=none` en n8n | Agregar los ajustes al workflow | Abierto |
| BUG-031 | Media | Borrar un cliente elimina en cascada pedidos, pagos y comprobantes | Claves foráneas `ON DELETE CASCADE` desde `pedidos`, `pagos`, `comprobantes` (`backend/src/db.js`) | No eliminar clientes con pedidos | Borrado lógico o restricción de borrado | Abierto |

## Problemas operativos frecuentes (no son defectos)

| Situación | Explicación |
|---|---|
| "Mi cuenta está en revisión" al iniciar sesión | Comportamiento esperado (RN-001) |
| El código MFA aparece en la consola del servidor | Laboratorio sin SMTP: modo `[correo-laboratorio]`; en producción es un error |
| "Too many connections" al correr un script con el servidor encendido | Límite de 5 conexiones (RSK-004); detener el servidor |

## Referencias

- [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)
- [../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
- [03_GUIA_DE_DIAGNOSTICO.md](03_GUIA_DE_DIAGNOSTICO.md)
