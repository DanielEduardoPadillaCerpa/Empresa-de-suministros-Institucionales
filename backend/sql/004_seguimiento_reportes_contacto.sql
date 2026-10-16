-- Seguimiento de reportes de clientes y solicitudes de contacto
-- (equivale a src/migraciones/004_seguimiento_reportes_contacto.js).
-- Idempotente: puede ejecutarse varias veces. No borra ni modifica filas.
-- El servidor lo aplica solo al arrancar; este archivo es para revisión o
-- para aplicarlo a mano (mysql < 004_seguimiento_reportes_contacto.sql).

DROP PROCEDURE IF EXISTS agregar_columna_004;
DELIMITER //
CREATE PROCEDURE agregar_columna_004(IN tabla VARCHAR(64), IN columna VARCHAR(64), IN definicion VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tabla AND COLUMN_NAME = columna) THEN
    SET @sql := CONCAT('ALTER TABLE ', tabla, ' ADD COLUMN ', columna, ' ', definicion);
    PREPARE paso FROM @sql;
    EXECUTE paso;
    DEALLOCATE PREPARE paso;
  END IF;
END//
DELIMITER ;

CALL agregar_columna_004('reportes_cliente', 'estado', "ENUM('nuevo','en_revision','atendido') NOT NULL DEFAULT 'nuevo'");
CALL agregar_columna_004('reportes_cliente', 'respuesta_admin', 'VARCHAR(1000) NULL');
CALL agregar_columna_004('reportes_cliente', 'atendido_por', 'INT NULL');
CALL agregar_columna_004('reportes_cliente', 'atendido_en', 'DATETIME NULL');
CALL agregar_columna_004('solicitudes_contacto', 'respuesta_admin', 'VARCHAR(1000) NULL');
CALL agregar_columna_004('solicitudes_contacto', 'gestionada_por', 'INT NULL');
CALL agregar_columna_004('solicitudes_contacto', 'actualizado_en', 'DATETIME NULL');
DROP PROCEDURE agregar_columna_004;

SET @existe := (SELECT COUNT(*) FROM information_schema.statistics
                WHERE table_schema = DATABASE() AND table_name = 'reportes_cliente' AND index_name = 'idx_reportes_cliente_estado');
SET @sql := IF(@existe = 0, 'CREATE INDEX idx_reportes_cliente_estado ON reportes_cliente (estado, fecha, id)', 'SELECT 1');
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

INSERT IGNORE INTO schema_migraciones (version, descripcion)
VALUES ('004_seguimiento_reportes_contacto', 'Estado y respuesta del administrador en reportes de clientes y solicitudes de contacto');
