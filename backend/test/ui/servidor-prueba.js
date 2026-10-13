// Uso (desde backend/): node test/ui/servidor-prueba.js
// Servidor de prueba: backend real contra MySQL de Docker + receptor MFA local.
// Nunca usa backend/.env (dotenv no sobrescribe variables ya definidas).
const http = require('http');
const path = require('path');
const fs = require('fs');
const CODIGOS = path.join(require('os').tmpdir(), 'suministros-codigos-mfa.json');
fs.writeFileSync(CODIGOS, '{}');
Object.assign(process.env, {
  DB_HOST: '127.0.0.1', DB_PORT: '3307', DB_USER: 'test', DB_PASSWORD: 'test_pw', DB_NAME: 'suministros_ui_test',
  PORT: '8091', NODE_ENV: 'development', JWT_SECRET: 'ui-test-jwt-secret-with-enough-length-000',
  CRYPTO_KEY: 'ui-test-crypto-key-32-characters', MFA_TOKEN_PEPPER: 'ui-test-mfa-pepper-with-at-least-32-chars',
  CRYPTO_KEYS: 'ui1:' + Buffer.alloc(32, 7).toString('base64'), CRYPTO_KEY_ACTIVA: 'ui1',
  IDENT_HMAC_KEY: Buffer.alloc(32, 9).toString('base64'),
  ADMIN_EMAIL: 'admin@prueba.test', ADMIN_PASSWORD: 'AdminPrueba2026!', PAYMENT_MODE: 'mock',
  PAYMENT_WEBHOOK_SECRET: 'ui-test-payment-webhook-secret-0123456789',
  N8N_MFA_WEBHOOK_URL: 'http://127.0.0.1:8099/mfa', N8N_MFA_WEBHOOK_SECRET: 'ui-test-mfa-webhook-secret-at-least-32-chars',
  CORS_ORIGINS: 'http://localhost:8091', TRUST_PROXY_HOPS: '0',
  DOCUMENTOS_DIR: path.join(require('os').tmpdir(), 'suministros-docs-ui-test')
});
// Cualquier otra variable del .env real queda vacía: dotenv no sobrescribe
// variables ya definidas, así que ningún webhook, SMTP ni base real se usa.
const rutaEnv = path.join(__dirname, '..', '..', '.env');
const envReal = fs.existsSync(rutaEnv) ? fs.readFileSync(rutaEnv, 'utf8') : '';
for (const linea of envReal.split(/\r?\n/)) {
  const nombre = (/^\s*([A-Z0-9_]+)\s*=/.exec(linea) || [])[1];
  if (nombre && process.env[nombre] === undefined) process.env[nombre] = '';
}
http.createServer((req, res) => {
  let cuerpo = '';
  req.on('data', d => { cuerpo += d; }).on('end', () => {
    try {
      const datos = JSON.parse(cuerpo);
      const codigos = JSON.parse(fs.readFileSync(CODIGOS, 'utf8'));
      codigos[datos.email || datos.correo] = datos.token_mfa || datos.codigo;
      fs.writeFileSync(CODIGOS, JSON.stringify(codigos));
    } catch { /* ignorar */ }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
  });
}).listen(8099, () => require(path.join(__dirname, '..', '..', 'server.js')));
