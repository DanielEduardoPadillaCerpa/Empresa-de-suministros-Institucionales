'use strict';

// Reportes de clientes, solicitudes de contacto y auditoría en el panel
// administrativo; el reporte mensual protegido y "Mi cuenta" del titular.
// Base de datos y correo simulados: no hay MySQL ni envíos reales.

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.JWT_SECRET = 'reportes-test-secret-suficientemente-largo';
process.env.MFA_TOKEN_PEPPER = 'reportes-mfa-pepper-suficientemente-largo';
process.env.CRYPTO_KEY = 'reportes-crypto-key-long-enough!';
process.env.NODE_ENV = 'test';
process.env.ADMIN_NOTIFICATION_EMAIL = 'avisos@empresa.test';

jest.mock('../src/db', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() }
}));
jest.mock('../src/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
  registrarAuditoriaTransaccional: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../src/seguridad/correo', () => ({
  enviarCorreo: jest.fn().mockResolvedValue({ via: 'smtp' }),
  enviarCorreoEnSegundoPlano: jest.fn(),
  validarConfiguracionCorreo: jest.fn(),
  escaparHtml: t => String(t)
}));

const { pool } = require('../src/db');
const { registrarAuditoria } = require('../src/auditoria');
const { enviarCorreoEnSegundoPlano } = require('../src/seguridad/correo');
const { cifrar } = require('../src/crypto');

function crearApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/reportes', require('../src/routes/reportes'));
  app.use('/api/mis-reportes', require('../src/routes/misreportes'));
  app.use('/api/admin/contacto', require('../src/routes/adminContacto'));
  app.use('/api/atencion', require('../src/routes/atencion'));
  app.use('/api/auditoria', require('../src/routes/auditoria'));
  app.use('/api/mi-cuenta', require('../src/routes/miCuenta'));
  return app;
}

const token = payload => jwt.sign({ mfa: true, sv: 0, ...payload }, process.env.JWT_SECRET);
const ADMIN = token({ uid: 1, rol: 'admin', clienteId: null, correo: 'admin@empresa.test' });
const CLIENTE = token({ uid: 20, rol: 'cliente', clienteId: 7, correo: 'cliente@entidad.test' });

// Simula la base: sesión (uid < 10 = admin), contexto de staff con los
// permisos indicados y, para el resto, el manejador propio de cada prueba.
function base({ permisos = [], manejar = () => undefined } = {}) {
  pool.query.mockImplementation(async (sql, params) => {
    const texto = String(sql);
    if (/SELECT session_version[^;]*FROM usuarios/i.test(texto)) {
      return [[{ session_version: 0, estado_cuenta: 'activa', rol: Number(params[0]) < 10 ? 'admin' : 'cliente', debe_cambiar_password: 0 }], []];
    }
    if (/FROM usuarios u\s+LEFT JOIN clientes/i.test(texto)) {
      return Number(params[0]) < 10
        ? [[{ id: params[0], rol: 'admin', es_superadmin: 0 }], []]
        : [[{ id: params[0], rol: 'cliente', cliente_id: 7, estado_cuenta: 'activa', correo_verificado_en: new Date() }], []];
    }
    if (/FROM staff_permisos/i.test(texto)) return [permisos.map(permiso => ({ permiso })), []];
    const propio = await manejar(texto, params);
    return propio === undefined ? [{ affectedRows: 1, insertId: 99 }, []] : propio;
  });
}

const llamadas = patron => pool.query.mock.calls.filter(([sql]) => patron.test(String(sql)));

beforeEach(() => {
  pool.query.mockReset();
  registrarAuditoria.mockClear();
  enviarCorreoEnSegundoPlano.mockClear();
  delete process.env.TEST_RATE_LIMITS;
});

describe('reporte mensual protegido', () => {
  test('sin sesión responde 401 y no consulta datos', async () => {
    base();
    const r = await request(crearApp()).get('/api/reportes/mensual');
    expect(r.status).toBe(401);
    expect(llamadas(/FROM atenciones/)).toHaveLength(0);
  });

  test('un cliente o un administrador sin clientes.gestionar reciben 403', async () => {
    base({ permisos: ['auditoria.ver'] });
    const app = crearApp();
    expect((await request(app).get('/api/reportes/mensual').set('Authorization', `Bearer ${CLIENTE}`)).status).toBe(403);
    const admin = await request(app).get('/api/reportes/mensual').set('Authorization', `Bearer ${ADMIN}`);
    expect(admin.status).toBe(403);
    expect(admin.body.permisoRequerido).toBe('clientes.gestionar');
    expect(llamadas(/FROM atenciones/)).toHaveLength(0);
  });

  test('con el permiso devuelve los indicadores y el resumen de reportes de clientes', async () => {
    base({
      permisos: ['clientes.gestionar'],
      manejar: sql => {
        if (/COUNT\(\*\) AS total FROM atenciones/.test(sql)) return [[{ total: 4 }], []];
        if (/AS escalados/.test(sql)) return [[{ escalados: 1 }], []];
        if (/AVG\(calificacion\) AS promedio FROM atenciones/.test(sql)) return [[{ promedio: 4.25 }], []];
        if (/FROM reportes_cliente/.test(sql)) return [[{ total: 3, nuevos: 2, promedio: 3.5 }], []];
        return [[], []];
      }
    });
    const r = await request(crearApp()).get('/api/reportes/mensual').set('Authorization', `Bearer ${ADMIN}`);
    expect(r.status).toBe(200);
    expect(r.body.clientesAtendidos).toBe(4);
    expect(r.body.reportesClientes).toEqual({ total: 3, nuevos: 2, calificacionPromedio: 3.5 });
    expect(r.headers['cache-control']).toBe('no-store');
  });
});

describe('bandeja de reportes de clientes', () => {
  test('el administrador ve los reportes con la entidad, la persona y el correo del cliente', async () => {
    base({
      permisos: ['clientes.gestionar'],
      manejar: sql => {
        if (/FROM reportes_cliente r/.test(sql)) {
          return [[{
            id: 5, cliente_id: 7, comentario: 'El pedido llegó incompleto', calificacion: 2, fecha: new Date(),
            estado: 'nuevo', respuesta_admin: null, nombre_unidad: 'Estación Norte',
            nombre_funcionario: cifrar('Juan Camilo Rodríguez'), tipo_institucion: 'policia', correo: 'cliente@entidad.test'
          }], []];
        }
        return undefined;
      }
    });
    const r = await request(crearApp()).get('/api/reportes/clientes?estado=nuevo&clienteId=7').set('Authorization', `Bearer ${ADMIN}`);
    expect(r.status).toBe(200);
    expect(r.body.reportes[0]).toMatchObject({
      id: 5, clienteId: 7, comentario: 'El pedido llegó incompleto', estado: 'nuevo',
      cliente: { entidad: 'Estación Norte', funcionario: 'Juan Camilo Rodríguez', correo: 'cliente@entidad.test' }
    });
    const [, valores] = llamadas(/FROM reportes_cliente r/)[0];
    expect(valores).toEqual(['nuevo', 7, 100]);
  });

  test('un cliente no puede leer la bandeja y los filtros inválidos responden 400', async () => {
    base({ permisos: ['clientes.gestionar'] });
    const app = crearApp();
    expect((await request(app).get('/api/reportes/clientes').set('Authorization', `Bearer ${CLIENTE}`)).status).toBe(403);
    expect((await request(app).get('/api/reportes/clientes?estado=borrado').set('Authorization', `Bearer ${ADMIN}`)).status).toBe(400);
    expect((await request(app).get('/api/reportes/clientes?clienteId=1;DROP').set('Authorization', `Bearer ${ADMIN}`)).status).toBe(400);
    expect(llamadas(/FROM reportes_cliente r/)).toHaveLength(0);
  });

  test('responder marca atendido, audita sin el texto y avisa al cliente sin incluir la respuesta', async () => {
    base({
      permisos: ['clientes.gestionar'],
      manejar: sql => (/JOIN usuarios u ON u.cliente_id = r.cliente_id/.test(sql) ? [[{ correo: 'cliente@entidad.test' }], []] : undefined)
    });
    const respuesta = 'Reprogramamos la entrega para el jueves.';
    const r = await request(crearApp()).patch('/api/reportes/clientes/5')
      .set('Authorization', `Bearer ${ADMIN}`).send({ estado: 'atendido', respuesta });
    expect(r.status).toBe(200);
    const [, valores] = llamadas(/UPDATE reportes_cliente/)[0];
    expect(valores).toEqual(['atendido', respuesta, 1, 5]);
    expect(registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({
      accion: 'gestionar_reporte_cliente', entidadId: '5', detalle: { estado: 'atendido', respondido: true }
    }));
    expect(JSON.stringify(registrarAuditoria.mock.calls)).not.toContain(respuesta);
    await new Promise(setImmediate);
    expect(enviarCorreoEnSegundoPlano).toHaveBeenCalledTimes(1);
    const correo = enviarCorreoEnSegundoPlano.mock.calls[0][0];
    expect(correo.to).toBe('cliente@entidad.test');
    expect(correo.text).not.toContain(respuesta);
  });

  test('un estado desconocido o campos extra se rechazan', async () => {
    base({ permisos: ['clientes.gestionar'] });
    const app = crearApp();
    const malo = await request(app).patch('/api/reportes/clientes/5').set('Authorization', `Bearer ${ADMIN}`).send({ estado: 'borrado' });
    expect(malo.status).toBe(400);
    const extra = await request(app).patch('/api/reportes/clientes/5').set('Authorization', `Bearer ${ADMIN}`).send({ estado: 'atendido', clienteId: 3 });
    expect(extra.status).toBe(400);
    expect(llamadas(/UPDATE reportes_cliente/)).toHaveLength(0);
  });
});

describe('mis reportes del cliente', () => {
  test('un reporte nuevo se guarda y avisa al buzón administrativo sin el comentario', async () => {
    base();
    const comentario = 'La talla de las botas no corresponde a la pedida';
    const r = await request(crearApp()).post('/api/mis-reportes').set('Authorization', `Bearer ${CLIENTE}`).send({ comentario, calificacion: 2 });
    expect(r.status).toBe(201);
    expect(llamadas(/INSERT INTO reportes_cliente/)[0][1]).toEqual([7, comentario, 2]);
    await new Promise(setImmediate);
    const aviso = enviarCorreoEnSegundoPlano.mock.calls[0][0];
    expect(aviso.to).toBe('avisos@empresa.test');
    expect(aviso.text).not.toContain(comentario);
  });

  test('un reporte que el equipo ya tomó no se edita ni se borra', async () => {
    base({ manejar: sql => (/SELECT cliente_id, estado FROM reportes_cliente/.test(sql) ? [[{ cliente_id: 7, estado: 'en_revision' }], []] : undefined) });
    const app = crearApp();
    const editar = await request(app).put('/api/mis-reportes/5').set('Authorization', `Bearer ${CLIENTE}`).send({ comentario: 'Nuevo texto', calificacion: 3 });
    expect(editar.status).toBe(409);
    expect(editar.body.code).toBe('REPORTE_EN_GESTION');
    expect((await request(app).delete('/api/mis-reportes/5').set('Authorization', `Bearer ${CLIENTE}`)).status).toBe(409);
    expect(llamadas(/UPDATE reportes_cliente|DELETE FROM reportes_cliente/)).toHaveLength(0);
  });

  test('el reporte de otro cliente responde 403', async () => {
    base({ manejar: sql => (/SELECT cliente_id, estado FROM reportes_cliente/.test(sql) ? [[{ cliente_id: 8, estado: 'nuevo' }], []] : undefined) });
    const r = await request(crearApp()).delete('/api/mis-reportes/5').set('Authorization', `Bearer ${CLIENTE}`);
    expect(r.status).toBe(403);
    expect(llamadas(/DELETE FROM reportes_cliente/)).toHaveLength(0);
  });

  test('el listado incluye el estado y la respuesta del administrador', async () => {
    base({ manejar: sql => (/FROM reportes_cliente WHERE cliente_id/.test(sql) ? [[{ id: 5, estado: 'atendido', respuesta_admin: 'Listo' }], []] : undefined) });
    const r = await request(crearApp()).get('/api/mis-reportes').set('Authorization', `Bearer ${CLIENTE}`);
    expect(r.status).toBe(200);
    expect(r.body[0]).toMatchObject({ estado: 'atendido', respuesta_admin: 'Listo' });
    expect(llamadas(/FROM reportes_cliente WHERE cliente_id/)[0][1]).toEqual([7]);
  });
});

describe('solicitudes de contacto', () => {
  const fila = () => ({
    id: 12, tipo_solicitud: 'pqrs', tipo_entidad: 'publica', entidad: 'Alcaldía de Prueba',
    nit_cifrado: cifrar('999000001'), correo_cifrado: cifrar('contacto@alcaldia.test'),
    criticidad: 'alta', mensaje: 'Necesitamos cotizar chalecos para 40 funcionarios.', estado: 'recibida', fecha_creacion: new Date()
  });

  test('el administrador ve el NIT y el correo descifrados y la consulta queda auditada', async () => {
    base({ permisos: ['clientes.gestionar'], manejar: sql => (/FROM solicitudes_contacto s/.test(sql) ? [[fila()], []] : undefined) });
    const r = await request(crearApp()).get('/api/admin/contacto?estado=recibida').set('Authorization', `Bearer ${ADMIN}`);
    expect(r.status).toBe(200);
    expect(r.body.solicitudes[0]).toMatchObject({ radicado: 'SI-00000012', nit: '999000001', correo: 'contacto@alcaldia.test' });
    expect(registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ver_solicitudes_contacto' }));
  });

  test('un cliente no accede al panel de contacto', async () => {
    base({ permisos: ['clientes.gestionar'] });
    const r = await request(crearApp()).get('/api/admin/contacto').set('Authorization', `Bearer ${CLIENTE}`);
    expect(r.status).toBe(403);
    expect(llamadas(/FROM solicitudes_contacto s/)).toHaveLength(0);
  });

  test('responder con notificación envía la respuesta al correo del remitente', async () => {
    base({
      permisos: ['clientes.gestionar'],
      manejar: sql => (/SELECT correo_cifrado FROM solicitudes_contacto/.test(sql) ? [[{ correo_cifrado: cifrar('contacto@alcaldia.test') }], []] : undefined)
    });
    const r = await request(crearApp()).patch('/api/admin/contacto/12').set('Authorization', `Bearer ${ADMIN}`)
      .send({ estado: 'cerrada', respuesta: 'Adjuntamos la cotización solicitada.', notificar: true });
    expect(r.status).toBe(200);
    expect(r.body.notificada).toBe(true);
    await new Promise(setImmediate);
    expect(enviarCorreoEnSegundoPlano).toHaveBeenCalledWith(expect.objectContaining({
      to: 'contacto@alcaldia.test', subject: expect.stringContaining('SI-00000012')
    }));
    expect(registrarAuditoria.mock.calls.at(-1)[0].detalle).toEqual({ estado: 'cerrada', respondida: true, notificada: true });
  });

  test('notificar sin respuesta se rechaza', async () => {
    base({ permisos: ['clientes.gestionar'] });
    const r = await request(crearApp()).patch('/api/admin/contacto/12').set('Authorization', `Bearer ${ADMIN}`).send({ estado: 'cerrada', notificar: true });
    expect(r.status).toBe(400);
    expect(llamadas(/UPDATE solicitudes_contacto/)).toHaveLength(0);
  });

  test('una solicitud nueva avisa al buzón administrativo sin el mensaje ni el correo del remitente', async () => {
    base();
    const mensaje = 'Requerimos soporte con el pedido 55 que no aparece en el historial.';
    const r = await request(crearApp()).post('/api/atencion/solicitudes').send({
      tipoSolicitud: 'soporte', tipoEntidad: 'publica', entidad: 'Alcaldía de Prueba', nit: '999000001',
      correo: 'contacto@alcaldia.test', criticidad: 'media', mensaje, autorizacionDatos: 'true'
    });
    expect(r.status).toBe(201);
    await new Promise(setImmediate);
    const aviso = enviarCorreoEnSegundoPlano.mock.calls[0][0];
    expect(aviso.to).toBe('avisos@empresa.test');
    expect(aviso.text).not.toContain(mensaje);
    expect(aviso.text).not.toContain('contacto@alcaldia.test');
  });

  test('las calificaciones tienen límite por conexión', async () => {
    process.env.TEST_RATE_LIMITS = '1';
    base();
    const app = crearApp();
    let ultima;
    for (let i = 0; i < 21; i += 1) {
      ultima = await request(app).post('/api/atencion/calificacion').send({ calificacion: 5 });
    }
    expect(ultima.status).toBe(429);
  });
});

describe('auditoría', () => {
  test('requiere el permiso auditoria.ver', async () => {
    base({ permisos: ['clientes.gestionar'] });
    const r = await request(crearApp()).get('/api/auditoria').set('Authorization', `Bearer ${ADMIN}`);
    expect(r.status).toBe(403);
    expect(r.body.permisoRequerido).toBe('auditoria.ver');
  });

  test('los filtros van como parámetros y los comodines del correo se buscan literalmente', async () => {
    base({ permisos: ['auditoria.ver'], manejar: sql => (/FROM auditoria/.test(sql) ? [[], []] : undefined) });
    const r = await request(crearApp())
      .get('/api/auditoria?entidad=reporte_cliente&accion=gestionar_reporte_cliente&correo=a%25_b&desde=2026-10-01&hasta=2026-10-16&antesDeId=40')
      .set('Authorization', `Bearer ${ADMIN}`);
    expect(r.status).toBe(200);
    const [sql, valores] = llamadas(/FROM auditoria/)[0];
    expect(sql).not.toMatch(/reporte_cliente|2026/);
    expect(valores).toEqual(['reporte_cliente', 'gestionar_reporte_cliente', 'a\\%\\_b%', '2026-10-01 00:00:00', '2026-10-16 00:00:00', 40, 100]);
  });

  test('fechas o filtros con caracteres no permitidos responden 400', async () => {
    base({ permisos: ['auditoria.ver'] });
    const app = crearApp();
    expect((await request(app).get('/api/auditoria?desde=ayer').set('Authorization', `Bearer ${ADMIN}`)).status).toBe(400);
    expect((await request(app).get("/api/auditoria?entidad=x' OR 1=1").set('Authorization', `Bearer ${ADMIN}`)).status).toBe(400);
    expect(llamadas(/FROM auditoria/)).toHaveLength(0);
  });
});

describe('mi cuenta: solicitudes propias', () => {
  test('el titular solo consulta sus propias solicitudes', async () => {
    base({ manejar: sql => (/FROM solicitudes_cuenta\s+WHERE usuario_id/.test(sql) ? [[{ id: 3, campo: 'nit', estado: 'pendiente' }], []] : undefined) });
    const r = await request(crearApp()).get('/api/mi-cuenta/mis-solicitudes').set('Authorization', `Bearer ${CLIENTE}`);
    expect(r.status).toBe(200);
    expect(r.body).toEqual([{ id: 3, campo: 'nit', estado: 'pendiente' }]);
    expect(llamadas(/FROM solicitudes_cuenta\s+WHERE usuario_id/)[0][1]).toEqual([20, 7]);
  });

  test('resolver una solicitud avisa al titular por correo', async () => {
    base({
      permisos: ['clientes.gestionar'],
      manejar: sql => (/SELECT u.correo FROM solicitudes_cuenta/.test(sql) ? [[{ correo: 'cliente@entidad.test' }], []] : undefined)
    });
    const r = await request(crearApp()).patch('/api/mi-cuenta/solicitudes/3').set('Authorization', `Bearer ${ADMIN}`)
      .send({ estado: 'aprobada', respuesta: 'Corregimos el NIT.' });
    expect(r.status).toBe(200);
    await new Promise(setImmediate);
    expect(enviarCorreoEnSegundoPlano).toHaveBeenCalledWith(expect.objectContaining({ to: 'cliente@entidad.test' }));
    expect(enviarCorreoEnSegundoPlano.mock.calls[0][0].text).not.toContain('Corregimos el NIT.');
  });
});

describe('migración 004', () => {
  test('es idempotente: tolera columnas e índice ya existentes', async () => {
    const { up } = require('../src/migraciones/004_seguimiento_reportes_contacto');
    const db = {
      query: jest.fn(async sql => {
        if (/ADD COLUMN/.test(sql)) throw Object.assign(new Error('Duplicate column'), { code: 'ER_DUP_FIELDNAME' });
        if (/information_schema.statistics/.test(sql)) return [[{ 1: 1 }]];
        return [[]];
      })
    };
    await expect(up(db)).resolves.toBeUndefined();
    expect(db.query.mock.calls.some(([sql]) => /CREATE INDEX/.test(sql))).toBe(false);
  });
});
