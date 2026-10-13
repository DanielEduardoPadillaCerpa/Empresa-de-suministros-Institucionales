// Estado y reversión manual de migraciones versionadas.
//   node scripts/migraciones.js estado
//   node scripts/migraciones.js revertir <version> --confirmo-perdida-de-datos
// Usa la base configurada en backend/.env. Revertir elimina tablas y columnas
// agregadas por la migración (decisiones de verificación, documentos, permisos).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/db');
const { estadoMigraciones, revertirMigracion } = require('../src/migraciones');

(async () => {
  const [accion, version, confirmacion] = process.argv.slice(2);
  console.log(`[migraciones] Base: ${process.env.DB_NAME} en ${process.env.DB_HOST}`);
  if (accion === 'estado') {
    console.table(await estadoMigraciones(pool));
  } else if (accion === 'revertir' && version && confirmacion === '--confirmo-perdida-de-datos') {
    await revertirMigracion(pool, version);
    console.log(`[migraciones] ${version} revertida. Vuelve a desplegar la versión anterior del código antes de arrancar el servidor.`);
  } else {
    console.log('Uso: node scripts/migraciones.js estado | revertir <version> --confirmo-perdida-de-datos');
    process.exitCode = 1;
  }
  await pool.end();
})().catch(async err => {
  console.error('[migraciones] Error:', err.code || err.message);
  await pool.end();
  process.exit(1);
});
