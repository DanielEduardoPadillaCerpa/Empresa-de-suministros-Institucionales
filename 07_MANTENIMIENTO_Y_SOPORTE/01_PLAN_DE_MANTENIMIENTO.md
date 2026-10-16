# Plan de mantenimiento

| Campo | Valor |
|---|---|
| ID documental | DOC-07-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir cómo se mantiene la plataforma de suministros institucionales (backend Node.js/Express, frontend HTML/Bootstrap, MySQL en Clever Cloud y workflows n8n) después de su entrega: qué tipos de mantenimiento existen, qué tareas periódicas se proponen y quién debería ejecutarlas.

## Alcance

Aplica al código de `backend/`, `frontend/`, `n8n/` y a la base de datos MySQL descrita en [../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md](../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md). No incluye la infraestructura del proveedor (Clever Cloud) ni el servidor SMTP externo.

## 1. Situación actual

- **[OBS]** No existe en el repositorio ningún plan de mantenimiento, acuerdo de nivel de servicio (SLA), contrato de soporte, calendario de tareas ni responsable designado.
- **[OBS]** El proyecto se declara entorno de **laboratorio** con restricción de costo cero (`docs/REGISTRO_VERIFICADO.md`, REQ-NF-018).
- **[OBS]** Existen mecanismos automáticos internos que reducen el mantenimiento manual:
  - expiración de pedidos y liberación de reservas cada 60 s (`backend/src/paymentJobs.js`, REQ-F-022);
  - mantenimiento de verificaciones cada 5 min (`backend/src/verificacionJobs.js`);
  - sincronización del padrón cada `PADRON_SYNC_MINUTOS` (10 por defecto) (`backend/src/seguridad/padron.js`, REQ-F-003);
  - reintentos con backoff de `correo_outbox` (5 intentos) y `automation_outbox` (8 intentos) (`backend/src/emailOutbox.js`, `backend/src/automationOutbox.js`);
  - migraciones automáticas al arrancar (`backend/src/db.js`, `backend/src/migraciones/`, REQ-F-037).
- **[OBS]** No hay tareas automáticas de depuración de `retos_mfa`, `refresh_tokens`, `correo_outbox`, `automation_outbox` ni `auditoria`. Los nonces de n8n sí se depuran a las 24 h dentro del mantenimiento de verificaciones (`docs/FLUJO_N8N_VERIFICACION.md` §2b).

Todo lo que sigue es **[REC] propuesta**, pendiente de aprobación por un responsable.

## 2. Tipos de mantenimiento

| Tipo | Definición | Ejemplos concretos en este proyecto |
|---|---|---|
| Correctivo | Corregir defectos detectados | BUG-001 (reportes sin autenticación), BUG-002, BUG-003 (`API_BASE` fijo) — ver [07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md](07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md) |
| Preventivo | Evitar fallas futuras | Rotación de claves, `npm audit`, depuración de tablas, verificación de respaldos |
| Adaptativo | Ajustar a cambios del entorno | Migrar a HTTPS (REQ-NF-016), pasarela de pago real (REQ-F-040), fuente oficial del padrón, actualización de Node.js o de la imagen n8n |
| Perfectivo | Mejorar sin cambiar el propósito | Pantallas de Mi cuenta (BUG-004, BUG-005), traducciones (BUG-016), captcha gestionado (BUG-010) |

## 3. Tareas periódicas propuestas [REC]

| ID | Tarea | Frecuencia propuesta | Procedimiento | Evidencia de cierre |
|---|---|---|---|---|
| MNT-01 | Revisar vulnerabilidades de dependencias | Mensual y antes de cada liberación | `npm audit --omit=dev` en `backend/` ([05_GESTION_DE_DEPENDENCIAS.md](05_GESTION_DE_DEPENDENCIAS.md)) | Salida registrada sin datos sensibles |
| MNT-02 | Ejecutar suites automatizadas | Antes de cada cambio y mensualmente | `npm test` en `backend/`; integración solo con MySQL de pruebas local | Resultado en `05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md` |
| MNT-03 | Rotar claves y secretos | Anual o ante sospecha de compromiso | `ENC_KEY` con `ENC_KEY_VERSION` + `ENC_KEY_V<n>`; `CRYPTO_KEYS`/`CRYPTO_KEY_ACTIVA`; `JWT_SECRET` (cierra sesiones); secretos n8n en ambos lados ([../06_IMPLEMENTACION/08_CONFIGURACION_DE_SEGURIDAD.md](../06_IMPLEMENTACION/08_CONFIGURACION_DE_SEGURIDAD.md)) | Acta de rotación sin valores |
| MNT-04 | Rotar la contraseña de la base del padrón | **Inmediata** (pendiente desde 2026-10-15) y luego anual | En el proveedor de la base; actualizar `PADRON_DB_URI` | Confirmación del responsable |
| MNT-05 | Depurar retos MFA y refresh tokens vencidos | Semanal | SQL propuesto en §4 (requiere respaldo previo) | Conteo antes/después |
| MNT-06 | Depurar colas enviadas | Mensual | `correo_outbox`/`automation_outbox` en estado `enviado` con más de N días (N PENDIENTE DE DEFINIR) | Conteo antes/después |
| MNT-07 | Revisar colas fallidas | Semanal | Consultas de [03_GUIA_DE_DIAGNOSTICO.md](03_GUIA_DE_DIAGNOSTICO.md) §5 | Fallidos explicados o reencolados |
| MNT-08 | Revisar auditoría administrativa | Mensual | `GET /api/auditoria` (permiso `auditoria.ver`) o consulta de solo lectura; buscar `ver_documento`, `ver_identificador`, `aprobar_registro`, `permisos_staff` | Informe de revisión |
| MNT-09 | Verificar la sincronización del padrón | Semanal | Buscar en el log `[padron] Sincronizado:` / `[padron] No se pudo sincronizar:`; `SELECT estado, COUNT(*) FROM padron_institucional GROUP BY estado` | Fecha de última sincronización |
| MNT-10 | Revisar solicitudes pendientes antiguas | Semanal | Panel `admin-solicitudes.html`; `admin-verificaciones.html` | Pendientes > 7 días justificados |
| MNT-11 | Probar la restauración de un respaldo | Trimestral | [06_RESPALDO_Y_RECUPERACION.md](06_RESPALDO_Y_RECUPERACION.md) | Acta de prueba |
| MNT-12 | Revisar permisos del personal | Trimestral | `admin-verificaciones.html` → permisos; retirar los no necesarios | Lista firmada (PENDIENTE) |
| MNT-13 | Revisar plazos de conservación de datos | Cuando exista definición jurídica | BUG-015, REQ-NF-017 | Política aprobada |

## 4. Consultas de depuración propuestas [REC]

> No se ejecutaron en esta auditoría. Ejecutar solo con respaldo previo, sobre la base correcta y con el servidor detenido o en ventana de mantenimiento.

```sql
-- MNT-05: retos MFA cerrados o vencidos hace más de 7 días
DELETE FROM retos_mfa
WHERE estado <> 'pendiente' OR expira_en < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- MNT-05: refresh tokens revocados o vencidos hace más de 30 días
DELETE FROM refresh_tokens
WHERE (revocado = TRUE OR fecha_expiracion < NOW())
  AND fecha_creacion < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

Las columnas y estados citados existen en `backend/src/db.js` [OBS]. Los plazos (7 y 30 días) son propuestos [REC].

## 5. Roles propuestos

| Rol | Responsabilidad | Persona |
|---|---|---|
| Responsable técnico | Aprobar cambios, rotaciones y liberaciones | PENDIENTE DE ASIGNACIÓN |
| Operador | Ejecutar tareas MNT-01 a MNT-11 | PENDIENTE DE ASIGNACIÓN |
| Superadministrador funcional | Permisos y diagnóstico (MNT-12) | PENDIENTE DE ASIGNACIÓN |
| Responsable de datos personales | MNT-13 e incidentes de datos | PENDIENTE DE ASIGNACIÓN |

## 6. Indicadores propuestos [REC]

- Número de vulnerabilidades altas abiertas (hoy: 1, `nodemailer`, BUG-006).
- Correos y eventos `fallido` en colas.
- Antigüedad máxima de solicitudes pendientes.
- Fecha de la última prueba de restauración (hoy: ninguna registrada).

## Referencias

- [02_PROCEDIMIENTO_DE_GESTION_DE_INCIDENTES.md](02_PROCEDIMIENTO_DE_GESTION_DE_INCIDENTES.md)
- [04_PROCEDIMIENTO_DE_ACTUALIZACION.md](04_PROCEDIMIENTO_DE_ACTUALIZACION.md)
- [07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md](07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md)
- [../06_IMPLEMENTACION/12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md](../06_IMPLEMENTACION/12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md)
- [../docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
