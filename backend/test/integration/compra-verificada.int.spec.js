'use strict';

// Verificación de identidad y vínculo antes de comprar, doble comprobación,
// respuestas de n8n, autorización por operación, superadministrador y cuentas
// de prueba, contra MySQL real. Numeración = criterios de docs/PLAN_PRUEBAS.md §3.

const path = require('path');
const { execFileSync } = require('child_process');
const { configurarEntorno, crearCliente, reiniciarBase, datosOrganizacion, TEST_DB } = require('./ayudantes');

configurarEntorno();

const mockCodigosMfa = new Map();
jest.mock('../../src/mfaCourier', () => ({
  enviarCodigoMfaN8n: jest.fn(async ({ correo, codigo }) => { mockCodigosMfa.set(correo, codigo); }),
  obtenerConfiguracionMfa: jest.fn()
}));

const { pool, migrar } = require('../../src/db');
const { crearApp } = require('../../src/app');

let app;
const {
  api, auth, login, loginStaff, registrar, prepararYEnviar, responderN8n,
  aprobarConDobleComprobacion, crearProducto, checkout
} = crearCliente(() => app, mockCodigosMfa);

const CEDULA = '1023456789';
const salidaConsola = [];
let espias = [];

let admin;
let confirmador;
const productos = {};

async function refDe(clienteId) {
  const [[s]] = await pool.query('SELECT ref, estado FROM solicitudes_verificacion WHERE cliente_id = ? ORDER BY id DESC LIMIT 1', [clienteId]);
  return s;
}

async function compradorConRestringidos(tipo, correo, documento) {
  const r = await registrar(tipo, correo);
  const sesion = await login(correo);
  await prepararYEnviar(sesion.token, tipo, { documento });
  await aprobarConDobleComprobacion(r.clienteId, admin, confirmador, { pool });
  expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/restringidos`), admin.token)
    .send({ autorizar: true, motivo: 'Prueba: dotación individual revisada' })).status).toBe(200);
  return { ...(await login(correo)), clienteId: r.clienteId };
}

async function autorizarCompra(sesion, items) {
  const inicio = await auth(api().post('/api/verificacion/compra/autorizacion'), sesion.token).send({ items });
  expect(inicio.status).toBe(201);
  const codigo = mockCodigosMfa.get(sesion.correo);
  const confirmacion = await auth(api().post('/api/verificacion/compra/autorizacion/confirmar'), sesion.token)
    .send({ autorizacion: inicio.body.autorizacion, codigo });
  expect(confirmacion.status).toBe(200);
  return inicio.body.autorizacion;
}

beforeAll(async () => {
  for (const metodo of ['log', 'warn', 'error', 'info']) {
    espias.push(jest.spyOn(console, metodo).mockImplementation((...args) => { salidaConsola.push(args.map(String).join(' ')); }));
  }
  await reiniciarBase(pool, migrar);
  app = crearApp();
  admin = await loginStaff('admin@prueba.test', 'AdminPrueba2026!');
  const alta = await auth(api().post('/api/verificacion/admin/personal'), admin.token)
    .send({ correo: 'confirmador@prueba.test', password: 'ConfirmadorPrueba2026!', permisos: ['verificacion.ver', 'verificacion.confirmar_institucion'] });
  expect(alta.status).toBe(201);
  confirmador = await loginStaff('confirmador@prueba.test', 'ConfirmadorPrueba2026!');
  productos.general = await crearProducto(admin.token, { nombre: 'CV Linterna general', precio: 50000, institucion_id: 'general' });
  productos.restringido = await crearProducto(admin.token, { nombre: 'CV Chaleco nivel III', precio: 1200000, institucion_id: 'policia', restringido: true });
  productos.restringido2 = await crearProducto(admin.token, { nombre: 'CV Placa balística', precio: 800000, institucion_id: 'policia', restringido: true });
  for (const id of [productos.restringido, productos.restringido2]) {
    expect((await auth(api().put(`/api/verificacion/admin/productos/${id}/cumplimiento`), admin.token)
      .send({ revisionLegal: 'aprobada', restringido: true, institucionesElegibles: [], motivo: 'Prueba: régimen legal revisado' })).status).toBe(200);
  }
}, 240000);

afterAll(async () => {
  for (const espia of espias) espia.mockRestore();
  await pool.end();
});

describe('1–3. Registro mínimo', () => {
  test('crea la cuenta con la categoría elegida, sin datos sensibles ni permisos de compra restringida', async () => {
    const r = await registrar('policia', 'agente1@policia.gov.co');
    expect(r).toMatchObject({ estadoVerificacion: 'borrador', tipoInstitucion: 'policia', correoInstitucional: true });
    expect(r.mensaje).toMatch(/verificación|te pediremos/i);
    const [[c]] = await pool.query('SELECT tipo_institucion, autorizacion_general, institucion_aprobada, nit FROM clientes WHERE id = ?', [r.clienteId]);
    expect(c).toEqual({ tipo_institucion: 'policia', autorizacion_general: 0, institucion_aprobada: null, nit: null });
    const sesion = await login('agente1@policia.gov.co');
    const lista = await auth(api().get('/api/productos'), sesion.token);
    expect(lista.body.some(p => p.restringido)).toBe(false);
    expect((await auth(api().post('/api/verificacion/compra/autorizacion'), sesion.token)
      .send({ items: [{ id: productos.restringido, cantidad: 1 }] })).body.code).toBe('REQUIERE_VERIFICACION');
  });
});

describe('4–6. Verificación antes de comprar y autorización por operación', () => {
  let comprador;

  test('la doble comprobación usa el correo institucional como canal independiente y respeta los cuatro ojos', async () => {
    const r = await registrar('policia', 'agente2@policia.gov.co');
    const sesion = await login('agente2@policia.gov.co');
    await prepararYEnviar(sesion.token, 'policia', { documento: CEDULA });
    const solicitud = await refDe(r.clienteId);
    expect(solicitud.estado).toBe('en_curso');
    const [comps] = await pool.query(
      'SELECT componente, metodo, resultado FROM verificacion_comprobaciones vc JOIN solicitudes_verificacion s ON s.id = vc.solicitud_id WHERE s.ref = ? ORDER BY vc.id', [solicitud.ref]);
    expect(comps).toEqual([
      { componente: 'vinculo_documental', metodo: 'revision_documental', resultado: 'pendiente' },
      { componente: 'canal_independiente', metodo: 'correo_institucional', resultado: 'confirmado' },
      { componente: 'entidad', metodo: 'registro_publico', resultado: 'pendiente' }
    ]);
    // Antes de completar las comprobaciones no se puede aprobar.
    const prematura = await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/decision`), admin.token).send({ decision: 'aprobar' });
    expect(prematura.status).toBe(422);
    expect(prematura.body.code).toBe('COMPROBACIONES_INCOMPLETAS');
    await aprobarConDobleComprobacion(r.clienteId, admin, confirmador, { pool });
    const [[c]] = await pool.query('SELECT estado_verificacion, institucion_aprobada, verificado_hasta FROM clientes WHERE id = ?', [r.clienteId]);
    expect(c.estado_verificacion).toBe('aprobado');
    expect(new Date(c.verificado_hasta).getTime()).toBeGreaterThan(Date.now() + 300 * 864e5);
    expect((await refDe(r.clienteId)).estado).toBe('aprobada');
  });

  test('sin correo institucional, la misma persona no puede registrar ambas comprobaciones', async () => {
    const r = await registrar('bomberos', 'almacen@bomberos-cuatro-ojos.test');
    const sesion = await login('almacen@bomberos-cuatro-ojos.test');
    await prepararYEnviar(sesion.token, 'bomberos', { documento: '79111222' });
    const base = `/api/verificacion/admin/solicitudes/${r.clienteId}/comprobaciones`;
    expect((await auth(api().post(`${base}/vinculo_documental`), admin.token).send({ resultado: 'confirmado' })).status).toBe(200);
    const misma = await auth(api().post(`${base}/canal_independiente`), admin.token).send({ resultado: 'confirmado', referencia: 'Llamada conmutador' });
    expect(misma.status).toBe(409);
    const sinReferencia = await auth(api().post(`${base}/canal_independiente`), confirmador.token).send({ resultado: 'confirmado' });
    expect(sinReferencia.status).toBe(400);
    const sinPermiso = await auth(api().post(`${base}/vinculo_documental`), confirmador.token).send({ resultado: 'confirmado' });
    expect(sinPermiso.status).toBe(403);
  });

  test('5. con verificación aprobada pero sin autorización de la operación, el checkout restringido se bloquea', async () => {
    comprador = await compradorConRestringidos('policia', 'agente3@policia.gov.co', '80123456');
    const r = await checkout(comprador.token, [{ id: productos.restringido, cantidad: 1 }]);
    expect(r.status).toBe(403);
    expect(r.body).toMatchObject({ code: 'REQUIERE_AUTORIZACION_COMPRA', motivo: 'falta' });
    // El uso general no exige autorización adicional.
    expect((await checkout(comprador.token, [{ id: productos.general, cantidad: 1 }])).status).toBe(201);
    expect((await auth(api().post('/api/verificacion/compra/autorizacion'), comprador.token)
      .send({ items: [{ id: productos.general, cantidad: 1 }] })).status).toBe(409);
  });

  test('6. con el código correcto la compra continúa, y la autorización queda ligada al pedido', async () => {
    const items = [{ id: productos.restringido, cantidad: 1 }];
    const inicio = await auth(api().post('/api/verificacion/compra/autorizacion'), comprador.token).send({ items });
    expect(inicio.status).toBe(201);
    const malo = await auth(api().post('/api/verificacion/compra/autorizacion/confirmar'), comprador.token)
      .send({ autorizacion: inicio.body.autorizacion, codigo: mockCodigosMfa.get(comprador.correo) === '000000' ? '111111' : '000000' });
    expect(malo.status).toBe(401);
    const ref = await autorizarCompra(comprador, items);
    const compra = await checkout(comprador.token, items, { autorizacionCompra: ref });
    expect(compra.status).toBe(201);
    const [[a]] = await pool.query('SELECT estado, pedido_id FROM autorizaciones_compra WHERE ref = ?', [ref]);
    expect(a).toEqual({ estado: 'consumida', pedido_id: compra.body.pedido_id });
    const [[aud]] = await pool.query("SELECT COUNT(*) n FROM auditoria WHERE accion = 'compra_restringida_autorizada' AND entidad_id = ?", [String(compra.body.pedido_id)]);
    expect(Number(aud.n)).toBe(1);
  });

  test('11. una autorización no se reutiliza: ni dos veces, ni con otro carrito, ni por otro usuario, ni vencida', async () => {
    const items = [{ id: productos.restringido, cantidad: 1 }];
    const ref = await autorizarCompra(comprador, items);
    // Otro carrito.
    const otroCarrito = await checkout(comprador.token, [{ id: productos.restringido, cantidad: 2 }], { autorizacionCompra: ref });
    expect(otroCarrito.body.motivo).toBe('carrito_distinto');
    // Otro usuario verificado con sus propios restringidos.
    const otro = await compradorConRestringidos('policia', 'agente4@policia.gov.co', '80999888');
    const ajena = await checkout(otro.token, items, { autorizacionCompra: ref });
    expect(ajena.status).toBe(403);
    expect(ajena.body.motivo).toBe('no_corresponde');
    // Primer uso legítimo y reutilización.
    expect((await checkout(comprador.token, items, { autorizacionCompra: ref })).status).toBe(201);
    const segunda = await checkout(comprador.token, items, { autorizacionCompra: ref });
    expect(segunda.body.motivo).toBe('no_vigente');
    // Vencida.
    const ref2 = await autorizarCompra(comprador, items);
    await pool.query('UPDATE autorizaciones_compra SET expira_en = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE ref = ?', [ref2]);
    expect((await checkout(comprador.token, items, { autorizacionCompra: ref2 })).body.motivo).toBe('no_vigente');
  });

  test('11b. una verificación vencida deja de autorizar restringidos y exige renovación', async () => {
    const vencido = await compradorConRestringidos('policia', 'agente5@policia.gov.co', '80555444');
    await pool.query('UPDATE clientes SET verificado_hasta = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = ?', [vencido.clienteId]);
    expect((await auth(api().get(`/api/productos/${productos.restringido}`), vencido.token)).status).toBe(404);
    const intento = await auth(api().post('/api/verificacion/compra/autorizacion'), vencido.token).send({ items: [{ id: productos.restringido, cantidad: 1 }] });
    expect(intento.body).toMatchObject({ code: 'REQUIERE_VERIFICACION', verificacionVencida: true });
    expect((await checkout(vencido.token, [{ id: productos.general, cantidad: 1 }])).status).toBe(201);
    const estado = await auth(api().get('/api/verificacion/mi-solicitud'), vencido.token);
    expect(estado.body).toMatchObject({ verificacionVencida: true, puedeEnviar: true });
    expect((await auth(api().post('/api/verificacion/mi-solicitud/enviar'), vencido.token)).status).toBe(200);
    const [[c]] = await pool.query('SELECT estado_verificacion, autorizacion_general FROM clientes WHERE id = ?', [vencido.clienteId]);
    expect(c).toEqual({ estado_verificacion: 'pendiente', autorizacion_general: 0 });
    expect((await refDe(vencido.clienteId))).toMatchObject({ estado: 'en_curso' });
  });

  test('12. reintentos: la misma clave de idempotencia no duplica pedidos, autorizaciones ni solicitudes', async () => {
    const items = [{ id: productos.restringido2, cantidad: 1 }];
    const ref = await autorizarCompra(comprador, items);
    const clave = `reintento-${Date.now()}-abcdefgh`;
    const [a, b] = await Promise.all([
      checkout(comprador.token, items, { autorizacionCompra: ref }, clave),
      checkout(comprador.token, items, { autorizacionCompra: ref }, clave)
    ]);
    const exitosas = [a, b].filter(r => [200, 201].includes(r.status));
    expect(exitosas.length).toBeGreaterThanOrEqual(1);
    const ids = new Set(exitosas.map(r => r.body.pedido_id));
    expect(ids.size).toBe(1);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM pagos WHERE idempotency_key = ?', [clave]);
    expect(Number(n)).toBe(1);
    const repetida = await checkout(comprador.token, items, { autorizacionCompra: ref }, clave);
    expect(repetida.status).toBe(200);
    expect(repetida.body.pedido_id).toBe([...ids][0]);

    const r = await registrar('corporativo', 'idem@empresa.test');
    const sesion = await login('idem@empresa.test');
    await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), sesion.token).send(datosOrganizacion('corporativo'));
    await auth(api().post('/api/verificacion/mi-solicitud/identificador'), sesion.token).send({ tipoDocumento: 'CC', numero: '1098765432', autorizaTratamiento: true });
    const estado = await auth(api().get('/api/verificacion/mi-solicitud'), sesion.token);
    for (const req of estado.body.requisitos.requisitos.filter(x => x.obligatorio)) {
      await auth(api().post('/api/verificacion/mi-solicitud/documentos'), sesion.token)
        .field('tipoDocumento', req.tipo).attach('archivo', require('./ayudantes').PDF_VALIDO, { filename: 'a.pdf', contentType: 'application/pdf' });
    }
    const claveEnvio = 'envio-idempotente-0001';
    expect((await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token).set('Idempotency-Key', claveEnvio)).status).toBe(200);
    expect((await auth(api().post('/api/verificacion/mi-solicitud/enviar'), sesion.token).set('Idempotency-Key', claveEnvio)).body.repetida).toBe(true);
    const [[{ s }]] = await pool.query('SELECT COUNT(*) s FROM solicitudes_verificacion WHERE cliente_id = ?', [r.clienteId]);
    expect(Number(s)).toBe(1);
  });

  test('los códigos de autorización tienen límite por usuario (5 cada 15 minutos)', async () => {
    const items = [{ id: productos.restringido, cantidad: 1 }];
    const limite = await auth(api().post('/api/verificacion/compra/autorizacion'), comprador.token).send({ items });
    expect(limite.status).toBe(429);
    // Simula el paso del tiempo para los escenarios siguientes.
    await pool.query('UPDATE autorizaciones_compra SET creado_en = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE usuario_id = ?', [comprador.id]);
  });

  test('13. suspensión con token vigente: no compra y se revocan sus autorizaciones', async () => {
    const items = [{ id: productos.restringido, cantidad: 1 }];
    const ref = await autorizarCompra(comprador, items);
    await auth(api().post(`/api/verificacion/admin/solicitudes/${comprador.clienteId}/suspension`), admin.token)
      .send({ accion: 'suspender', motivo: 'Prueba: suspensión preventiva por reporte' });
    expect((await checkout(comprador.token, items, { autorizacionCompra: ref })).status).toBe(401);
    const [[a]] = await pool.query('SELECT estado FROM autorizaciones_compra WHERE ref = ?', [ref]);
    expect(a.estado).toBe('revocada');
  });
});

describe('7–10. Resultados de la fuente de la entidad (n8n W11)', () => {
  let cliente;
  let ref;

  beforeAll(async () => {
    const r = await registrar('corporativo', 'compras@vigilancia-prueba.test', { sector: 'seguridad_privada' });
    const sesion = await login('compras@vigilancia-prueba.test');
    await prepararYEnviar(sesion.token, 'corporativo', { documento: '1144556677' });
    cliente = r.clienteId;
    ref = (await refDe(cliente)).ref;
  });

  test('10. respuestas falsas o manipuladas no cambian nada', async () => {
    const antes = await refDe(cliente);
    expect((await responderN8n(ref, 'confirmado', { secreto: 'otro-secreto-que-no-es-el-del-backend-0123' })).status).toBe(401);
    expect((await responderN8n(ref, 'confirmado', { extra: { verified: true } })).status).toBe(400);
    expect((await responderN8n(ref, 'confirmado', { extra: { componente: 'vinculo_documental' } })).status).toBe(400);
    expect((await responderN8n(ref, 'confirmado', { fuente: 'mi-servidor/falso' })).status).toBe(400);
    expect((await responderN8n('f'.repeat(32), 'confirmado')).status).toBe(404);
    expect((await responderN8n(ref, 'confirmado', { consultadoEn: new Date(Date.now() - 3600e3).toISOString() })).status).toBe(400);
    const sinFirma = await api().post('/api/automatizaciones/verificaciones/resultado').send({ ref, componente: 'entidad', metodo: 'registro_publico', resultado: 'confirmado' });
    expect(sinFirma.status).toBe(401);
    expect(await refDe(cliente)).toEqual(antes);
    const [[e]] = await pool.query("SELECT resultado FROM verificacion_comprobaciones vc JOIN solicitudes_verificacion s ON s.id = vc.solicitud_id WHERE s.ref = ? AND componente = 'entidad'", [ref]);
    expect(e.resultado).toBe('pendiente');
  });

  test('9. fuente caída: no autoriza, queda en espera y el mantenimiento reintenta', async () => {
    expect((await responderN8n(ref, 'fuente_no_disponible')).status).toBe(200);
    expect((await refDe(cliente)).estado).toBe('fuente_no_disponible');
    const aprobar = await auth(api().post(`/api/verificacion/admin/solicitudes/${cliente}/decision`), admin.token).send({ decision: 'aprobar' });
    expect(aprobar.status).toBe(422);
    await pool.query("UPDATE verificacion_comprobaciones SET actualizado_en = DATE_SUB(NOW(), INTERVAL 20 MINUTE) WHERE componente = 'entidad' AND solicitud_id = (SELECT id FROM solicitudes_verificacion WHERE ref = ?)", [ref]);
    process.env.N8N_W11_MAINTENANCE_TOKEN = 'integration-w11-maintenance-token-0123456789';
    const sinToken = await api().post('/api/automatizaciones/verificaciones/mantenimiento');
    expect(sinToken.status).toBe(401);
    const mant = await api().post('/api/automatizaciones/verificaciones/mantenimiento').set('x-automation-token', process.env.N8N_W11_MAINTENANCE_TOKEN);
    expect(mant.status).toBe(200);
    expect(mant.body.reintentosEntidad).toBe(1);
    const [eventos] = await pool.query("SELECT payload FROM automation_outbox WHERE workflow = 'W11' AND dedupe_key LIKE ?", [`verificacion:${ref}:%`]);
    expect(eventos.length).toBe(2);
  });

  test('10b. un nonce ya usado se rechaza (anti-repetición)', async () => {
    const nonce = 'a1'.repeat(24);
    expect((await responderN8n(ref, 'ambiguo', { nonce })).status).toBe(200);
    expect((await responderN8n(ref, 'confirmado', { nonce })).status).toBe(409);
  });

  test('8. una respuesta ambigua no concede autorización', async () => {
    expect((await refDe(cliente)).estado).toBe('requiere_revision');
    const aprobar = await auth(api().post(`/api/verificacion/admin/solicitudes/${cliente}/decision`), admin.token).send({ decision: 'aprobar' });
    expect(aprobar.status).toBe(422);
    const [[c]] = await pool.query('SELECT estado_verificacion FROM clientes WHERE id = ?', [cliente]);
    expect(c.estado_verificacion).toBe('pendiente');
  });

  test('7. ausencia en el registro público: no rechaza; un revisor puede verificar la entidad manualmente', async () => {
    const r = await registrar('bomberos', 'voluntarios@bomberos-ausente.test', { tipoCuerpo: 'voluntario' });
    const sesion = await login('voluntarios@bomberos-ausente.test');
    await prepararYEnviar(sesion.token, 'bomberos', { documento: '91222333' });
    const s = await refDe(r.clienteId);
    expect((await responderN8n(s.ref, 'datos_insuficientes')).status).toBe(200);
    const despues = await refDe(r.clienteId);
    expect(despues.estado).toBe('requiere_revision');
    const [[c]] = await pool.query('SELECT estado_verificacion FROM clientes WHERE id = ?', [r.clienteId]);
    expect(c.estado_verificacion).toBe('pendiente');
    const base = `/api/verificacion/admin/solicitudes/${r.clienteId}/comprobaciones`;
    expect((await auth(api().post(`${base}/entidad`), admin.token).send({ resultado: 'confirmado' })).status).toBe(400);
    expect((await auth(api().post(`${base}/entidad`), admin.token).send({ resultado: 'confirmado', referencia: 'Certificado DNBC 2026-118 cotejado' })).status).toBe(200);
    expect((await auth(api().post(`${base}/vinculo_documental`), admin.token).send({ resultado: 'confirmado' })).status).toBe(200);
    expect((await auth(api().post(`${base}/canal_independiente`), confirmador.token).send({ resultado: 'confirmado', referencia: 'Oficio del comandante, radicado 77' })).status).toBe(200);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/decision`), admin.token).send({ decision: 'aprobar' })).status).toBe(200);
  });

  test('una no coincidencia confirmada pasa a revisión humana; el rechazo exige motivo y permite reintentar', async () => {
    const r = await registrar('corporativo', 'cancelada@empresa-prueba.test');
    const sesion = await login('cancelada@empresa-prueba.test');
    await prepararYEnviar(sesion.token, 'corporativo', { documento: '1199887766' });
    const s = await refDe(r.clienteId);
    expect((await responderN8n(s.ref, 'no_coincide', { fuente: 'datos.gov.co/c82u-588k' })).status).toBe(200);
    expect((await refDe(r.clienteId)).estado).toBe('requiere_revision');
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${r.clienteId}/decision`), admin.token)
      .send({ decision: 'rechazar', motivo: 'Matrícula mercantil cancelada en RUES' })).status).toBe(200);
    const estado = await auth(api().get('/api/verificacion/mi-solicitud'), sesion.token);
    expect(estado.body).toMatchObject({ estado: 'rechazado', reintentosRestantes: 3 });
    expect(estado.body.solicitud.comprobaciones.map(c => c.resultado)).not.toContain('no_coincide');
  });
});

describe('14–16. Manipulación, administrador limitado y superadministrador', () => {
  let superadmin;
  let gestor;

  test('14. el cliente no puede fijar autorizaciones ni institución por campos extra', async () => {
    await registrar('policia', 'manipula@policia.gov.co');
    const sesion = await login('manipula@policia.gov.co');
    const r = await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), sesion.token)
      .send({ ...datosOrganizacion('policia'), autorizacionGeneral: true, institucionAprobada: 'policia' });
    expect(r.status).toBe(400);
    const id = await auth(api().post('/api/verificacion/mi-solicitud/identificador'), sesion.token)
      .send({ tipoDocumento: 'CC', numero: '123456', autorizaTratamiento: true, verificado: true });
    expect(id.status).toBe(400);
    const sinAutorizacion = await auth(api().post('/api/verificacion/mi-solicitud/identificador'), sesion.token)
      .send({ tipoDocumento: 'CC', numero: '123456' });
    expect(sinAutorizacion.status).toBe(400);
    const placa = await auth(api().post('/api/verificacion/mi-solicitud/identificador'), sesion.token)
      .send({ tipoDocumento: 'PLACA', numero: '123456', autorizaTratamiento: true });
    expect(placa.status).toBe(400);
  });

  test('16. el comando crea un superadministrador de forma segura e idempotente', async () => {
    const env = { ...process.env, ...TEST_DB, SUPERADMIN_PASSWORD: 'SuperAdminPrueba2026!xyz', NODE_ENV: 'test' };
    const script = path.join(__dirname, '..', '..', 'scripts', 'crear-superadmin.js');
    const ejecutar = args => execFileSync(process.execPath, [script, ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(() => ejecutar(['--correo', 'super@prueba.test'])).toThrow();
    const salida = ejecutar(['--correo', 'super@prueba.test', '--confirmar-base', TEST_DB.DB_NAME]);
    expect(salida).toMatch(/Superadministrador creado/);
    expect(salida).not.toMatch(/SuperAdminPrueba2026/);
    expect(ejecutar(['--correo', 'super@prueba.test', '--confirmar-base', TEST_DB.DB_NAME])).toMatch(/ya es superadministrador/);
    expect(() => ejecutar(['--correo', 'otro-super@prueba.test', '--confirmar-base', TEST_DB.DB_NAME])).toThrow(/Ya existe un superadministrador/);
    // Sin SUPERADMIN_PASSWORD ni terminal no se genera una contraseña que quedaría en un registro.
    const sinClave = { ...env };
    delete sinClave.SUPERADMIN_PASSWORD;
    expect(() => execFileSync(process.execPath, [script, '--correo', 'tercero@prueba.test', '--adicional', '--confirmar-base', TEST_DB.DB_NAME], { env: sinClave, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })).toThrow();
    const [usuarios] = await pool.query("SELECT rol, es_superadmin, debe_cambiar_password FROM usuarios WHERE correo = 'super@prueba.test'");
    expect(usuarios).toEqual([{ rol: 'admin', es_superadmin: 1, debe_cambiar_password: 1 }]);
    const [[aud]] = await pool.query("SELECT COUNT(*) n FROM auditoria WHERE accion = 'crear_superadmin'");
    expect(Number(aud.n)).toBe(1);

    const primera = await login('super@prueba.test', 'SuperAdminPrueba2026!xyz');
    expect(primera.debeCambiarPassword).toBe(true);
    expect((await auth(api().get('/api/verificacion/admin/diagnostico'), primera.token)).body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    superadmin = await loginStaff('super@prueba.test', 'SuperAdminPrueba2026!xyz');
  });

  test('16b. el superadministrador revisa paneles y diagnóstico, pero no datos personales sin permiso explícito', async () => {
    const diag = await auth(api().get('/api/verificacion/admin/diagnostico'), superadmin.token);
    expect(diag.status).toBe(200);
    expect(diag.body.migraciones.every(m => m.aplicada)).toBe(true);
    expect(JSON.stringify(diag.body)).not.toMatch(/integration-|secret|it1:/i);
    for (const ruta of ['/api/pedidos/todos', '/api/auditoria', '/api/clientes', '/api/verificacion/admin/solicitudes', '/api/verificacion/admin/permisos', '/api/productos/bajo-inventario']) {
      expect((await auth(api().get(ruta), superadmin.token)).status).toBe(200);
    }
    const [[doc]] = await pool.query('SELECT id, cliente_id FROM documentos_verificacion LIMIT 1');
    expect((await auth(api().get(`/api/verificacion/admin/documentos/${doc.id}`), superadmin.token)).status).toBe(403);
    expect((await auth(api().post(`/api/verificacion/admin/solicitudes/${doc.cliente_id}/identificador/revelar`), superadmin.token)
      .send({ justificacion: 'Revisión de un reclamo del titular radicado 55' })).status).toBe(403);
    // Concesión explícita y acceso excepcional auditado.
    const [[yo]] = await pool.query("SELECT id FROM usuarios WHERE correo = 'super@prueba.test'");
    expect((await auth(api().put(`/api/verificacion/admin/permisos/${yo.id}`), superadmin.token).send({ permisos: ['identificadores.ver'] })).status).toBe(200);
    const corta = await auth(api().post(`/api/verificacion/admin/solicitudes/${doc.cliente_id}/identificador/revelar`), superadmin.token).send({ justificacion: 'ver' });
    expect(corta.status).toBe(400);
    const revelado = await auth(api().post(`/api/verificacion/admin/solicitudes/${doc.cliente_id}/identificador/revelar`), superadmin.token)
      .send({ justificacion: 'Revisión de un reclamo del titular radicado 55' });
    expect(revelado.status).toBe(200);
    expect(revelado.body.numero).toMatch(/^\d+$/);
    const [[aud]] = await pool.query("SELECT detalle FROM auditoria WHERE accion = 'ver_identificador' ORDER BY id DESC LIMIT 1");
    expect(aud.detalle).toMatch(/reclamo/);
    expect(aud.detalle).not.toContain(revelado.body.numero);
  });

  test('15. un administrador limitado no ejecuta operaciones reservadas al superadministrador', async () => {
    const alta = await auth(api().post('/api/verificacion/admin/personal'), superadmin.token)
      .send({ correo: 'gestor@prueba.test', password: 'GestorPrueba2026!', permisos: ['staff.permisos', 'verificacion.ver'] });
    expect(alta.status).toBe(201);
    gestor = await loginStaff('gestor@prueba.test', 'GestorPrueba2026!');
    const crear = permisos => auth(api().post('/api/verificacion/admin/personal'), gestor.token)
      .send({ correo: `n${Math.random().toString(36).slice(2, 8)}@prueba.test`, password: 'NuevoStaff2026!!', permisos });
    expect((await crear(['staff.permisos'])).status).toBe(403);
    expect((await crear(['identificadores.ver'])).status).toBe(403);
    expect((await crear(['restringidos.autorizar'])).status).toBe(403);
    expect((await crear(['verificacion.ver'])).status).toBe(201);
    const [[sup]] = await pool.query("SELECT id FROM usuarios WHERE correo = 'super@prueba.test'");
    expect((await auth(api().put(`/api/verificacion/admin/permisos/${sup.id}`), gestor.token).send({ permisos: [] })).status).toBe(403);
    expect((await auth(api().put(`/api/verificacion/admin/permisos/${gestor.id}`), gestor.token).send({ permisos: ['staff.permisos', 'verificacion.ver', 'verificacion.decidir'] })).status).toBe(403);
    expect((await auth(api().get('/api/verificacion/admin/diagnostico'), gestor.token)).status).toBe(403);
    expect((await auth(api().get('/api/verificacion/admin/diagnostico'), admin.token)).status).toBe(403);
    // El administrador sembrado (no superadmin) tampoco concede permisos reservados.
    expect((await auth(api().put(`/api/verificacion/admin/permisos/${gestor.id}`), admin.token).send({ permisos: ['staff.permisos', 'verificacion.ver', 'identificadores.ver'] })).status).toBe(403);
  });

  test('9.3. cuentas de prueba sintéticas: solo en bases de prueba, idempotentes y sin compras en producción', async () => {
    const script = path.join(__dirname, '..', '..', 'scripts', 'crear-cuentas-prueba.js');
    const env = { ...process.env, ...TEST_DB, NODE_ENV: 'test' };
    const salidaArchivo = path.join(process.env.DOCUMENTOS_DIR, 'cuentas.txt');
    const ejecutar = (extra = {}, args = ['--confirmar-base', TEST_DB.DB_NAME, '--salida', salidaArchivo]) =>
      execFileSync(process.execPath, [script, ...args], { env: { ...env, ...extra }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(() => ejecutar({ NODE_ENV: 'production' })).toThrow();
    expect(() => ejecutar({ DB_NAME: 'suministros_real' })).toThrow();
    expect(ejecutar()).toMatch(/Se crearon 8 cuentas/);
    expect(ejecutar()).toMatch(/ya existían/);
    const [cuentas] = await pool.query("SELECT u.correo, u.es_cuenta_prueba, c.estado_verificacion FROM usuarios u LEFT JOIN clientes c ON c.id = u.cliente_id WHERE u.correo LIKE '%@suministros-prueba.test' ORDER BY u.correo");
    expect(cuentas).toHaveLength(8);
    expect(cuentas.every(c => c.es_cuenta_prueba === 1)).toBe(true);
    const contenido = require('fs').readFileSync(salidaArchivo, 'utf8');
    expect(contenido.split('\n').filter(l => l.includes('@suministros-prueba.test'))).toHaveLength(8);
    // La cuenta sintética autorizada no compra cuando el entorno es producción.
    const credencial = contenido.split('\n').find(l => l.startsWith('general')).trim().split(/\s+/);
    const sesion = await login(credencial[1], credencial[2]);
    expect((await checkout(sesion.token, [{ id: productos.general, cantidad: 1 }])).status).toBe(201);
    process.env.NODE_ENV = 'production';
    try {
      const bloqueada = await checkout(sesion.token, [{ id: productos.general, cantidad: 1 }]);
      expect(bloqueada.status).toBe(403);
      expect(bloqueada.body.code).toBe('CUENTA_DE_PRUEBA');
    } finally {
      process.env.NODE_ENV = 'test';
    }
  });
});

describe('17–20. Datos sensibles, regresión, migraciones y consistencia', () => {
  test('17. el número de documento no aparece en registros, respuestas, eventos a n8n ni en claro en la base', async () => {
    const r = await registrar('policia', 'sensible@policia.gov.co');
    const sesion = await login('sensible@policia.gov.co');
    await prepararYEnviar(sesion.token, 'policia', { documento: '1.023.456.789' });
    const titular = await auth(api().get('/api/verificacion/mi-solicitud'), sesion.token);
    const staff = await auth(api().get(`/api/verificacion/admin/solicitudes/${r.clienteId}`), admin.token);
    expect(titular.body.identificador.enmascarado).toBe('•••••789');
    expect(staff.body.identificador).toMatchObject({ enmascarado: '•••••789', otrasCuentasMismoDocumento: 1 });
    for (const cuerpo of [titular.body, staff.body]) expect(JSON.stringify(cuerpo)).not.toContain(CEDULA);
    expect(salidaConsola.join('\n')).not.toContain(CEDULA);
    const [filas] = await pool.query('SELECT numero_cifrado, indice_hmac FROM identificadores_personales');
    for (const f of filas) {
      expect(f.numero_cifrado).toMatch(/^v2:it1:/);
      expect(f.numero_cifrado).not.toContain(CEDULA);
      expect(f.indice_hmac).not.toBe(require('crypto').createHash('sha256').update(`CC:${CEDULA}`).digest('hex'));
    }
    const [eventos] = await pool.query("SELECT payload, payload_cifrado FROM automation_outbox WHERE workflow = 'W11'");
    expect(eventos.length).toBeGreaterThan(0);
    for (const e of eventos) {
      const texto = typeof e.payload === 'string' ? e.payload : JSON.stringify(e.payload);
      expect(texto).not.toContain(CEDULA);
      if (!e.payload_cifrado) expect(texto).not.toMatch(/@/);
    }
    const [[aviso]] = await pool.query("SELECT COUNT(*) n FROM automation_outbox WHERE workflow = 'W11' AND payload_cifrado = TRUE");
    expect(Number(aviso.n)).toBeGreaterThan(0);
  });

  test('18. funcionalidades previas: login, refresh, mi cuenta, categorías e historial', async () => {
    const sesion = await login('agente1@policia.gov.co');
    expect((await api().post('/api/auth/refresh').send({ refreshToken: sesion.refreshToken })).status).toBe(200);
    expect((await auth(api().get('/api/mi-cuenta'), sesion.token)).status).toBe(200);
    expect((await api().get('/api/categorias')).status).toBe(200);
    expect((await auth(api().get('/api/pedidos'), sesion.token)).status).toBe(200);
  });

  test('20. los estados de solicitudes y cuentas son consistentes', async () => {
    const [inconsistentes] = await pool.query(`
      SELECT c.id, c.estado_verificacion, s.estado FROM clientes c
      JOIN solicitudes_verificacion s ON s.id = (SELECT MAX(id) FROM solicitudes_verificacion WHERE cliente_id = c.id)
      WHERE (c.estado_verificacion = 'aprobado' AND s.estado <> 'aprobada')
         OR (c.estado_verificacion = 'pendiente' AND s.estado NOT IN ('en_curso','requiere_revision','fuente_no_disponible'))
         OR (s.estado = 'aprobada' AND c.estado_verificacion NOT IN ('aprobado','suspendido'))`);
    expect(inconsistentes).toEqual([]);
    const [autorizacionesHuérfanas] = await pool.query("SELECT id FROM autorizaciones_compra WHERE estado = 'consumida' AND pedido_id IS NULL");
    expect(autorizacionesHuérfanas).toEqual([]);
  });

  test('19. la migración 002 es idempotente y su reversión/reaplicación conserva los datos existentes', async () => {
    const { aplicarMigraciones, revertirMigracion, estadoMigraciones } = require('../../src/migraciones');
    const conteo = async () => {
      const [[r]] = await pool.query('SELECT (SELECT COUNT(*) FROM clientes) c, (SELECT COUNT(*) FROM usuarios) u, (SELECT COUNT(*) FROM pedidos) p, (SELECT COUNT(*) FROM documentos_verificacion) d, (SELECT COUNT(*) FROM auditoria) a');
      return r;
    };
    const antes = await conteo();
    await aplicarMigraciones(pool);
    expect(await conteo()).toEqual(antes);
    await revertirMigracion(pool, '002_verificacion_en_compra');
    expect((await estadoMigraciones(pool)).find(m => m.version === '002_verificacion_en_compra').aplicada).toBe(false);
    await aplicarMigraciones(pool);
    expect(await conteo()).toEqual(antes);
    const [[aprobados]] = await pool.query("SELECT COUNT(*) n FROM clientes WHERE estado_verificacion = 'aprobado' AND verificado_hasta IS NULL");
    expect(Number(aprobados.n)).toBe(0);
  });
});
