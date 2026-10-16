-- =====================================================================
-- Consultas de verificación de SOLO LECTURA — Suministros Institucionales
-- DOC-04-BD-02 · Versión 1.0 · 2026-10-16 · BORRADOR — PENDIENTE DE VALIDACIÓN
-- Responsable: PENDIENTE DE ASIGNACIÓN
--
-- Propósito: comprobar el estado de una base (migraciones, colas, conteos)
-- sin leer datos personales ni columnas cifradas.
-- No ejecutadas durante la auditoría. Úselas primero en una base de pruebas.
-- Ninguna sentencia modifica datos (solo SELECT).
-- =====================================================================

-- 1. Migraciones versionadas aplicadas (esperado: 001, 002, 003)
SELECT version, descripcion, aplicada_en
FROM schema_migraciones
ORDER BY version;

-- 2. Tablas presentes en la base actual (esperado: 34 del sistema)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_name;

-- 3. Cuentas por rol y estado (sin correos)
SELECT rol, estado_cuenta, COUNT(*) AS total
FROM usuarios
GROUP BY rol, estado_cuenta;

-- 4. Superadministradores y cuentas con contraseña inicial pendiente
SELECT SUM(es_superadmin) AS superadmins,
       SUM(debe_cambiar_password) AS cambio_pendiente,
       SUM(es_cuenta_prueba) AS cuentas_prueba
FROM usuarios;

-- 5. Solicitudes de registro por estado y resultado de verificación
SELECT estado, resultado_verificacion, COUNT(*) AS total
FROM solicitudes_registro
GROUP BY estado, resultado_verificacion;

-- 6. Padrón cifrado: filas activas/inactivas y última sincronización
SELECT estado, COUNT(*) AS total, MAX(sincronizado_en) AS ultima_sincronizacion
FROM padron_institucional
GROUP BY estado;

-- 7. Clientes por estado de verificación institucional
SELECT estado_verificacion, COUNT(*) AS total
FROM clientes
GROUP BY estado_verificacion;

-- 8. Pedidos y pagos por estado
SELECT estado, COUNT(*) AS total FROM pedidos GROUP BY estado;
SELECT estado, COUNT(*) AS total, SUM(monto_centavos) AS centavos FROM pagos GROUP BY estado;

-- 9. Reservas vencidas aún sin expirar (debería ser 0 si el job funciona)
SELECT COUNT(*) AS vencidas_sin_procesar
FROM pagos
WHERE estado IN ('creado', 'pendiente') AND expira_en <= NOW();

-- 10. Colas de salida (correo y n8n) por estado y último código de error
SELECT estado, COUNT(*) AS total, MAX(ultimo_error_code) AS ejemplo_error
FROM correo_outbox GROUP BY estado;
SELECT workflow, estado, COUNT(*) AS total, MAX(ultimo_error_code) AS ejemplo_error
FROM automation_outbox GROUP BY workflow, estado;

-- 11. Productos por institución, estado y revisión legal
SELECT institucion_id, estado, restringido, revision_legal, COUNT(*) AS total
FROM productos
GROUP BY institucion_id, estado, restringido, revision_legal;

-- 12. Permisos de staff asignados (conteo por permiso)
SELECT permiso, COUNT(*) AS usuarios
FROM staff_permisos
GROUP BY permiso
ORDER BY permiso;

-- 13. Actividad de auditoría reciente (sin detalle)
SELECT accion, entidad, COUNT(*) AS total, MAX(fecha) AS ultima
FROM auditoria
WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY accion, entidad;

-- 14. Retos MFA por estado (últimas 24 h)
SELECT proposito, estado, COUNT(*) AS total
FROM retos_mfa
WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY proposito, estado;
