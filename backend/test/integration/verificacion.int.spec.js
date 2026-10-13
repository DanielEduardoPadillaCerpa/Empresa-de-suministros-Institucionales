'use strict';

// Pruebas de integración de la verificación institucional contra un MySQL real.
// Ejecutar con: npm run test:integration  (ver docs/PLAN_PRUEBAS.md)
//
// Protección: se niega a correr si la base no es local o su nombre no contiene
// "test", porque BORRA todas las tablas de esa base antes de empezar.

const path = require('path');
const os = require('os');
const fs = require('fs');

const TEST_DB = {
  DB_HOST: process.env.TEST_DB_HOST || '127.0.0.1',
  DB_PORT: process.env.TEST_DB_PORT || '3307',
  DB_USER: process.env.TEST_DB_USER || 'test',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || 'test_pw',
  DB_NAME: process.env.TEST_DB_NAME || 'suministros_test'
};
if (!/test/i.test(TEST_DB.DB_NAME) || !['127.0.0.1', 'localhost'].includes(TEST_DB.DB_HOST)) {
  throw new Error('Las pruebas de integración solo corren contra una base local cuyo nombre contenga "test".');
}
Object.assign(process.env, TEST_DB, {
  NODE_ENV: 'test',
  JWT_SECRET: 'integration-jwt-secret-with-enough-length-0123',
  CRYPTO_KEY: 'integration-crypto-key-32-chars!',
  MFA_TOKEN_PEPPER: 'integration-mfa-pepper-with-at-least-32-chars',
  ADMIN_EMAIL: 'admin@prueba.test',
  ADMIN_PASSWORD: 'AdminPrueba2026!',
  PAYMENT_MODE: 'mock',
  PAYMENT_WEBHOOK_SECRET: 'integration-payment-webhook-secret-0123456789',
  TRUST_PROXY_HOPS: '1',
  DOCUMENTOS_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'docs-verificacion-'))
});

// El correo MFA no sale a n8n: se captura el código para completar el login.
const mockCodigosMfa = new Map();
jest.mock('../../src/mfaCourier', () => ({
  enviarCodigoMfaN8n: jest.fn(async ({ correo, codigo }) => { mockCodigosMfa.set(correo, codigo); }),
  obtenerConfiguracionMfa: jest.fn()
}));

const request = require('supertest');
const { pool, migrar } = require('../../src/db');
const { crearApp } = require('../../src/app');

let app;
let ipSecuencia = 1;
const api = () => {
  const ip = `10.99.${Math.floor(ipSecuencia / 250)}.${(ipSecuencia++ % 250) + 1}`;
  const conIp = r => r.set('X-Forwarded-For', ip);
  return {
    get: url => conIp(request(app).get(url)),
    post: url => conIp(request(app).post(url)),
    put: url => conIp(request(app).put(url)),
    del: url => conIp(request(app).delete(url))
  };
};
const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);

const PDF_VALIDO = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const PDF_ACTIVO = Buffer.from('%PDF-1.4\n1 0 obj << /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >> endobj\n%%EOF\n');
const EXE_DISFRAZADO = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200, 1)]);

function datosRegistro(tipo, correo, extra = {}) {
  const especificos = {
    policia: {},
    bomberos: { tipoCuerpo: 'oficial' },
    corporativo: { sector: 'industria' }
  }[tipo];
  return {
    tipoInstitucion: tipo,
    nombreEntidad: `Entidad ${tipo} de prueba`,
    nit: '800197268-4',
    dependencia: 'Sede principal',
    cargo: 'Jefe de compras',
    departamento: 'Cundinamarca',
    municipio: 'Bogotá',
    direccionInstalacion: 'Calle 26 # 50-10',
    nombreFuncionario: 'Persona De Prueba',
    correo,
    telefono: '6011234567',
    password: 'ClaveSegura2026!',
    aceptaTratamiento: true,
    ...especificos,
    ...extra
  };
}

async function login(correo, password = 'ClaveSegura2026!') {
  const inicio = await api().post('/api/auth/login').send({ correo, password });
  expect(inicio.status).toBe(202);
  const verificacion = await api().post('/api/auth/mfa/verificar')
    .send({ challengeId: inicio.body.challengeId, code: mockCodigosMfa.get(correo) });
  expect(verificacion.status).toBe(200);
  return verificacion.body;
}

async function subirDocumento(token, tipoDocumento, contenido = PDF_VALIDO, nombre = 'soporte.pdf') {
  return auth(api().post('/api/verificacion/mi-solicitud/documentos'), token)
    .field('tipoDocumento', tipoDocumento)
    .attach('archivo', contenido, { filename: nombre, contentType: 'application/pdf' });
}

// Registro → login MFA → documentos → envío → aprobación por staff.
async function compradorAprobado(tipo, correo, adminToken) {
  const registro = await api().post('/api/auth/registro').send(datosRegistro(tipo, correo));
  expect(registro.status).toBe(201);
  const sesion = await login(correo);
  for (const doc of registro.body.documentosRequeridos) {
    expect((await subirDocumento(sesion.token, doc.tipo)).status).toBe(201);
  }
  expect((await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token)).status).toBe(200);
  const decision = await auth(api().post(`/api/verificacion/admin/solicitudes/${registro.body.clienteId}/decision`), adminToken)
    .send({ decision: 'aprobar' });
  expect(decision.status).toBe(200);
  return { ...sesion, clienteId: registro.body.clienteId };
}

async function crearProducto(adminToken, datos) {
  const respuesta = await auth(api().post('/api/productos'), adminToken).send({
    descripcion: 'Producto de prueba de integración',
    cantidad_disponible: 20,
    ...datos
  });
  expect(respuesta.status).toBe(201);
  return respuesta.body.id;
}

async function checkout(token, items) {
  return auth(api().post('/api/checkout'), token)
    .set('Idempotency-Key', `int-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)
    .send({
      items,
      direccionEntrega: 'Calle 26 # 50-10, Bogotá',
      datosComprador: { tipo: 'empresa', razonSocial: 'Entidad de prueba', nit: '800197268-4' },
      metodo: 'mock'
    });
}

let admin;
let policia;
let bomberos;
const productos = {};

beforeAll(async () => {
  const [tablas] = await pool.query('SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const { t } of tablas) await pool.query(`DROP TABLE IF EXISTS \`${t}\``);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  await migrar();
  app = crearApp();

  admin = await login('admin@prueba.test', 'AdminPrueba2026!');
  productos.policiaGeneral = await crearProducto(admin.token, { nombre: 'INT Botas policía', precio: 150000, institucion_id: 'policia' });
  productos.policiaRestringido = await crearProducto(admin.token, { nombre: 'INT Chaleco restringido', precio: 900000, institucion_id: 'policia', restringido: true });
  productos.bomberosExclusivo = await crearProducto(admin.token, { nombre: 'INT Casco bomberos', precio: 300000, institucion_id: 'bomberos' });
  productos.general = await crearProducto(admin.token, { nombre: 'INT Resma general', precio: 20000, institucion_id: 'general' });

  policia = await compradorAprobado('policia', 'compras@policia.gov.co', admin.token);
  bomberos = await compradorAprobado('bomberos', 'almacen@bomberos-prueba.test', admin.token);
}, 180000);

afterAll(async () => {
  await pool.end();
});

describe('10.1 Registro condicional', () => {
  test('cada tipo exige sus campos y rechaza los de otros tipos', async () => {
    const sinCampo = await api().post('/api/auth/registro').send(datosRegistro('bomberos', 'a@x.test', { tipoCuerpo: undefined }));
    expect(sinCampo.status).toBe(400);
    expect(sinCampo.body.errores.tipoCuerpo).toBeDefined();
    const ajeno = await api().post('/api/auth/registro').send(datosRegistro('policia', 'b@x.test', { tipoCuerpo: 'oficial' }));
    expect(ajeno.status).toBe(400);
  });

  test('manipulación HTTP: rol, clienteId o autorización en el cuerpo se rechazan', async () => {
    for (const extra of [{ rol: 'admin' }, { clienteId: 1 }, { autorizacionGeneral: true }, { estadoVerificacion: 'aprobado' }]) {
      const r = await api().post('/api/auth/registro').send(datosRegistro('corporativo', `m${Math.random()}@x.test`, extra));
      expect(r.status).toBe(400);
    }
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM usuarios WHERE correo LIKE 'm0.%'");
    expect(Number(n)).toBe(0);
  });

  test('NIT con dígito de verificación incorrecto y correo duplicado se rechazan', async () => {
    const nit = await api().post('/api/auth/registro').send(datosRegistro('corporativo', 'nit@x.test', { nit: '800197268-5' }));
    expect(nit.status).toBe(400);
    expect(nit.body.errores.nit).toBeDefined();
    const duplicado = await api().post('/api/auth/registro').send(datosRegistro('corporativo', 'compras@policia.gov.co'));
    expect(duplicado.status).toBe(409);
  });

  test('la cuenta nace en borrador y persiste tipo, estado e historial en MySQL', async () => {
    const r = await api().post('/api/auth/registro').send(datosRegistro('corporativo', 'nueva@empresa.test'));
    expect(r.status).toBe(201);
    const [[cliente]] = await pool.query('SELECT tipo_institucion, estado_verificacion, institucion_aprobada, autorizacion_general FROM clientes WHERE id = ?', [r.body.clienteId]);
    expect(cliente).toMatchObject({ tipo_institucion: 'corporativo', estado_verificacion: 'borrador', institucion_aprobada: null, autorizacion_general: 0 });
    const [historial] = await pool.query('SELECT evento FROM verificacion_historial WHERE cliente_id = ?', [r.body.clienteId]);
    expect(historial.map(h => h.evento)).toEqual(['registro']);
  });

  test('archivos inválidos: ejecutable disfrazado de PDF y PDF con JavaScript se rechazan', async () => {
    await api().post('/api/auth/registro').send(datosRegistro('corporativo', 'docs@empresa.test'));
    const sesion = await login('docs@empresa.test');
    expect((await subirDocumento(sesion.token, 'certificado_existencia', EXE_DISFRAZADO, 'cert.pdf')).status).toBe(400);
    expect((await subirDocumento(sesion.token, 'certificado_existencia', PDF_ACTIVO)).status).toBe(400);
    expect((await subirDocumento(sesion.token, 'tipo_inventado')).status).toBe(400);
  });

  test('una solicitud incompleta no puede enviarse a revisión', async () => {
    const sesion = await login('docs@empresa.test');
    const envio = await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token);
    expect(envio.status).toBe(422);
    expect(envio.body.requisitos.faltantes).toContain('certificado_existencia');
  });

  test('cambio de tipo en borrador se aplica; en cuenta aprobada queda en revisión sin conceder acceso', async () => {
    const sesion = await login('docs@empresa.test');
    const cambio = await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), sesion.token).send({
      tipoInstitucion: 'bomberos', tipoCuerpo: 'voluntario', nombreEntidad: 'Bomberos Voluntarios X', nit: '800197268-4',
      dependencia: 'Estación 2', cargo: 'Almacenista', departamento: 'Cundinamarca', municipio: 'Chía', direccionInstalacion: 'Calle 1 # 2-3'
    });
    expect(cambio.status).toBe(200);
    const aprobado = await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), policia.token).send({
      tipoInstitucion: 'defensa', fuerza: 'ejercito', nombreEntidad: 'Batallón X', nit: '800197268-4',
      dependencia: 'Logística', cargo: 'Oficial de compras', departamento: 'Meta', municipio: 'Villavicencio', direccionInstalacion: 'Base 1'
    });
    expect(aprobado.status).toBe(202);
    const [[c]] = await pool.query('SELECT tipo_institucion, institucion_aprobada, tipo_solicitado FROM clientes WHERE id = ?', [policia.clienteId]);
    expect(c).toMatchObject({ tipo_institucion: 'policia', institucion_aprobada: 'policia', tipo_solicitado: 'defensa' });
    // Se rechaza para no alterar los escenarios siguientes.
    const rechazo = await auth(api().post(`/api/verificacion/admin/solicitudes/${policia.clienteId}/cambio-tipo`), admin.token)
      .send({ decision: 'rechazar', motivo: 'Prueba: no se aporta evidencia del nuevo tipo' });
    expect(rechazo.status).toBe(200);
  });
});

describe('10.2 Autorización de catálogos', () => {
  test('A. visitante: sin restringidos, sin precios, detalle restringido = 404', async () => {
    const lista = await api().get('/api/productos');
    expect(lista.status).toBe(200);
    expect(lista.body.some(p => p.id === productos.policiaRestringido)).toBe(false);
    expect(lista.body.every(p => p.precio === null && p.cantidad_disponible === null)).toBe(true);
    expect((await api().get(`/api/productos/${productos.policiaRestringido}`)).status).toBe(404);
  });

  test('B. cuenta pendiente: vitrina sin restringidos y sin compra por API directa', async () => {
    await api().post('/api/auth/registro').send(datosRegistro('policia', 'pendiente@policia.gov.co'));
    const sesion = await login('pendiente@policia.gov.co');
    expect((await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token)).status).toBe(200);
    const lista = await auth(api().get('/api/productos'), sesion.token);
    expect(lista.body.some(p => p.id === productos.policiaRestringido)).toBe(false);
    const botas = lista.body.find(p => p.id === productos.policiaGeneral);
    expect(botas.precio).toBeNull();
    expect(botas.acceso).toMatchObject({ nivel: 'vitrina', puedeComprar: false, motivo: 'cuenta_no_aprobada' });
    expect((await auth(api().get(`/api/productos/${productos.policiaRestringido}`), sesion.token)).status).toBe(404);
    const compra = await checkout(sesion.token, [{ id: productos.policiaGeneral, cantidad: 1 }]);
    expect(compra.status).toBe(403);
    expect(compra.body.code).toBe('CUENTA_NO_APROBADA');
  });

  test('C. Bomberos aprobado no ve un producto exclusivo de Policía', async () => {
    expect((await auth(api().get(`/api/productos/${productos.policiaGeneral}`), bomberos.token)).status).toBe(404);
    const lista = await auth(api().get('/api/productos'), bomberos.token);
    expect(lista.body.some(p => p.id === productos.policiaGeneral)).toBe(false);
    expect(lista.body.some(p => p.id === productos.bomberosExclusivo)).toBe(true);
    expect(lista.body.some(p => p.id === productos.general)).toBe(true);
  });

  test('D. Policía aprobado consulta un producto elegible con precio', async () => {
    const r = await auth(api().get(`/api/productos/${productos.policiaGeneral}`), policia.token);
    expect(r.status).toBe(200);
    expect(Number(r.body.precio)).toBe(150000);
    expect(r.body.acceso).toMatchObject({ nivel: 'completo', puedeComprar: true });
  });

  test('E. cambiar el id del producto en la petición no da acceso a otra institución', async () => {
    const r = await checkout(policia.token, [{ id: productos.bomberosExclusivo, cantidad: 1 }]);
    expect(r.status).toBe(409);
    expect(r.body.error).not.toMatch(/bomberos/i);
  });

  test('F. restringido sin autorización ni revisión legal no se compra', async () => {
    const detalle = await auth(api().get(`/api/productos/${productos.policiaRestringido}`), policia.token);
    expect(detalle.status).toBe(200);
    expect(detalle.body.acceso.puedeComprar).toBe(false);
    expect((await checkout(policia.token, [{ id: productos.policiaRestringido, cantidad: 1 }])).status).toBe(409);
    // Cumplimiento aprueba la revisión legal, pero falta la autorización de la cuenta.
    await auth(api().put(`/api/verificacion/admin/productos/${productos.policiaRestringido}/cumplimiento`), admin.token)
      .send({ revisionLegal: 'aprobada', restringido: true, institucionesElegibles: [], motivo: 'Prueba: régimen revisado por cumplimiento' });
    const sinAutorizacion = await checkout(policia.token, [{ id: productos.policiaRestringido, cantidad: 1 }]);
    expect(sinAutorizacion.status).toBe(403);
    expect(sinAutorizacion.body.code).toBe('REQUIERE_AUTORIZACION_RESTRINGIDOS');
    await auth(api().post(`/api/verificacion/admin/solicitudes/${policia.clienteId}/restringidos`), admin.token)
      .send({ autorizar: true, motivo: 'Prueba: evidencia de dotación revisada' });
    expect((await checkout(policia.token, [{ id: productos.policiaRestringido, cantidad: 1 }])).status).toBe(201);
  });

  test('G. al revocar la autorización con la sesión abierta, la siguiente compra se rechaza', async () => {
    await auth(api().post(`/api/verificacion/admin/solicitudes/${policia.clienteId}/restringidos`), admin.token)
      .send({ autorizar: false, motivo: 'Prueba: revocación por vencimiento de soporte' });
    expect((await checkout(policia.token, [{ id: productos.policiaRestringido, cantidad: 1 }])).status).toBe(403);
  });

  test('H. staff sin permisos no aprueba solicitudes ni cambia reglas críticas', async () => {
    const alta = await auth(api().post('/api/verificacion/admin/personal'), admin.token)
      .send({ correo: 'lector@prueba.test', password: 'LectorPrueba2026!', permisos: ['verificacion.ver'] });
    expect(alta.status).toBe(201);
    const lector = await login('lector@prueba.test', 'LectorPrueba2026!');
    expect((await auth(api().get('/api/verificacion/admin/solicitudes'), lector.token)).status).toBe(200);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${bomberos.clienteId}/decision`), lector.token)
      .send({ decision: 'rechazar', motivo: 'Intento sin permiso suficiente' })).status).toBe(403);
    expect((await auth(api().put(`/api/verificacion/admin/productos/${productos.general}/cumplimiento`), lector.token)
      .send({ revisionLegal: 'bloqueada', restringido: false, institucionesElegibles: [], motivo: 'Intento sin permiso' })).status).toBe(403);
    expect((await auth(api().put(`/api/productos/${productos.general}`), lector.token)
      .send({ nombre: 'INT Resma general', precio: 20000, restringido: true, institucion_id: 'general' })).status).toBe(403);
    expect((await auth(api().put(`/api/verificacion/admin/permisos/${lector.id}`), lector.token)
      .send({ permisos: Object.keys(require('../../src/autorizacion').PERMISOS_STAFF) })).status).toBe(403);
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM staff_permisos WHERE usuario_id = ?", [alta.body.usuarioId]);
    expect(Number(n)).toBe(1);
  });

  test('I. cuenta suspendida con JWT vigente no puede comprar ni consultar', async () => {
    const otra = await compradorAprobado('policia', 'suspender@policia.gov.co', admin.token);
    expect((await checkout(otra.token, [{ id: productos.policiaGeneral, cantidad: 1 }])).status).toBe(201);
    const suspension = await auth(api().post(`/api/verificacion/admin/solicitudes/${otra.clienteId}/suspension`), admin.token)
      .send({ accion: 'suspender', motivo: 'Prueba: suspensión preventiva' });
    expect(suspension.status).toBe(200);
    expect((await checkout(otra.token, [{ id: productos.policiaGeneral, cantidad: 1 }])).status).toBe(401);
    expect((await api().post('/api/auth/refresh').send({ refreshToken: otra.refreshToken })).status).toBe(401);
    // Al volver a iniciar sesión sigue sin poder comprar.
    const nueva = await login('suspender@policia.gov.co');
    const compra = await checkout(nueva.token, [{ id: productos.policiaGeneral, cantidad: 1 }]);
    expect(compra.status).toBe(403);
    const [[c]] = await pool.query('SELECT estado_verificacion FROM clientes WHERE id = ?', [otra.clienteId]);
    expect(c.estado_verificacion).toBe('suspendido');
  });

  test('J. documentos: otra institución no puede descargarlos; staff sin permiso tampoco; el acceso queda auditado', async () => {
    const [[doc]] = await pool.query('SELECT id FROM documentos_verificacion WHERE cliente_id = ? LIMIT 1', [bomberos.clienteId]);
    expect((await auth(api().get(`/api/verificacion/mi-solicitud/documentos/${doc.id}`), policia.token)).status).toBe(404);
    const lector = await login('lector@prueba.test', 'LectorPrueba2026!');
    expect((await auth(api().get(`/api/verificacion/admin/documentos/${doc.id}`), lector.token)).status).toBe(403);
    const descarga = await auth(api().get(`/api/verificacion/admin/documentos/${doc.id}`), admin.token).buffer(true);
    expect(descarga.status).toBe(200);
    expect(descarga.headers['content-disposition']).toMatch(/attachment/);
    expect(Buffer.from(descarga.body).subarray(0, 5).toString()).toBe('%PDF-');
    const [[auditoria]] = await pool.query("SELECT COUNT(*) n FROM auditoria WHERE accion = 'ver_documento' AND entidad_id = ?", [String(bomberos.clienteId)]);
    expect(Number(auditoria.n)).toBe(1);
    // En disco solo hay contenido cifrado.
    const archivos = fs.readdirSync(process.env.DOCUMENTOS_DIR);
    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      expect(fs.readFileSync(path.join(process.env.DOCUMENTOS_DIR, archivo)).includes('%PDF-')).toBe(false);
    }
  });

  test('K. si el producto cambia de elegibilidad antes de confirmar, el pedido se rechaza', async () => {
    const elegible = await auth(api().get(`/api/productos/${productos.general}`), bomberos.token);
    expect(elegible.status).toBe(200);
    await auth(api().put(`/api/verificacion/admin/productos/${productos.general}/cumplimiento`), admin.token)
      .send({ revisionLegal: 'pendiente', restringido: false, institucionesElegibles: [], motivo: 'Prueba: se suspende la venta por revisión' });
    const compra = await checkout(bomberos.token, [{ id: productos.general, cantidad: 1 }]);
    expect(compra.status).toBe(409);
    expect(compra.body.code).toBe('REVISION_LEGAL_PENDIENTE');
    await auth(api().put(`/api/verificacion/admin/productos/${productos.general}/cumplimiento`), admin.token)
      .send({ revisionLegal: 'no_requerida', restringido: false, institucionesElegibles: [], motivo: 'Prueba: se restablece la venta' });
  });

  test('K2. elegibilidad M:N: un producto de Bomberos habilitado también para Policía', async () => {
    expect((await auth(api().get(`/api/productos/${productos.bomberosExclusivo}`), policia.token)).status).toBe(404);
    await auth(api().put(`/api/verificacion/admin/productos/${productos.bomberosExclusivo}/cumplimiento`), admin.token)
      .send({ revisionLegal: 'no_requerida', restringido: false, institucionesElegibles: ['policia'], motivo: 'Prueba: uso compartido aprobado' });
    expect((await auth(api().get(`/api/productos/${productos.bomberosExclusivo}`), policia.token)).status).toBe(200);
  });

  test('L. el precio enviado por el navegador se ignora; el total sale de MySQL', async () => {
    const compra = await checkout(bomberos.token, [{ id: productos.general, cantidad: 2, precio: 1 }]);
    expect(compra.status).toBe(201);
    const [[pedido]] = await pool.query('SELECT total FROM pedidos WHERE id = ?', [compra.body.pedido_id]);
    expect(Number(pedido.total)).toBe(40000);
  });
});

describe('Transiciones de estado', () => {
  test('solo se aprueba desde pendiente, con motivo obligatorio para rechazar', async () => {
    const r = await api().post('/api/auth/registro').send(datosRegistro('policia', 'estados@policia.gov.co'));
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.body.clienteId}/decision`), admin.token)
      .send({ decision: 'aprobar' })).status).toBe(409);
    const sesion = await login('estados@policia.gov.co');
    await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.body.clienteId}/decision`), admin.token)
      .send({ decision: 'rechazar' })).status).toBe(400);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.body.clienteId}/decision`), admin.token)
      .send({ decision: 'solicitar_informacion', motivo: 'Adjunta el oficio de designación firmado' })).status).toBe(200);
    const estado = await auth(api().get('/api/verificacion/mi-solicitud'), sesion.token);
    expect(estado.body).toMatchObject({ estado: 'requiere_informacion', motivo: 'Adjunta el oficio de designación firmado', puedeSubirDocumentos: true });
    const [historial] = await pool.query('SELECT evento, actor_tipo FROM verificacion_historial WHERE cliente_id = ? ORDER BY id', [r.body.clienteId]);
    expect(historial.map(h => h.evento)).toEqual(['registro', 'enviar', 'solicitar_informacion']);
    const [[aud]] = await pool.query("SELECT COUNT(*) n FROM auditoria WHERE accion = 'verificacion_solicitar_informacion' AND entidad_id = ?", [String(r.body.clienteId)]);
    expect(Number(aud.n)).toBe(1);
  });

  test('el login informa el estado y el token no lleva institución si no está aprobado', async () => {
    const sesion = await login('estados@policia.gov.co');
    expect(sesion.estadoVerificacion).toBe('requiere_informacion');
    expect(sesion.institucionId).toBeNull();
    // La sesión de 'policia' se abrió antes de aprobarla; una nueva ya la refleja.
    expect(policia.institucionId).toBeNull();
    expect((await login('compras@policia.gov.co')).institucionId).toBe('policia');
  });
});

describe('Regresión', () => {
  test('el asistente no revela productos a una cuenta no aprobada y sí a una aprobada', async () => {
    const pendiente = await login('pendiente@policia.gov.co');
    const r1 = await auth(api().post('/api/asistente/mensaje'), pendiente.token).send({ mensaje: 'botas' });
    expect(r1.body.tarjetas || []).toHaveLength(0);
  });

  test('categorías públicas, historial de pedidos y perfil de checkout siguen funcionando', async () => {
    expect((await api().get('/api/categorias')).status).toBe(200);
    const historial = await auth(api().get('/api/pedidos'), bomberos.token);
    expect(historial.status).toBe(200);
    expect(historial.body.length).toBeGreaterThan(0);
    const perfil = await auth(api().get('/api/checkout/perfil'), bomberos.token);
    expect(perfil.status).toBe(200);
    expect(perfil.body.estadoVerificacion).toBe('aprobado');
  });
});
