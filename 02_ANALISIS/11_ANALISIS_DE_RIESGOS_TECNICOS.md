# Análisis de riesgos técnicos

| Campo | Valor |
|---|---|
| ID documental | DOC-02-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Analizar las causas y los efectos de los riesgos técnicos identificados, vinculándolos con los defectos (BUG) y la matriz de riesgos del proyecto (RSK).

## Alcance

Riesgos técnicos y de seguridad derivados de la inspección del código, la configuración de ejemplo, las dependencias y la documentación previa. La probabilidad y el impacto son estimaciones **[INF]**, no mediciones. La matriz oficial (con responsables y seguimiento) está en [00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md](../00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md); los defectos en [05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md).

## 1. Mapa de calor

| Impacto \ Probabilidad | Media | Alta |
|---|---|---|
| **Muy alto** | RSK-001 | RSK-012 |
| **Alto** | RSK-003, RSK-006, RSK-009 | RSK-002, RSK-005, RSK-007, RSK-010, RSK-015 |
| **Medio** | RSK-004, RSK-014 | RSK-008, RSK-011, RSK-013, RSK-017 |
| **Bajo** | — | RSK-016 |

## 2. Análisis causa → efecto

| Riesgo | Causa (evidencia) | Efecto | Controles existentes **[OBS]** | Tratamiento propuesto **[REC]** |
|---|---|---|---|---|
| RSK-001 Pérdida de claves | Las claves `ENC_KEY`, `HMAC_KEY`, `CRYPTO_KEYS`, `IDENT_HMAC_KEY` viven solo en `backend/.env` (`seguridad/cifradoCampos.js`, `crypto.js`) | Padrón, solicitudes, datos de clientes, identificadores y documentos irrecuperables | Formato versionado con rotación; `generar-claves.js` hace respaldo del `.env` antes de escribir | Custodia en gestor de secretos y copia fuera del equipo; procedimiento de rotación probado |
| RSK-002 Secretos expuestos o débiles | Auditorías previas señalaron secretos legibles en el `.env` y la contraseña del padrón compartida en texto ([docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md) §8; [docs/AUDITORIA_TECNICA.md](../docs/AUDITORIA_TECNICA.md) A1–A3); `CRYPTO_KEY` heredada derivada de texto (BUG-013) | Suplantación de sesiones, descifrado de datos heredados, acceso a la base | `configSegura.js` bloquea secretos débiles en producción; `.env` en `.gitignore` | Rotar todos los secretos; script de recifrado |
| RSK-003 Base de producción usada en desarrollo | `npm run dev` (`node --watch`) aplica migraciones en cada reinicio contra la base del `.env`; incidente del 2026-10-13 | Cambios de esquema y de comportamiento no planificados en datos reales | Advertencia en [docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md); scripts de prueba se niegan con bases no `test` | Bases separadas por entorno; `NODE_ENV=production` en producción |
| RSK-004 Agotar conexiones | Plan gratuito con 5 conexiones; servidor usa 4 (`db.js`); scripts abren conexiones propias | Errores de conexión en scripts o en el servidor | Límite `Math.min(DB_CONNECTION_LIMIT, 4)` | Detener el servidor antes de scripts; plan con más conexiones en producción |
| RSK-005 Vulnerabilidades de nodemailer | `nodemailer` 6.10.1 (npm audit 2026-10-16, BUG-006) | Inyección SMTP, envío a dominios no previstos, DoS | Direcciones construidas en el servidor | Migrar a 10.x y repetir las pruebas de correo |
| RSK-006 Robo de sesión por XSS | Tokens en `localStorage` (BUG-011); sin CSP (BUG-012) | Uso de la sesión de la víctima | Escape de datos dinámicos en páginas nuevas; sesión revocable; restringidos exigen código por compra | Cookie `HttpOnly` + CSRF y CSP estricta |
| RSK-007 Sin TLS | Laboratorio sin HTTPS (`app.js` omite HSTS) | Credenciales y códigos interceptables en red | Ninguno en transporte | HTTPS obligatorio y HSTS antes de producción |
| RSK-008 Fuga por reporte mensual | `GET /api/reportes/mensual` sin middleware de autenticación (BUG-001) | Divulgación de métricas comerciales y comentarios de clientes | Ninguno | Exigir `requiereAutenticacion` + permiso |
| RSK-009 Error humano en aprobaciones | Las aprobaciones de registro y verificación son humanas (RN-003, RN-011) | Cuenta o compra restringida concedida indebidamente | Confirmación explícita, cuatro ojos, auditoría | Revisión periódica de aprobaciones; métricas de [docs/POLITICA_VERIFICACION_IDENTIDAD.md](../docs/POLITICA_VERIFICACION_IDENTIDAD.md) §8 |
| RSK-010 Validación jurídica pendiente | Textos legales, plazos y régimen de restringidos sin revisar ([docs/TRATAMIENTO_DATOS_PERSONALES.md](../docs/TRATAMIENTO_DATOS_PERSONALES.md)) | Incumplimiento de la Ley 1581 y normas sectoriales | Consentimientos registrados; minimización | Revisión jurídica formal; borrado programado (BUG-015) |
| RSK-011 n8n no desplegado | 12 workflows `active: false`; instancia no accesible | Sin avisos al administrador ni consulta de entidades | Jobs internos de respaldo; outbox con reintentos | Importar, configurar y probar en un entorno autorizado |
| RSK-012 Sin respaldos verificados | No hay scripts de respaldo en el repositorio **[OBS]** | Pérdida total de datos y documentos | Ninguno automatizado | Plan de respaldo de BD, `DOCUMENTOS_DIR` y claves ([06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md](../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md)) |
| RSK-013 Sin responsables | Ningún documento asigna roles ni aprobaciones | Decisiones sin dueño | — | Designar responsables (ver [04_INTERESADOS_Y_RESPONSABILIDADES](../00_GESTION_DEL_PROYECTO/04_INTERESADOS_Y_RESPONSABILIDADES.md)) |
| RSK-014 No escala horizontalmente | Captcha y limitadores en memoria (BUG-010) | Con varias instancias, retos inválidos y límites evadibles | Instancia única | Almacén compartido o captcha gestionado |
| RSK-015 Sin pasarela real | Solo proveedor mock (REQ-F-040) | No se puede cobrar | `sandbox`/`prod` fallan de forma segura | Seleccionar e integrar proveedor |
| RSK-016 Documentación inconsistente | BUG-008 | Errores de operación por instrucciones obsoletas | Esta estructura documental | Actualizar o marcar como histórica la documentación previa |
| RSK-017 Trabajo sin fusionar ni etiquetar | BUG-018 | Despliegue de una versión equivocada | — | Fusionar tras revisión y etiquetar versiones |

## 3. Riesgos técnicos adicionales observados en el análisis

| ID local | Observación | Evidencia | Relación |
|---|---|---|---|
| RT-01 | `API_BASE` fijo a `http://localhost:8081` impide desplegar el frontend en otro origen | `frontend/js/auth.js` | BUG-003 |
| RT-02 | Calificaciones sin autenticación ni límite pueden distorsionar los KPI del reporte | `backend/src/routes/atencion.js` | BUG-002, RSK-008 |
| RT-03 | El cambio de contraseña en "Mi cuenta" usa bcrypt con costo fijo 10, mientras que el registro usa `BCRYPT_COST` (12 por defecto en producción) | `backend/src/routes/miCuenta.js` (`bcrypt.hash(datos.passwordNueva, 10)`), `seguridad/contrasenas.js` | REQ-NF-002 |
| RT-04 | El estado `usuarios.estado_cuenta = 'suspendida'` no se asigna desde ninguna ruta; la suspensión opera sobre `clientes.estado_verificacion` | búsqueda en `backend/src` | Coherencia del modelo |
| RT-05 | Scripts CDN sin integridad de subrecursos | `frontend/*.html` | RSK-006 |
| RT-06 | Pedido pagado tras suspender una cuenta: un pago iniciado antes puede completarse por webhook | [docs/AUDITORIA_TECNICA.md](../docs/AUDITORIA_TECNICA.md) §5 | RN-020 |

RT-01 a RT-06 son observaciones de análisis; la decisión de registrarlas como riesgos o defectos formales queda **PENDIENTE DE VALIDACIÓN**.

## Referencias

- [00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md](../00_GESTION_DEL_PROYECTO/06_MATRIZ_DE_RIESGOS.md)
- [03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
- [docs/MODELO_AMENAZAS.md](../docs/MODELO_AMENAZAS.md)
