#!/usr/bin/env node
// Crea (o promueve) un superadministrador de forma segura.
//
// Uso:
//   node scripts/crear-superadmin.js --correo persona@dominio --confirmar-base <DB_NAME> [--promover] [--adicional]
//
// - La contraseña inicial se toma de SUPERADMIN_PASSWORD (mínimo 16 caracteres)
//   o se genera aleatoria. Una contraseña generada solo se muestra si la salida
//   es una terminal interactiva (nunca en registros de CI ni archivos).
// - La cuenta queda con cambio de contraseña obligatorio y MFA por correo.
// - Es idempotente: si el correo ya es superadministrador no cambia nada.
// - --confirmar-base debe coincidir con DB_NAME para evitar operar sobre la
//   base equivocada (por ejemplo, producción por accidente).
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

function argumento(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const bandera = nombre => process.argv.includes(`--${nombre}`);

function salir(mensaje, codigo = 1) {
  console.error(mensaje);
  process.exit(codigo);
}

async function main() {
  const correo = String(argumento('correo') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254) {
    salir('Uso: node scripts/crear-superadmin.js --correo persona@dominio --confirmar-base <DB_NAME> [--promover] [--adicional]');
  }
  if (!process.env.DB_NAME || argumento('confirmar-base') !== process.env.DB_NAME) {
    salir('Confirma la base de datos con --confirmar-base <DB_NAME> (debe coincidir con la configurada).');
  }

  let password = process.env.SUPERADMIN_PASSWORD || '';
  let generada = false;
  if (password) {
    if (password.length < 16 || password.length > 72) salir('SUPERADMIN_PASSWORD debe tener entre 16 y 72 caracteres.');
  } else {
    if (!process.stdout.isTTY) salir('Sin SUPERADMIN_PASSWORD y sin terminal interactiva: no se genera una contraseña que quedaría en un registro.');
    password = crypto.randomBytes(18).toString('base64url');
    generada = true;
  }

  const { pool, migrar } = require('../src/db');
  try {
    await migrar();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existentes] = await connection.query('SELECT id, rol, es_superadmin FROM usuarios WHERE correo = ? FOR UPDATE', [correo]);
      const [supers] = await connection.query("SELECT id FROM usuarios WHERE es_superadmin = TRUE AND rol = 'admin'");
      let usuarioId;
      let accion;
      if (existentes.length) {
        const u = existentes[0];
        if (u.rol !== 'admin') {
          await connection.rollback();
          salir('Ese correo pertenece a una cuenta de cliente: no se convierte en superadministrador.');
        }
        if (u.es_superadmin) {
          await connection.rollback();
          console.log('La cuenta ya es superadministrador. No se realizaron cambios.');
          return;
        }
        if (!bandera('promover')) {
          await connection.rollback();
          salir('Ese correo ya es administrador. Usa --promover para convertirlo en superadministrador (conserva su contraseña).');
        }
        await connection.query('UPDATE usuarios SET es_superadmin = TRUE, session_version = session_version + 1 WHERE id = ?', [u.id]);
        usuarioId = u.id;
        accion = 'promover_superadmin';
        generada = false;
      } else {
        if (supers.length && !bandera('adicional')) {
          await connection.rollback();
          salir('Ya existe un superadministrador. Usa --adicional si de verdad necesitas otro.');
        }
        const hash = await bcrypt.hash(password, 12);
        const [insercion] = await connection.query(
          "INSERT INTO usuarios (correo, password_hash, rol, es_superadmin, debe_cambiar_password) VALUES (?, ?, 'admin', TRUE, TRUE)",
          [correo, hash]
        );
        usuarioId = insercion.insertId;
        accion = 'crear_superadmin';
      }
      await connection.query(
        `INSERT INTO auditoria (usuario_id, correo, accion, entidad, entidad_id, detalle)
         VALUES (NULL, 'cli:crear-superadmin', ?, 'usuario', ?, ?)`,
        [accion, String(usuarioId), JSON.stringify({ correo, host: require('os').hostname() })]
      );
      await connection.commit();
      console.log(`${accion === 'crear_superadmin' ? 'Superadministrador creado' : 'Cuenta promovida a superadministrador'}: ${correo} (id ${usuarioId}).`);
      if (accion === 'crear_superadmin') {
        if (generada) {
          console.log('Contraseña inicial (se muestra una sola vez; deberá cambiarse en el primer acceso):');
          console.log(`  ${password}`);
        } else {
          console.log('Contraseña inicial: la indicada en SUPERADMIN_PASSWORD. Deberá cambiarse en el primer acceso.');
        }
      }
      console.log('El acceso exige MFA por correo. Los permisos sobre datos personales (documentos.ver, identificadores.ver) no se conceden automáticamente.');
    } catch (err) {
      await connection.rollback().catch(() => {});
      throw err;
    } finally {
      connection.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => salir(`No se pudo completar: ${err.code || err.message}`));
