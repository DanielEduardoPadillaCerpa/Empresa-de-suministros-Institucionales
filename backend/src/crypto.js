const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

// ---------------------------------------------------------------------------
// Claves
// ---------------------------------------------------------------------------
// Formato heredado: CRYPTO_KEY es un texto que se rellena o recorta a 32 bytes.
// Se conserva solo para leer (y, si no hay anillo configurado, escribir) los
// datos existentes.
//
// Formato v2: CRYPTO_KEYS="k1:<base64 de 32 bytes>,k2:<...>" y CRYPTO_KEY_ACTIVA=k2.
// Cada valor cifrado lleva el identificador de la clave, de modo que rotar
// consiste en agregar una clave nueva, marcarla activa y recifrar en segundo
// plano; las anteriores siguen descifrando hasta retirarlas.

function claveHeredada() {
  const raw = process.env.CRYPTO_KEY || '';
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32), 'utf8');
}

let cacheAnillo = null;
function anilloClaves() {
  const fuente = `${process.env.CRYPTO_KEYS || ''}|${process.env.CRYPTO_KEY_ACTIVA || ''}`;
  if (cacheAnillo && cacheAnillo.fuente === fuente) return cacheAnillo;
  const claves = new Map();
  for (const entrada of String(process.env.CRYPTO_KEYS || '').split(',').map(s => s.trim()).filter(Boolean)) {
    const separador = entrada.indexOf(':');
    const id = entrada.slice(0, separador);
    const clave = Buffer.from(entrada.slice(separador + 1), 'base64');
    if (separador < 1 || !/^[a-z0-9]{1,16}$/i.test(id) || clave.length !== 32) {
      throw Object.assign(new Error('CRYPTO_KEYS tiene una entrada inválida (se espera id:base64 de 32 bytes).'), { code: 'CRYPTO_KEYS_INVALID' });
    }
    claves.set(id, clave);
  }
  const activa = process.env.CRYPTO_KEY_ACTIVA || (claves.size ? [...claves.keys()].pop() : null);
  if (claves.size && !claves.has(activa)) {
    throw Object.assign(new Error('CRYPTO_KEY_ACTIVA no corresponde a ninguna clave de CRYPTO_KEYS.'), { code: 'CRYPTO_KEYS_INVALID' });
  }
  cacheAnillo = { fuente, claves, activa: claves.size ? activa : null };
  return cacheAnillo;
}

function anilloConfigurado() {
  try {
    return Boolean(anilloClaves().activa);
  } catch {
    return false;
  }
}

function errorDescifrado() {
  return Object.assign(new Error('DECRYPT_FAILED'), { code: 'DECRYPT_FAILED' });
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------
function cifrar(textoPlano) {
  if (textoPlano === null || textoPlano === undefined || textoPlano === '') return textoPlano;
  const { claves, activa } = anilloClaves();
  const iv = crypto.randomBytes(12);
  const clave = activa ? claves.get(activa) : claveHeredada();
  const cipher = crypto.createCipheriv(ALGORITMO, clave, iv);
  const cifrado = Buffer.concat([cipher.update(String(textoPlano), 'utf8'), cipher.final()]);
  const empaquetado = Buffer.concat([iv, cipher.getAuthTag(), cifrado]).toString('base64');
  return activa ? `v2:${activa}:${empaquetado}` : empaquetado;
}

function descifrarConClave(datos, clave) {
  const decipher = crypto.createDecipheriv(ALGORITMO, clave, datos.subarray(0, 12));
  decipher.setAuthTag(datos.subarray(12, 28));
  return Buffer.concat([decipher.update(datos.subarray(28)), decipher.final()]).toString('utf8');
}

function descifrar(valorCifrado) {
  if (!valorCifrado) return valorCifrado;
  const texto = String(valorCifrado);
  if (texto.startsWith('v2:')) {
    // Formato versionado: un fallo indica clave ausente o dato alterado y
    // nunca se devuelve el valor cifrado como si fuera texto.
    const [, id, carga] = texto.split(':');
    const clave = anilloClaves().claves.get(id);
    if (!clave || !carga) throw errorDescifrado();
    try {
      return descifrarConClave(Buffer.from(carga, 'base64'), clave);
    } catch {
      throw errorDescifrado();
    }
  }
  try {
    return descifrarConClave(Buffer.from(texto, 'base64'), claveHeredada());
  } catch {
    // Formato heredado: valores sin cifrar de datos de prueba antiguos.
    return valorCifrado;
  }
}

// Variante estricta para datos nuevos que siempre deben existir cifrados
// (identificadores personales): exige el anillo v2 y nunca cae al formato heredado.
function cifrarEstricto(textoPlano) {
  if (!anilloConfigurado()) {
    throw Object.assign(new Error('CRYPTO_KEYS no está configurado.'), { code: 'CRYPTO_NOT_CONFIGURED' });
  }
  return cifrar(textoPlano);
}

function descifrarEstricto(valor) {
  if (typeof valor !== 'string' || !valor.startsWith('v2:')) throw errorDescifrado();
  return descifrar(valor);
}

// ---------------------------------------------------------------------------
// Binario (documentos de verificación)
// ---------------------------------------------------------------------------
// v2: "SIK2" | len(id) | id | iv(12) | tag(16) | contenido
// heredado: iv(12) | tag(16) | contenido
const MAGIA_V2 = Buffer.from('SIK2');

function cifrarBuffer(buffer) {
  const { claves, activa } = anilloClaves();
  const iv = crypto.randomBytes(12);
  const clave = activa ? claves.get(activa) : claveHeredada();
  const cipher = crypto.createCipheriv(ALGORITMO, clave, iv);
  const cifrado = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const cuerpo = Buffer.concat([iv, cipher.getAuthTag(), cifrado]);
  if (!activa) return cuerpo;
  const id = Buffer.from(activa, 'utf8');
  return Buffer.concat([MAGIA_V2, Buffer.from([id.length]), id, cuerpo]);
}

function descifrarBufferConClave(datos, clave) {
  const decipher = crypto.createDecipheriv(ALGORITMO, clave, datos.subarray(0, 12));
  decipher.setAuthTag(datos.subarray(12, 28));
  return Buffer.concat([decipher.update(datos.subarray(28)), decipher.final()]);
}

function descifrarBuffer(datos) {
  if (datos.length > 5 && datos.subarray(0, 4).equals(MAGIA_V2)) {
    const largo = datos[4];
    const id = datos.subarray(5, 5 + largo).toString('utf8');
    const clave = anilloClaves().claves.get(id);
    if (!clave) throw errorDescifrado();
    return descifrarBufferConClave(datos.subarray(5 + largo), clave);
  }
  return descifrarBufferConClave(datos, claveHeredada());
}

// ---------------------------------------------------------------------------
// Índice de búsqueda de identificadores (HMAC con clave independiente)
// ---------------------------------------------------------------------------
// Un SHA-256 simple de una cédula se invierte por enumeración (el espacio es de
// ~10^10). El HMAC con una clave que no está en MySQL impide esa enumeración a
// quien solo obtenga la base de datos. La clave es distinta de la de cifrado
// para que comprometer una no comprometa la otra.
function claveIndice() {
  const clave = Buffer.from(process.env.IDENT_HMAC_KEY || '', 'base64');
  if (clave.length < 32) {
    throw Object.assign(new Error('IDENT_HMAC_KEY no está configurada.'), { code: 'IDENT_HMAC_NOT_CONFIGURED' });
  }
  return clave;
}

function indiceIdentificador(tipo, numeroNormalizado) {
  return crypto.createHmac('sha256', claveIndice()).update(`${tipo}:${numeroNormalizado}`).digest('hex');
}

function proteccionIdentificadoresDisponible() {
  try {
    claveIndice();
    return anilloConfigurado();
  } catch {
    return false;
  }
}

module.exports = {
  cifrar,
  descifrar,
  cifrarEstricto,
  descifrarEstricto,
  cifrarBuffer,
  descifrarBuffer,
  indiceIdentificador,
  anilloConfigurado,
  proteccionIdentificadoresDisponible
};
