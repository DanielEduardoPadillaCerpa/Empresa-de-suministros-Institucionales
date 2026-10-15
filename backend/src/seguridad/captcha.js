const crypto = require('crypto');

// Captcha propio, sin servicios externos ni costo: una suma sencilla dibujada
// como SVG con ruido. Cada reto vale 5 minutos y se consume en el primer
// intento (acierte o no). Los retos viven en memoria del proceso, suficiente
// para el laboratorio (un solo proceso). En producción conviene un captcha
// gestionado (p. ej. Cloudflare Turnstile, que también es gratuito) o un
// almacén compartido si hay varias instancias.

const VIGENCIA_MS = 5 * 60 * 1000;
const MAXIMO_RETOS = 5000;
const retos = new Map();

function purgar(ahora = Date.now()) {
  for (const [id, reto] of retos) {
    if (reto.expira <= ahora) retos.delete(id);
  }
  // Si aún se excede (inundación), se descartan los más antiguos.
  while (retos.size >= MAXIMO_RETOS) retos.delete(retos.keys().next().value);
}

const azar = (min, max) => crypto.randomInt(min, max + 1);

function dibujar(texto) {
  const ancho = 170;
  const alto = 56;
  const partes = [];
  for (let i = 0; i < 6; i += 1) {
    partes.push(`<line x1="${azar(0, ancho)}" y1="${azar(0, alto)}" x2="${azar(0, ancho)}" y2="${azar(0, alto)}" stroke="hsl(${azar(190, 230)},40%,${azar(55, 75)}%)" stroke-width="${azar(1, 2)}"/>`);
  }
  for (let i = 0; i < 30; i += 1) {
    partes.push(`<circle cx="${azar(0, ancho)}" cy="${azar(0, alto)}" r="1" fill="hsl(${azar(180, 240)},30%,60%)"/>`);
  }
  let x = 14;
  for (const caracter of texto) {
    if (caracter === ' ') { x += 8; continue; }
    const y = azar(34, 42);
    const giro = azar(-22, 22);
    partes.push(`<text x="${x}" y="${y}" transform="rotate(${giro} ${x} ${y})" font-family="Verdana,Arial,sans-serif" font-size="${azar(24, 28)}" font-weight="700" fill="hsl(${azar(200, 225)},60%,${azar(18, 30)}%)">${caracter}</text>`);
    x += azar(17, 21);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><rect width="100%" height="100%" fill="#f1f5f9"/>${partes.join('')}</svg>`;
}

// Uso interno y en pruebas: devuelve también la respuesta. La ruta HTTP solo
// expone { id, svg }.
function crearReto() {
  purgar();
  const a = azar(2, 19);
  const b = azar(2, 9);
  const id = crypto.randomBytes(16).toString('hex');
  retos.set(id, { respuesta: String(a + b), expira: Date.now() + VIGENCIA_MS });
  return { id, svg: dibujar(`${a} + ${b} =`), respuesta: String(a + b) };
}

// true solo si el reto existe, no venció y la respuesta coincide. El reto se
// elimina en cualquier caso: no admite un segundo intento.
function verificarCaptcha(id, respuesta) {
  if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) return false;
  const reto = retos.get(id);
  if (!reto) return false;
  retos.delete(id);
  if (reto.expira <= Date.now()) return false;
  const dada = Buffer.from(String(respuesta ?? '').trim().slice(0, 4).padEnd(4, ' '));
  const esperada = Buffer.from(reto.respuesta.padEnd(4, ' '));
  return crypto.timingSafeEqual(dada, esperada);
}

module.exports = { crearReto, verificarCaptcha };
