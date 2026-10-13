'use strict';

// Ayudantes compartidos por las pruebas de integración contra MySQL real.
//
// Protección: se niegan a correr si la base no es local o su nombre no
// contiene "test", porque cada spec BORRA todas las tablas antes de empezar.

const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

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

const SECRETO_RESPUESTAS_N8N = 'integration-w11-callback-secret-0123456789abcdef';

function configurarEntorno() {
  Object.assign(process.env, TEST_DB, {
    NODE_ENV: 'test',
    JWT_SECRET: 'integration-jwt-secret-with-enough-length-0123',
    CRYPTO_KEY: 'integration-crypto-key-32-chars!',
    CRYPTO_KEYS: `it1:${crypto.randomBytes(32).toString('base64')}`,
    CRYPTO_KEY_ACTIVA: 'it1',
    IDENT_HMAC_KEY: crypto.randomBytes(32).toString('base64'),
    N8N_W11_CALLBACK_SECRET: SECRETO_RESPUESTAS_N8N,
    MFA_TOKEN_PEPPER: 'integration-mfa-pepper-with-at-least-32-chars',
    ADMIN_EMAIL: 'admin@prueba.test',
    ADMIN_PASSWORD: 'AdminPrueba2026!',
    PAYMENT_MODE: 'mock',
    PAYMENT_WEBHOOK_SECRET: 'integration-payment-webhook-secret-0123456789',
    TRUST_PROXY_HOPS: '1',
    DOCUMENTOS_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'docs-verificacion-'))
  });
}

const PDF_VALIDO = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

const ESPECIFICOS = {
  policia: {},
  defensa: { fuerza: 'ejercito' },
  bomberos: { tipoCuerpo: 'oficial' },
  socorro: { organismo: 'defensa_civil' },
  penitenciario: { entidadPenitenciaria: 'inpec' },
  corporativo: { sector: 'industria' }
};

function datosRegistro(tipo, correo, extra = {}) {
  return {
    tipoInstitucion: tipo,
    nombreCompleto: 'Persona De Prueba',
    correo,
    password: 'ClaveSegura2026!',
    aceptaTerminos: true,
    aceptaTratamiento: true,
    ...extra
  };
}

function datosOrganizacion(tipo, extra = {}) {
  return {
    tipoInstitucion: tipo,
    nombreEntidad: `Entidad ${tipo} de prueba`,
    nit: '800197268-4',
    dependencia: 'Sede principal',
    cargo: 'Jefe de compras',
    departamento: 'Cundinamarca',
    municipio: 'Bogotá',
    direccionInstalacion: 'Calle 26 # 50-10',
    ...ESPECIFICOS[tipo],
    ...extra
  };
}

function crearCliente(obtenerApp, codigosMfa) {
  const request = require('supertest');
  let ipSecuencia = 1;
  const api = () => {
    const ip = `10.99.${Math.floor(ipSecuencia / 250) % 250}.${(ipSecuencia++ % 250) + 1}`;
    const conIp = r => r.set('X-Forwarded-For', ip);
    return {
      get: url => conIp(request(obtenerApp()).get(url)),
      post: url => conIp(request(obtenerApp()).post(url)),
      put: url => conIp(request(obtenerApp()).put(url)),
      del: url => conIp(request(obtenerApp()).delete(url))
    };
  };
  const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);

  async function login(correo, password = 'ClaveSegura2026!') {
    const inicio = await api().post('/api/auth/login').send({ correo, password });
    expect(inicio.status).toBe(202);
    const verificacion = await api().post('/api/auth/mfa/verificar')
      .send({ challengeId: inicio.body.challengeId, code: codigosMfa.get(correo) });
    expect(verificacion.status).toBe(200);
    return verificacion.body;
  }

  // Personal con contraseña inicial: la cambia en el primer acceso (obligatorio).
  async function loginStaff(correo, passwordInicial) {
    let sesion = await login(correo, passwordInicial);
    if (sesion.debeCambiarPassword) {
      const nueva = `${passwordInicial}-Nueva`;
      const cambio = await auth(api().post('/api/mi-cuenta/password'), sesion.token)
        .send({ passwordActual: passwordInicial, passwordNueva: nueva });
      if (cambio.status !== 200) throw new Error('cambio de contraseña: ' + cambio.status + ' ' + JSON.stringify(cambio.body));
      sesion = await login(correo, nueva);
      sesion.password = nueva;
    } else {
      sesion.password = passwordInicial;
    }
    expect(sesion.debeCambiarPassword).toBe(false);
    return sesion;
  }

  async function subirDocumento(token, tipoDocumento, contenido = PDF_VALIDO, nombre = 'soporte.pdf') {
    return auth(api().post('/api/verificacion/mi-solicitud/documentos'), token)
      .field('tipoDocumento', tipoDocumento)
      .attach('archivo', contenido, { filename: nombre, contentType: 'application/pdf' });
  }

  async function registrar(tipo, correo, extra = {}) {
    const r = await api().post('/api/auth/registro').send(datosRegistro(tipo, correo, extra));
    expect(r.status).toBe(201);
    return r.body;
  }

  // Datos de organización + documento de identidad + evidencia + envío.
  async function prepararYEnviar(token, tipo, { documento = '1023456789', organizacion = {} } = {}) {
    expect((await auth(api().post('/api/verificacion/mi-solicitud/clasificacion'), token)
      .send(datosOrganizacion(tipo, organizacion))).status).toBe(200);
    expect((await auth(api().post('/api/verificacion/mi-solicitud/identificador'), token)
      .send({ tipoDocumento: 'CC', numero: documento, autorizaTratamiento: true })).status).toBe(200);
    const estado = await auth(api().get('/api/verificacion/mi-solicitud'), token);
    for (const req of estado.body.requisitos.requisitos.filter(r => r.obligatorio)) {
      expect((await subirDocumento(token, req.tipo)).status).toBe(201);
    }
    const envio = await auth(api().post('/api/verificacion/mi-solicitud/enviar'), token);
    expect(envio.status).toBe(200);
  }

  // Simula la respuesta firmada de n8n W11 sobre la entidad.
  async function responderN8n(ref, resultado, { fuente = 'datos.gov.co/5c7g-ptic', secreto = SECRETO_RESPUESTAS_N8N, nonce, consultadoEn, extra = {} } = {}) {
    const { firmarPayload } = require('../../src/automationSignatures');
    const payload = {
      ref, componente: 'entidad', metodo: 'registro_publico', resultado,
      fuente: resultado === 'confirmado' || resultado === 'no_coincide' ? fuente : null,
      consultadoEn: consultadoEn || new Date().toISOString(),
      nonce: nonce || crypto.randomBytes(24).toString('hex'),
      ...extra
    };
    const firmado = firmarPayload(payload, secreto);
    return api().post('/api/automatizaciones/verificaciones/resultado')
      .set('Content-Type', 'application/json')
      .set('x-automation-timestamp', firmado.timestamp)
      .set('x-automation-signature', firmado.firma)
      .send(firmado.cuerpo);
  }

  // Doble comprobación completa: revisor A registra la revisión documental y
  // la entidad; revisor B (otra persona) la confirmación institucional.
  async function aprobarConDobleComprobacion(clienteId, revisorA, revisorB, { pool }) {
    const base = `/api/verificacion/admin/solicitudes/${clienteId}`;
    expect((await auth(api().post(`${base}/comprobaciones/vinculo_documental`), revisorA.token)
      .send({ resultado: 'confirmado', observacion: 'Certificado laboral coincide con la cédula registrada' })).status).toBe(200);
    const [[comp]] = await pool.query(
      `SELECT vc.metodo, vc.resultado, s.ref FROM verificacion_comprobaciones vc
       JOIN solicitudes_verificacion s ON s.id = vc.solicitud_id
       WHERE s.cliente_id = ? AND vc.componente = 'canal_independiente' ORDER BY s.id DESC LIMIT 1`, [clienteId]);
    if (comp.metodo !== 'correo_institucional') {
      expect((await auth(api().post(`${base}/comprobaciones/canal_independiente`), revisorB.token)
        .send({ resultado: 'confirmado', referencia: 'Oficio 2026-0042 por correo oficial' })).status).toBe(200);
    }
    const [[entidad]] = await pool.query(
      `SELECT vc.resultado, s.ref FROM verificacion_comprobaciones vc JOIN solicitudes_verificacion s ON s.id = vc.solicitud_id
       WHERE s.cliente_id = ? AND vc.componente = 'entidad' ORDER BY s.id DESC LIMIT 1`, [clienteId]);
    if (entidad.resultado !== 'confirmado') {
      const n8n = await responderN8n(entidad.ref, 'confirmado');
      expect(n8n.status).toBe(200);
    }
    const decision = await auth(api().post(`${base}/decision`), revisorA.token).send({ decision: 'aprobar' });
    expect(decision.status).toBe(200);
    return decision.body;
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

  async function checkout(token, items, extra = {}, clave) {
    return auth(api().post('/api/checkout'), token)
      .set('Idempotency-Key', clave || `int-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)
      .send({
        items,
        direccionEntrega: 'Calle 26 # 50-10, Bogotá',
        datosComprador: { tipo: 'empresa', razonSocial: 'Entidad de prueba', nit: '800197268-4' },
        metodo: 'mock',
        ...extra
      });
  }

  return {
    api, auth, login, loginStaff, subirDocumento, registrar, prepararYEnviar,
    responderN8n, aprobarConDobleComprobacion, crearProducto, checkout
  };
}

async function reiniciarBase(pool, migrar) {
  const [tablas] = await pool.query('SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const { t } of tablas) await pool.query(`DROP TABLE IF EXISTS \`${t}\``);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  await migrar();
}

module.exports = {
  TEST_DB, SECRETO_RESPUESTAS_N8N, PDF_VALIDO, configurarEntorno, datosRegistro, datosOrganizacion,
  crearCliente, reiniciarBase
};
