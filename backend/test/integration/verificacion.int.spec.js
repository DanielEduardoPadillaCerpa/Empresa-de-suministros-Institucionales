'use strict';

// Pruebas de integración de la verificación institucional contra un MySQL real.
// Ejecutar con: npm run test:integration  (ver docs/PLAN_PRUEBAS.md)

const path = require('path');
const fs = require('fs');
const { configurarEntorno, datosRegistro, datosOrganizacion, crearCliente, reiniciarBase } = require('./ayudantes');

configurarEntorno();

// El correo MFA no sale a n8n: se captura el código para completar el login.
const mockCodigosMfa = new Map();
jest.mock('../../src/mfaCourier', () => ({
  enviarCodigoMfaN8n: jest.fn(async ({ correo, codigo }) => { mockCodigosMfa.set(correo, codigo); }),
  obtenerConfiguracionMfa: jest.fn()
}));

const { pool, migrar } = require('../../src/db');
const { crearApp } = require('../../src/app');

let app;
const {
  api, auth, login, loginStaff, subirDocumento, registrar, prepararYEnviar,
  aprobarConDobleComprobacion, crearProducto, checkout
} = crearCliente(() => app, mockCodigosMfa);

const PDF_ACTIVO = Buffer.from('%PDF-1.4\n1 0 obj << /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >> endobj\n%%EOF\n');
const EXE_DISFRAZADO = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200, 1)]);

let admin;
let confirmador;
let policia;
let bomberos;
const productos = {};

async function compradorAprobado(tipo, correo) {
  const registro = await registrar(tipo, correo);
  const sesion = await login(correo);
  await prepararYEnviar(sesion.token, tipo);
  await aprobarConDobleComprobacion(registro.clienteId, admin, confirmador, { pool });
  return { ...(await login(correo)), clienteId: registro.clienteId };
}

beforeAll(async () => {
  await reiniciarBase(pool, migrar);
  app = crearApp();

  admin = await loginStaff('admin@prueba.test', 'AdminPrueba2026!');
  const alta = await auth(api().post('/api/verificacion/admin/personal'), admin.token)
    .send({ correo: 'confirmador@prueba.test', password: 'ConfirmadorPrueba2026!', permisos: ['verificacion.ver', 'verificacion.confirmar_institucion'] });
  expect(alta.status).toBe(201);
  confirmador = await loginStaff('confirmador@prueba.test', 'ConfirmadorPrueba2026!');

  productos.policiaGeneral = await crearProducto(admin.token, { nombre: 'INT Botas policía', precio: 150000, institucion_id: 'policia' });
  productos.policiaRestringido = await crearProducto(admin.token, { nombre: 'INT Chaleco restringido', precio: 900000, institucion_id: 'policia', restringido: true });
  productos.bomberosExclusivo = await crearProducto(admin.token, { nombre: 'INT Casco bomberos', precio: 300000, institucion_id: 'bomberos' });
  productos.general = await crearProducto(admin.token, { nombre: 'INT Resma general', precio: 20000, institucion_id: 'general' });

  policia = await compradorAprobado('policia', 'compras@policia.gov.co');
  bomberos = await compradorAprobado('bomberos', 'almacen@bomberos-prueba.test');
}, 240000);

afterAll(async () => {
  await pool.end();
});

describe('10.1 Registro mínimo y datos diferidos', () => {
  test('el campo específico del tipo es opcional; los de otros tipos o valores inválidos se rechazan', async () => {
    expect((await api().post('/api/auth/registro').send(datosRegistro('bomberos', 'a@x.test'))).status).toBe(201);
    expect((await api().post('/api/auth/registro').send(datosRegistro('policia', 'b@x.test', { tipoCuerpo: 'oficial' }))).status).toBe(400);
    const invalido = await api().post('/api/auth/registro').send(datosRegistro('bomberos', 'c@x.test', { tipoCuerpo: 'inventado' }));
    expect(invalido.status).toBe(400);
    expect(invalido.body.errores.tipoCuerpo).toBeDefined();
  });

  test('manipulación HTTP: rol, clienteId, autorización o estado en el cuerpo se rechazan', async () => {
    for (const extra of [{ rol: 'admin' }, { clienteId: 1 }, { autorizacionGeneral: true }, { estadoVerificacion: 'aprobado' }, { institucionAprobada: 'policia' }]) {
      const r = await api().post('/api/auth/registro').send(datosRegistro('corporativo', `m${Math.random()}@x.test`, extra));
      expect(r.status).toBe(400);
    }
    const [[{ n }]] = await pool.query("SELECT COUNT(*) n FROM usuarios WHERE correo LIKE 'm0.%'");
    expect(Number(n)).toBe(0);
  });

  test('NIT con dígito de verificación incorrecto se rechaza al completar la organización; correo duplicado se rechaza', async () => {
    await registrar('corporativo', 'nit@x.test');
    const sesion = await login('nit@x.test');
    const nit = await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), sesion.token)
      .send(datosOrganizacion('corporativo', { nit: '800197268-5' }));
    expect(nit.status).toBe(400);
    expect(nit.body.errores.nit).toBeDefined();
    const duplicado = await api().post('/api/auth/registro').send(datosRegistro('corporativo', 'compras@policia.gov.co'));
    expect(duplicado.status).toBe(409);
  });

  test('la cuenta nace activa (borrador) con solo los datos mínimos y su historial', async () => {
    const r = await registrar('corporativo', 'nueva@empresa.test');
    const [[cliente]] = await pool.query(
      `SELECT tipo_institucion, estado_verificacion, institucion_aprobada, autorizacion_general, nit, nombre_unidad,
              telefono, direccion_entrega, acepta_terminos_en FROM clientes WHERE id = ?`, [r.clienteId]);
    expect(cliente).toMatchObject({ tipo_institucion: 'corporativo', estado_verificacion: 'borrador', institucion_aprobada: null, autorizacion_general: 0, nit: null, nombre_unidad: null, telefono: null, direccion_entrega: null });
    expect(cliente.acepta_terminos_en).not.toBeNull();
    const [historial] = await pool.query('SELECT evento FROM verificacion_historial WHERE cliente_id = ?', [r.clienteId]);
    expect(historial.map(h => h.evento)).toEqual(['registro']);
    const [ids] = await pool.query('SELECT 1 FROM identificadores_personales WHERE cliente_id = ?', [r.clienteId]);
    expect(ids).toHaveLength(0);
  });

  test('archivos inválidos: ejecutable disfrazado de PDF y PDF con JavaScript se rechazan', async () => {
    await registrar('corporativo', 'docs@empresa.test');
    const sesion = await login('docs@empresa.test');
    expect((await subirDocumento(sesion.token, 'certificado_existencia', EXE_DISFRAZADO, 'cert.pdf')).status).toBe(400);
    expect((await subirDocumento(sesion.token, 'certificado_existencia', PDF_ACTIVO)).status).toBe(400);
    expect((await subirDocumento(sesion.token, 'tipo_inventado')).status).toBe(400);
  });

  test('una solicitud incompleta (sin organización, documento de identidad ni evidencia) no puede enviarse', async () => {
    const sesion = await login('docs@empresa.test');
    const envio = await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token);
    expect(envio.status).toBe(422);
    expect(envio.body.requisitos).toMatchObject({ organizacionCompleta: false, identificadorRegistrado: false });
    expect(envio.body.requisitos.faltantes).toContain('certificado_existencia');
  });

  test('cambio de tipo en borrador se aplica; en cuenta aprobada queda en revisión sin conceder acceso', async () => {
    const sesion = await login('docs@empresa.test');
    const cambio = await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), sesion.token)
      .send(datosOrganizacion('bomberos', { tipoCuerpo: 'voluntario', nombreEntidad: 'Bomberos Voluntarios X' }));
    expect(cambio.status).toBe(200);
    const aprobado = await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), policia.token)
      .send(datosOrganizacion('defensa', { nombreEntidad: 'Batallón X' }));
    expect(aprobado.status).toBe(202);
    const [[c]] = await pool.query('SELECT tipo_institucion, institucion_aprobada, tipo_solicitado FROM clientes WHERE id = ?', [policia.clienteId]);
    expect(c).toMatchObject({ tipo_institucion: 'policia', institucion_aprobada: 'policia', tipo_solicitado: 'defensa' });
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

  test('B. cuenta sin verificar: compra uso general de su tipo, nunca ve ni compra restringidos', async () => {
    await registrar('policia', 'pendiente@policia.gov.co');
    const sesion = await login('pendiente@policia.gov.co');
    const lista = await auth(api().get('/api/productos'), sesion.token);
    expect(lista.body.some(p => p.id === productos.policiaRestringido)).toBe(false);
    expect(lista.body.some(p => p.id === productos.bomberosExclusivo)).toBe(false);
    const botas = lista.body.find(p => p.id === productos.policiaGeneral);
    expect(Number(botas.precio)).toBe(150000);
    expect(botas.acceso).toMatchObject({ nivel: 'completo', puedeComprar: true, requiereAutorizacionCompra: false });
    expect((await auth(api().get(`/api/productos/${productos.policiaRestringido}`), sesion.token)).status).toBe(404);
    expect((await checkout(sesion.token, [{ id: productos.policiaGeneral, cantidad: 1 }])).status).toBe(201);
    expect((await checkout(sesion.token, [{ id: productos.policiaRestringido, cantidad: 1 }])).status).toBe(409);
  });

  test('C. Bomberos verificado no ve un producto exclusivo de Policía', async () => {
    expect((await auth(api().get(`/api/productos/${productos.policiaGeneral}`), bomberos.token)).status).toBe(404);
    const lista = await auth(api().get('/api/productos'), bomberos.token);
    expect(lista.body.some(p => p.id === productos.policiaGeneral)).toBe(false);
    expect(lista.body.some(p => p.id === productos.bomberosExclusivo)).toBe(true);
    expect(lista.body.some(p => p.id === productos.general)).toBe(true);
  });

  test('D. Policía verificado consulta un producto elegible con precio', async () => {
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

  test('F. restringido: sin revisión legal ni autorización no se compra', async () => {
    const detalle = await auth(api().get(`/api/productos/${productos.policiaRestringido}`), policia.token);
    expect(detalle.status).toBe(200);
    expect(detalle.body.acceso.puedeComprar).toBe(false);
    expect((await checkout(policia.token, [{ id: productos.policiaRestringido, cantidad: 1 }])).status).toBe(409);
    await auth(api().put(`/api/verificacion/admin/productos/${productos.policiaRestringido}/cumplimiento`), admin.token)
      .send({ revisionLegal: 'aprobada', restringido: true, institucionesElegibles: [], motivo: 'Prueba: régimen revisado por cumplimiento' });
    const sinAutorizacion = await checkout(policia.token, [{ id: productos.policiaRestringido, cantidad: 1 }]);
    expect(sinAutorizacion.status).toBe(403);
    expect(sinAutorizacion.body.code).toBe('REQUIERE_AUTORIZACION_RESTRINGIDOS');
  });

  test('H. staff sin permisos no aprueba solicitudes ni cambia reglas críticas', async () => {
    const alta = await auth(api().post('/api/verificacion/admin/personal'), admin.token)
      .send({ correo: 'lector@prueba.test', password: 'LectorPrueba2026!', permisos: ['verificacion.ver'] });
    expect(alta.status).toBe(201);
    const lector = await loginStaff('lector@prueba.test', 'LectorPrueba2026!');
    expect((await auth(api().get('/api/verificacion/admin/solicitudes'), lector.token)).status).toBe(200);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${bomberos.clienteId}/decision`), lector.token)
      .send({ decision: 'rechazar', motivo: 'Intento sin permiso suficiente' })).status).toBe(403);
    expect((await auth(api().put(`/api/verificacion/admin/productos/${productos.general}/cumplimiento`), lector.token)
      .send({ revisionLegal: 'bloqueada', restringido: false, institucionesElegibles: [], motivo: 'Intento sin permiso' })).status).toBe(403);
    expect((await auth(api().put(`/api/productos/${productos.general}`), lector.token)
      .send({ nombre: 'INT Resma general', precio: 20000, restringido: true, institucion_id: 'general' })).status).toBe(403);
    expect((await auth(api().put(`/api/verificacion/admin/permisos/${lector.id}`), lector.token)
      .send({ permisos: Object.keys(require('../../src/autorizacion').PERMISOS_STAFF) })).status).toBe(403);
    expect((await auth(api().get('/api/pedidos/todos'), lector.token)).status).toBe(403);
    expect((await auth(api().get('/api/auditoria'), lector.token)).status).toBe(403);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM staff_permisos WHERE usuario_id = ?', [alta.body.usuarioId]);
    expect(Number(n)).toBe(1);
  });

  test('I. cuenta suspendida con JWT vigente no puede comprar ni consultar', async () => {
    await registrar('policia', 'suspender@policia.gov.co');
    const otra = await login('suspender@policia.gov.co');
    expect((await checkout(otra.token, [{ id: productos.policiaGeneral, cantidad: 1 }])).status).toBe(201);
    const suspension = await auth(api().post(`/api/verificacion/admin/solicitudes/${otra.clienteId}/suspension`), admin.token)
      .send({ accion: 'suspender', motivo: 'Prueba: suspensión preventiva' });
    expect(suspension.status).toBe(200);
    expect((await checkout(otra.token, [{ id: productos.policiaGeneral, cantidad: 1 }])).status).toBe(401);
    expect((await api().post('/api/auth/refresh').send({ refreshToken: otra.refreshToken })).status).toBe(401);
    const nueva = await login('suspender@policia.gov.co');
    const compra = await checkout(nueva.token, [{ id: productos.policiaGeneral, cantidad: 1 }]);
    expect(compra.status).toBe(403);
    expect(compra.body.code).toBe('CUENTA_NO_ACTIVA');
  });

  test('J. documentos: otra institución no puede descargarlos; staff sin permiso tampoco; el acceso queda auditado', async () => {
    const [[doc]] = await pool.query('SELECT id FROM documentos_verificacion WHERE cliente_id = ? LIMIT 1', [bomberos.clienteId]);
    expect((await auth(api().get(`/api/verificacion/mi-solicitud/documentos/${doc.id}`), policia.token)).status).toBe(404);
    const lector = await login('lector@prueba.test', 'LectorPrueba2026!-Nueva');
    expect((await auth(api().get(`/api/verificacion/admin/documentos/${doc.id}`), lector.token)).status).toBe(403);
    const descarga = await auth(api().get(`/api/verificacion/admin/documentos/${doc.id}`), admin.token).buffer(true);
    expect(descarga.status).toBe(200);
    expect(descarga.headers['content-disposition']).toMatch(/attachment/);
    expect(Buffer.from(descarga.body).subarray(0, 5).toString()).toBe('%PDF-');
    const [[auditoria]] = await pool.query("SELECT COUNT(*) n FROM auditoria WHERE accion = 'ver_documento' AND entidad_id = ?", [String(bomberos.clienteId)]);
    expect(Number(auditoria.n)).toBe(1);
    const archivos = fs.readdirSync(process.env.DOCUMENTOS_DIR);
    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const contenido = fs.readFileSync(path.join(process.env.DOCUMENTOS_DIR, archivo));
      expect(contenido.includes('%PDF-')).toBe(false);
      expect(contenido.subarray(0, 4).toString()).toBe('SIK2');
    }
  });

  test('K. si el producto cambia de elegibilidad antes de confirmar, el pedido se rechaza', async () => {
    expect((await auth(api().get(`/api/productos/${productos.general}`), bomberos.token)).status).toBe(200);
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
    const r = await registrar('policia', 'estados@policia.gov.co');
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/decision`), admin.token)
      .send({ decision: 'aprobar' })).status).toBe(409);
    const sesion = await login('estados@policia.gov.co');
    await prepararYEnviar(sesion.token, 'policia', { documento: '52000111' });
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/decision`), admin.token)
      .send({ decision: 'rechazar' })).status).toBe(400);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/decision`), admin.token)
      .send({ decision: 'solicitar_informacion', motivo: 'Adjunta el oficio de designación firmado' })).status).toBe(200);
    const estado = await auth(api().get('/api/verificacion/mi-solicitud'), sesion.token);
    expect(estado.body).toMatchObject({ estado: 'requiere_informacion', motivo: 'Adjunta el oficio de designación firmado', puedeSubirDocumentos: true });
    const [historial] = await pool.query('SELECT evento FROM verificacion_historial WHERE cliente_id = ? ORDER BY id', [r.clienteId]);
    expect(historial.map(h => h.evento)).toEqual(['registro', 'identificador_registrado', 'enviar', 'solicitar_informacion']);
    const [[aud]] = await pool.query("SELECT COUNT(*) n FROM auditoria WHERE accion = 'verificacion_solicitar_informacion' AND entidad_id = ?", [String(r.clienteId)]);
    expect(Number(aud.n)).toBe(1);
  });

  test('el login informa el estado y el token no lleva institución si no está verificado', async () => {
    const sesion = await login('estados@policia.gov.co');
    expect(sesion.estadoVerificacion).toBe('requiere_informacion');
    expect(sesion.institucionId).toBeNull();
    expect((await login('compras@policia.gov.co')).institucionId).toBe('policia');
  });
});

describe('Regresión', () => {
  test('el asistente no revela productos restringidos a una cuenta sin verificar', async () => {
    const pendiente = await login('pendiente@policia.gov.co');
    const r1 = await auth(api().post('/api/asistente/mensaje'), pendiente.token).send({ mensaje: 'chaleco' });
    expect(JSON.stringify(r1.body)).not.toMatch(/Chaleco restringido/);
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
