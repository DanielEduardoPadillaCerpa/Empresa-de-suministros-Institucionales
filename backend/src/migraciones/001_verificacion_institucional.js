// Verificación institucional de compradores, elegibilidad de productos,
// documentos privados y permisos administrativos diferenciados.
//
// Solo agrega tablas, columnas e índices: no borra filas ni columnas. Cada paso
// es idempotente porque el DDL de MySQL no es transaccional; si la migración se
// interrumpe, volver a arrancar el servidor la completa.

const version = '001_verificacion_institucional';
const descripcion = 'Estados de verificación, documentos, elegibilidad M:N, revisión legal y permisos de staff';

async function agregarColumna(db, tabla, columna, definicion) {
  try {
    await db.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    return true;
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || /duplicate column/i.test(err.message)) return false;
    throw err;
  }
}

async function crearIndice(db, tabla, indice, columnas) {
  const [existente] = await db.query(
    'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
    [tabla, indice]
  );
  if (!existente.length) await db.query(`CREATE INDEX ${indice} ON ${tabla} (${columnas})`);
}

async function up(db, { permisosStaff }) {
  // --- clientes: estado de verificación e institución aprobada -----------------
  const columnasClientes = [
    ['tipo_institucion', 'VARCHAR(32) NULL'],
    ['estado_verificacion', "ENUM('borrador','pendiente','requiere_informacion','aprobado','rechazado','suspendido') NOT NULL DEFAULT 'pendiente'"],
    ['institucion_aprobada', 'VARCHAR(32) NULL'],
    ['motivo_estado', 'VARCHAR(500) NULL'],
    ['datos_registro_cifrados', 'TEXT NULL'],
    ['dominio_verificado', 'BOOLEAN NOT NULL DEFAULT FALSE'],
    ['tipo_solicitado', 'VARCHAR(32) NULL'],
    ['datos_cambio_cifrados', 'TEXT NULL'],
    ['reintentos_envio', 'TINYINT UNSIGNED NOT NULL DEFAULT 0'],
    ['enviado_revision_en', 'DATETIME NULL'],
    ['decidido_en', 'DATETIME NULL'],
    ['decidido_por', 'INT NULL']
  ];
  let estadoNuevo = false;
  for (const [columna, definicion] of columnasClientes) {
    const agregada = await agregarColumna(db, 'clientes', columna, definicion);
    if (columna === 'estado_verificacion') estadoNuevo = agregada;
  }
  await crearIndice(db, 'clientes', 'idx_clientes_verificacion', 'estado_verificacion, tipo_institucion, fecha_registro');
  await crearIndice(db, 'clientes', 'idx_clientes_nit', 'nit');

  // --- usuarios: correo verificado (lo marca el primer MFA exitoso) ---------------
  const correoNuevo = await agregarColumna(db, 'usuarios', 'correo_verificado_en', 'DATETIME NULL');
  if (correoNuevo) {
    // Quien ya completó un MFA por correo demostró controlar el buzón.
    await db.query(`
      UPDATE usuarios u
      JOIN (SELECT usuario_id, MIN(mfa_verificado_en) AS primera
            FROM refresh_tokens WHERE mfa_verificado_en IS NOT NULL GROUP BY usuario_id) rt
        ON rt.usuario_id = u.id
      SET u.correo_verificado_en = rt.primera
      WHERE u.correo_verificado_en IS NULL
    `);
  }

  // --- productos: revisión legal preventiva -----------------------------------
  const revisionNueva = await agregarColumna(
    db, 'productos', 'revision_legal',
    "ENUM('no_requerida','pendiente','aprobada','bloqueada') NOT NULL DEFAULT 'no_requerida'"
  );
  if (revisionNueva) {
    // Política preventiva: lo ya marcado como restringido queda sin venta hasta
    // que cumplimiento confirme su régimen legal.
    await db.query("UPDATE productos SET revision_legal = 'pendiente' WHERE restringido = TRUE");
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS productos_elegibilidad (
      producto_id INT NOT NULL,
      institucion_id VARCHAR(32) NOT NULL,
      creado_por INT NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (producto_id, institucion_id),
      INDEX idx_elegibilidad_institucion (institucion_id, producto_id),
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS verificacion_historial (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      estado_anterior VARCHAR(32) NULL,
      estado_nuevo VARCHAR(32) NOT NULL,
      evento VARCHAR(40) NOT NULL,
      actor_usuario_id INT NULL,
      actor_tipo ENUM('cliente','staff','sistema') NOT NULL,
      motivo VARCHAR(500) NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_historial_cliente (cliente_id, creado_en),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS documentos_verificacion (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      subido_por INT NULL,
      tipo_documento VARCHAR(64) NOT NULL,
      nombre_original_cifrado TEXT NOT NULL,
      mime VARCHAR(64) NOT NULL,
      tamano_bytes INT UNSIGNED NOT NULL,
      sha256 CHAR(64) NOT NULL,
      archivo VARCHAR(80) NOT NULL UNIQUE,
      estado ENUM('vigente','eliminado') NOT NULL DEFAULT 'vigente',
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      eliminado_en DATETIME NULL,
      INDEX idx_documentos_cliente (cliente_id, estado),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_permisos (
      usuario_id INT NOT NULL,
      permiso VARCHAR(64) NOT NULL,
      otorgado_por INT NULL,
      otorgado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (usuario_id, permiso),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (otorgado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // auditoria.accion era ENUM('crear','editar','eliminar'); pasar a VARCHAR
  // conserva los valores existentes y admite aprobar, suspender, ver_documento...
  await db.query('ALTER TABLE auditoria MODIFY accion VARCHAR(40) NOT NULL');
  await crearIndice(db, 'auditoria', 'idx_auditoria_entidad', 'entidad, entidad_id, fecha');

  // Los administradores existentes conservan todas sus capacidades; las cuentas
  // de staff creadas en adelante empiezan sin permisos de verificación.
  const [admins] = await db.query("SELECT id FROM usuarios WHERE rol = 'admin'");
  for (const admin of admins) {
    for (const permiso of permisosStaff) {
      await db.query('INSERT IGNORE INTO staff_permisos (usuario_id, permiso) VALUES (?, ?)', [admin.id, permiso]);
    }
  }

  // Cuentas anteriores a esta migración: sin clasificación institucional no
  // reciben acceso a catálogos. Quedan en borrador para que el titular elija su
  // tipo de institución y aporte la evidencia, o el equipo la gestione.
  if (estadoNuevo) {
    const motivo = 'Cuenta creada antes de la verificación institucional: selecciona tu tipo de institución y adjunta la evidencia para solicitar la aprobación.';
    const [legado] = await db.query('SELECT id FROM clientes WHERE tipo_institucion IS NULL');
    if (legado.length) {
      await db.query(
        "UPDATE clientes SET estado_verificacion = 'borrador', motivo_estado = ? WHERE tipo_institucion IS NULL",
        [motivo]
      );
      for (const { id } of legado) {
        await db.query(
          `INSERT INTO verificacion_historial (cliente_id, estado_anterior, estado_nuevo, evento, actor_tipo, motivo)
           VALUES (?, NULL, 'borrador', 'migracion_cuenta_heredada', 'sistema', ?)`,
          [id, motivo]
        );
      }
    }
  }
}

// Reversión manual (no se ejecuta automáticamente): elimina solo lo que esta
// migración agregó. Las decisiones de verificación y documentos se perderían,
// por eso requiere confirmación explícita desde scripts/migraciones.js.
async function down(db) {
  for (const tabla of ['staff_permisos', 'documentos_verificacion', 'verificacion_historial', 'productos_elegibilidad']) {
    await db.query(`DROP TABLE IF EXISTS ${tabla}`);
  }
  for (const [tabla, columnas] of [
    ['clientes', ['tipo_institucion', 'estado_verificacion', 'institucion_aprobada', 'motivo_estado', 'datos_registro_cifrados',
      'dominio_verificado', 'tipo_solicitado', 'datos_cambio_cifrados', 'reintentos_envio', 'enviado_revision_en', 'decidido_en', 'decidido_por']],
    ['usuarios', ['correo_verificado_en']],
    ['productos', ['revision_legal']]
  ]) {
    for (const columna of columnas) {
      try {
        await db.query(`ALTER TABLE ${tabla} DROP COLUMN ${columna}`);
      } catch (err) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw err;
      }
    }
  }
}

module.exports = { version, descripcion, up, down };
