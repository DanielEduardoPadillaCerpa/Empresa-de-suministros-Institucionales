// Seguimiento administrativo de los reportes de clientes y de las solicitudes
// de contacto: estado, respuesta, quién la gestionó y cuándo.
//
// Solo agrega columnas e índices; no borra ni modifica filas. Los reportes y
// solicitudes que ya existían quedan como 'nuevo' / 'recibida' para que el
// administrador los vea en su panel.

const version = '004_seguimiento_reportes_contacto';
const descripcion = 'Estado y respuesta del administrador en reportes de clientes y solicitudes de contacto';

async function agregarColumna(db, tabla, columna, definicion) {
  try {
    await db.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME' && !/duplicate column/i.test(err.message)) throw err;
  }
}

async function crearIndice(db, tabla, indice, columnas) {
  const [existente] = await db.query(
    'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
    [tabla, indice]
  );
  if (!existente.length) await db.query(`CREATE INDEX ${indice} ON ${tabla} (${columnas})`);
}

async function up(db) {
  await agregarColumna(db, 'reportes_cliente', 'estado',
    "ENUM('nuevo','en_revision','atendido') NOT NULL DEFAULT 'nuevo'");
  await agregarColumna(db, 'reportes_cliente', 'respuesta_admin', 'VARCHAR(1000) NULL');
  await agregarColumna(db, 'reportes_cliente', 'atendido_por', 'INT NULL');
  await agregarColumna(db, 'reportes_cliente', 'atendido_en', 'DATETIME NULL');
  await crearIndice(db, 'reportes_cliente', 'idx_reportes_cliente_estado', 'estado, fecha, id');

  await agregarColumna(db, 'solicitudes_contacto', 'respuesta_admin', 'VARCHAR(1000) NULL');
  await agregarColumna(db, 'solicitudes_contacto', 'gestionada_por', 'INT NULL');
  await agregarColumna(db, 'solicitudes_contacto', 'actualizado_en', 'DATETIME NULL');
}

async function down(db) {
  for (const [tabla, columnas] of [
    ['reportes_cliente', ['estado', 'respuesta_admin', 'atendido_por', 'atendido_en']],
    ['solicitudes_contacto', ['respuesta_admin', 'gestionada_por', 'actualizado_en']]
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
