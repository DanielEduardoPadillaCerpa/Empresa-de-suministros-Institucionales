const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';

function obtenerClave() {
  const raw = process.env.CRYPTO_KEY || '';
  // Normaliza a exactamente 32 bytes (recorta o rellena)
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32), 'utf8');
}

function cifrar(textoPlano) {
  if (textoPlano === null || textoPlano === undefined || textoPlano === '') return textoPlano;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(String(textoPlano), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, cifrado]).toString('base64');
}

function descifrar(valorCifrado) {
  if (!valorCifrado) return valorCifrado;
  try {
    const datos = Buffer.from(valorCifrado, 'base64');
    const iv = datos.subarray(0, 12);
    const tag = datos.subarray(12, 28);
    const cifrado = datos.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8');
  } catch {
    // Si el valor no está cifrado (ej. datos de prueba viejos), lo devuelve tal cual
    return valorCifrado;
  }
}

// Variante binaria para documentos de verificación: mismo algoritmo y clave,
// formato iv(12) | tag(16) | contenido. A diferencia de descifrar(), si el
// contenido fue alterado lanza error en vez de devolverlo tal cual.
function cifrarBuffer(buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), cifrado]);
}

function descifrarBuffer(datos) {
  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), datos.subarray(0, 12));
  decipher.setAuthTag(datos.subarray(12, 28));
  return Buffer.concat([decipher.update(datos.subarray(28)), decipher.final()]);
}

module.exports = { cifrar, descifrar, cifrarBuffer, descifrarBuffer };
