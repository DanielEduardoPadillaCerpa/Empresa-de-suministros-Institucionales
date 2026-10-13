// Verificación en el momento de la compra: solicitudes con referencia opaca,
// doble comprobación, identificadores personales cifrados con índice HMAC,
// autorizaciones de compra de un solo uso, protección anti-repetición para
// respuestas de n8n, superadministrador y cuentas de prueba.
//
// Solo agrega tablas, columnas y permisos; no borra ni modifica filas existentes
// salvo para conceder a los administradores actuales los permisos que hoy
// ejercen a través de requiereAdmin (para no quitarles funciones).

const version = '002_verificacion_en_compra';
const descripcion = 'Solicitudes y comprobaciones de verificación, identificadores cifrados, autorizaciones de compra, superadministrador';

async function agregarColumna(db, tabla, columna, definicion) {
  try {
    await db.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    return true;
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || /duplicate column/i.test(err.message)) return false;
    throw err;
  }
}

// Permisos que antes se ejercían con solo tener rol admin.
const PERMISOS_HEREDADOS = ['catalogo.gestionar', 'pedidos.gestionar', 'clientes.gestionar', 'auditoria.ver', 'verificacion.confirmar_institucion'];

async function up(db) {
  await agregarColumna(db, 'usuarios', 'es_superadmin', 'BOOLEAN NOT NULL DEFAULT FALSE');
  await agregarColumna(db, 'usuarios', 'debe_cambiar_password', 'BOOLEAN NOT NULL DEFAULT FALSE');
  await agregarColumna(db, 'usuarios', 'es_cuenta_prueba', 'BOOLEAN NOT NULL DEFAULT FALSE');
  await agregarColumna(db, 'clientes', 'verificado_hasta', 'DATETIME NULL');
  await agregarColumna(db, 'clientes', 'acepta_terminos_en', 'DATETIME NULL');

  // Solicitud de verificación: una por cada envío del titular. `ref` es la
  // referencia opaca que viaja a n8n (nunca el id del cliente ni datos personales).
  await db.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_verificacion (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ref CHAR(32) NOT NULL UNIQUE,
      cliente_id INT NOT NULL,
      usuario_id INT NULL,
      tipo_institucion VARCHAR(32) NOT NULL,
      operacion ENUM('compra','catalogo_restringido','renovacion') NOT NULL DEFAULT 'compra',
      carrito_hash CHAR(64) NULL,
      estado ENUM('en_curso','requiere_revision','fuente_no_disponible','aprobada','rechazada','expirada','cancelada') NOT NULL DEFAULT 'en_curso',
      idempotency_key VARCHAR(128) NULL,
      motivo VARCHAR(500) NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      expira_en DATETIME NOT NULL,
      decidida_en DATETIME NULL,
      decidida_por INT NULL,
      UNIQUE KEY uq_solicitud_idempotencia (cliente_id, idempotency_key),
      INDEX idx_solicitudes_cliente (cliente_id, estado),
      INDEX idx_solicitudes_estado (estado, expira_en),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
      FOREIGN KEY (decidida_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Una fila por componente de la verificación. El resultado distingue
  // ausencia de datos, fuente caída, respuesta inválida y ambigüedad de una
  // no coincidencia confirmada.
  await db.query(`
    CREATE TABLE IF NOT EXISTS verificacion_comprobaciones (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      solicitud_id BIGINT UNSIGNED NOT NULL,
      componente ENUM('vinculo_documental','canal_independiente','entidad') NOT NULL,
      metodo VARCHAR(40) NOT NULL,
      resultado ENUM('pendiente','confirmado','no_coincide','datos_insuficientes','fuente_no_disponible','respuesta_invalida','ambiguo') NOT NULL DEFAULT 'pendiente',
      fuente VARCHAR(80) NULL,
      referencia VARCHAR(120) NULL,
      observacion VARCHAR(500) NULL,
      actor_tipo ENUM('sistema','staff','n8n') NOT NULL DEFAULT 'sistema',
      actor_usuario_id INT NULL,
      intentos SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      consultado_en DATETIME NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_comprobacion (solicitud_id, componente),
      FOREIGN KEY (solicitud_id) REFERENCES solicitudes_verificacion(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Identificador personal (cédula u otro) solo cuando se inicia una
  // verificación. Cifrado AES-256-GCM (anillo v2) + índice HMAC con clave
  // independiente para detectar el mismo documento en otras cuentas.
  await db.query(`
    CREATE TABLE IF NOT EXISTS identificadores_personales (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL UNIQUE,
      usuario_id INT NULL,
      tipo_documento VARCHAR(8) NOT NULL,
      numero_cifrado TEXT NOT NULL,
      indice_hmac CHAR(64) NOT NULL,
      ultimos_digitos CHAR(3) NOT NULL,
      autorizado_en DATETIME NOT NULL,
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_identificadores_indice (indice_hmac),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Autorización de una compra concreta con productos restringidos: ligada al
  // usuario, al cliente, a la solicitud aprobada y al contenido exacto del
  // carrito; requiere un código enviado al correo y se consume una sola vez.
  await db.query(`
    CREATE TABLE IF NOT EXISTS autorizaciones_compra (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ref CHAR(64) NOT NULL UNIQUE,
      usuario_id INT NOT NULL,
      cliente_id INT NOT NULL,
      solicitud_id BIGINT UNSIGNED NOT NULL,
      carrito_hash CHAR(64) NOT NULL,
      codigo_hash CHAR(64) NOT NULL,
      intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
      estado ENUM('pendiente_codigo','vigente','consumida','expirada','revocada','bloqueada') NOT NULL DEFAULT 'pendiente_codigo',
      creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expira_en DATETIME NOT NULL,
      confirmada_en DATETIME NULL,
      consumida_en DATETIME NULL,
      pedido_id INT NULL,
      INDEX idx_autorizaciones_usuario (usuario_id, estado, expira_en),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (solicitud_id) REFERENCES solicitudes_verificacion(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Nonces de respuestas de n8n ya aceptadas (anti-repetición).
  await db.query(`
    CREATE TABLE IF NOT EXISTS automation_nonces (
      nonce CHAR(64) PRIMARY KEY,
      recibido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_nonces_fecha (recibido_en)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [admins] = await db.query("SELECT id FROM usuarios WHERE rol = 'admin'");
  for (const admin of admins) {
    for (const permiso of PERMISOS_HEREDADOS) {
      await db.query('INSERT IGNORE INTO staff_permisos (usuario_id, permiso) VALUES (?, ?)', [admin.id, permiso]);
    }
  }

  // Las cuentas ya aprobadas conservan su aprobación con la vigencia por
  // defecto contada desde la decisión (o desde hoy si no hay fecha).
  const dias = Number(process.env.VERIFICACION_VIGENCIA_DIAS || 365);
  await db.query(
    `UPDATE clientes SET verificado_hasta = DATE_ADD(COALESCE(decidido_en, NOW()), INTERVAL ? DAY)
     WHERE estado_verificacion = 'aprobado' AND verificado_hasta IS NULL`,
    [Number.isSafeInteger(dias) && dias > 0 ? dias : 365]
  );
}

async function down(db) {
  for (const tabla of ['automation_nonces', 'autorizaciones_compra', 'identificadores_personales', 'verificacion_comprobaciones', 'solicitudes_verificacion']) {
    await db.query(`DROP TABLE IF EXISTS ${tabla}`);
  }
  for (const [tabla, columnas] of [
    ['usuarios', ['es_superadmin', 'debe_cambiar_password', 'es_cuenta_prueba']],
    ['clientes', ['verificado_hasta', 'acepta_terminos_en']]
  ]) {
    for (const columna of columnas) {
      try {
        await db.query(`ALTER TABLE ${tabla} DROP COLUMN ${columna}`);
      } catch (err) {
        if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw err;
      }
    }
  }
  await db.query('DELETE FROM staff_permisos WHERE permiso IN (?)', [PERMISOS_HEREDADOS]);
}

module.exports = { version, descripcion, up, down, PERMISOS_HEREDADOS };
