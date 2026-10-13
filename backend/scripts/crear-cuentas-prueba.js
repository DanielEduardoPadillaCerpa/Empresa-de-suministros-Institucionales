#!/usr/bin/env node
// Crea cuentas SINTÉTICAS para probar paneles y flujos de cliente.
//
// Uso:
//   node scripts/crear-cuentas-prueba.js --confirmar-base <DB_NAME> [--salida ruta]
//
// Protecciones:
// - Se niega con NODE_ENV=production y con bases cuyo nombre no contenga
//   test, dev, local o prueba.
// - Correos en el dominio reservado .test (RFC 2606): nunca llegan a un buzón real
//   ni coinciden con dominios institucionales.
// - Las cuentas quedan marcadas es_cuenta_prueba: en producción no pueden comprar.
// - Las contraseñas se escriben en un archivo con permisos 0600 (por defecto
//   backend/storage/cuentas-prueba.txt, excluido del repositorio), no en consola.
// - Es idempotente: no toca cuentas que ya existen.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');

function argumento(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
function salir(mensaje) {
  console.error(mensaje);
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') salir('No se crean cuentas de prueba con NODE_ENV=production.');
if (!/test|dev|local|prueba/i.test(process.env.DB_NAME || '')) {
  salir('La base configurada no parece de pruebas (su nombre debe contener test, dev, local o prueba).');
}
if (argumento('confirmar-base') !== process.env.DB_NAME) salir('Confirma la base con --confirmar-base <DB_NAME>.');

const DOMINIO = 'suministros-prueba.test';
const CUENTAS = [
  { clave: 'general', correo: `general@${DOMINIO}`, tipo: 'corporativo', estado: 'borrador', nombre: 'Cuenta General de Prueba' },
  { clave: 'policia', correo: `policia@${DOMINIO}`, tipo: 'policia', estado: 'borrador', nombre: 'Agente Sintético Policía' },
  { clave: 'bomberos', correo: `bomberos@${DOMINIO}`, tipo: 'bomberos', estado: 'borrador', nombre: 'Bombero Sintético Prueba', especificos: { tipoCuerpo: 'voluntario' } },
  { clave: 'socorro', correo: `socorro@${DOMINIO}`, tipo: 'socorro', estado: 'borrador', nombre: 'Socorrista Sintético Prueba', especificos: { organismo: 'defensa_civil' } },
  { clave: 'pendiente', correo: `pendiente@${DOMINIO}`, tipo: 'policia', estado: 'pendiente', nombre: 'Solicitante Pendiente Prueba', organizacion: true },
  { clave: 'autorizada', correo: `autorizada@${DOMINIO}`, tipo: 'policia', estado: 'aprobado', nombre: 'Compradora Autorizada Prueba', organizacion: true, restringidos: true },
  { clave: 'suspendida', correo: `suspendida@${DOMINIO}`, tipo: 'corporativo', estado: 'suspendido', nombre: 'Cuenta Suspendida Prueba' },
  { clave: 'admin_limitado', correo: `revisor@${DOMINIO}`, admin: true, permisos: ['verificacion.ver'] }
];

// NIT sintético con dígito de verificación válido y prefijo 999 (no asignado a
// entidades reales conocidas); nunca se envía a n8n porque estas cuentas no
// pasan por el flujo de envío.
function nitSintetico(semilla) {
  const { calcularDvNit } = require('../src/registroInstitucional');
  const base = `999${String(semilla).padStart(6, '0')}`;
  return `${base}-${calcularDvNit(base)}`;
}

async function main() {
  const { pool, migrar } = require('../src/db');
  const { cifrar } = require('../src/crypto');
  const salida = path.resolve(argumento('salida') || path.join(__dirname, '..', 'storage', 'cuentas-prueba.txt'));
  const creadas = [];
  try {
    await migrar();
    for (const [i, cuenta] of CUENTAS.entries()) {
      const [existe] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [cuenta.correo]);
      if (existe.length) continue;
      const password = crypto.randomBytes(15).toString('base64url');
      const hash = await bcrypt.hash(password, 10);
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        if (cuenta.admin) {
          const [u] = await connection.query(
            "INSERT INTO usuarios (correo, password_hash, rol, es_cuenta_prueba, correo_verificado_en) VALUES (?, ?, 'admin', TRUE, NOW())",
            [cuenta.correo, hash]
          );
          for (const permiso of cuenta.permisos) {
            await connection.query('INSERT INTO staff_permisos (usuario_id, permiso) VALUES (?, ?)', [u.insertId, permiso]);
          }
        } else {
          const datosOrg = cuenta.organizacion
            ? { dependencia: 'Dependencia de prueba', cargo: 'Cargo de prueba', departamento: 'Cundinamarca', municipio: 'Bogotá D.C.' }
            : {};
          const [c] = await connection.query(
            `INSERT INTO clientes (nombre_unidad, nit, nombre_funcionario, correo, tipo_institucion, estado_verificacion,
               institucion_aprobada, autorizacion_general, verificado_hasta, datos_registro_cifrados, acepta_terminos_en, motivo_estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
              cuenta.organizacion ? `Entidad sintética ${cuenta.clave}` : null,
              cuenta.organizacion ? nitSintetico(i + 1) : null,
              cifrar(cuenta.nombre), cifrar(cuenta.correo), cuenta.tipo, cuenta.estado,
              cuenta.estado === 'aprobado' ? cuenta.tipo : null,
              Boolean(cuenta.restringidos),
              cuenta.estado === 'aprobado' ? new Date(Date.now() + 365 * 864e5) : null,
              cifrar(JSON.stringify({ ...datosOrg, ...(cuenta.especificos || {}) })),
              cuenta.estado === 'suspendido' ? 'Cuenta sintética suspendida para pruebas.' : null
            ]
          );
          await connection.query(
            "INSERT INTO usuarios (correo, password_hash, cliente_id, rol, es_cuenta_prueba, correo_verificado_en) VALUES (?, ?, ?, 'cliente', TRUE, NOW())",
            [cuenta.correo, hash, c.insertId]
          );
          if (cuenta.estado === 'pendiente' || cuenta.estado === 'aprobado') {
            const ref = crypto.randomBytes(16).toString('hex');
            const [s] = await connection.query(
              `INSERT INTO solicitudes_verificacion (ref, cliente_id, tipo_institucion, operacion, estado, expira_en, motivo)
               VALUES (?, ?, ?, 'compra', ?, DATE_ADD(NOW(), INTERVAL 30 DAY), 'Cuenta sintética de prueba')`,
              [ref, c.insertId, cuenta.tipo, cuenta.estado === 'aprobado' ? 'aprobada' : 'en_curso']
            );
            const resultado = cuenta.estado === 'aprobado' ? 'confirmado' : 'pendiente';
            for (const [componente, metodo] of [['vinculo_documental', 'revision_documental'], ['canal_independiente', 'confirmacion_institucional'], ['entidad', 'revision_manual_entidad']]) {
              await connection.query(
                `INSERT INTO verificacion_comprobaciones (solicitud_id, componente, metodo, resultado, fuente, observacion, actor_tipo)
                 VALUES (?, ?, ?, ?, 'cuenta_de_prueba', 'Dato sintético: no corresponde a una verificación real.', 'sistema')`,
                [s.insertId, componente, metodo, resultado]
              );
            }
          }
        }
        await connection.query(
          `INSERT INTO auditoria (usuario_id, correo, accion, entidad, entidad_id, detalle)
           VALUES (NULL, 'cli:crear-cuentas-prueba', 'crear_cuenta_prueba', 'usuario', NULL, ?)`,
          [JSON.stringify({ correo: cuenta.correo, perfil: cuenta.clave })]
        );
        await connection.commit();
        creadas.push(`${cuenta.clave.padEnd(15)} ${cuenta.correo.padEnd(40)} ${password}`);
      } catch (err) {
        await connection.rollback().catch(() => {});
        throw err;
      } finally {
        connection.release();
      }
    }
    if (creadas.length) {
      await fs.promises.mkdir(path.dirname(salida), { recursive: true });
      await fs.promises.appendFile(salida, `# ${new Date().toISOString()} — base ${process.env.DB_NAME}\n${creadas.join('\n')}\n`, { mode: 0o600 });
      console.log(`Se crearon ${creadas.length} cuentas de prueba. Credenciales en: ${salida}`);
    } else {
      console.log('Las cuentas de prueba ya existían. No se realizaron cambios.');
    }
    console.log('El inicio de sesión exige MFA: con Mailpit local los códigos llegan a http://localhost:8025.');
  } finally {
    await pool.end();
  }
}

main().catch(err => salir(`No se pudo completar: ${err.code || err.message}`));
