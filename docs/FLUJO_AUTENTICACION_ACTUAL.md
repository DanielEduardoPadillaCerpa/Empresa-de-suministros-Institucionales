# Flujo de autenticación actual

Inspeccionado el 2026-10-13 en `backend/src/routes/auth.js`, `src/mfaCodes.js`, `src/mfaCourier.js` y `frontend/js/auth.js`.

## Registro (`POST /api/auth/registro`)

- Límite de 10 registros por IP y hora.
- Esquema estricto por tipo de institución (`registroInstitucional.js`): campos desconocidos, `rol`, `clienteId` o autorizaciones hacen fallar la validación.
- Contraseña bcrypt (coste 12), 10 a 72 caracteres.
- Crea `clientes` (datos personales cifrados) y `usuarios` (`rol = 'cliente'`) en una transacción. El estado inicial es `borrador`.
- No inicia sesión: el usuario debe hacer login (que exige MFA).

## Login (`POST /api/auth/login` → `POST /api/auth/mfa/verificar`)

1. Correo y contraseña. Respuesta genérica ante error, con límite de 10 intentos por IP cada 15 min.
2. Crea un reto MFA: código de 6 dígitos, se guarda como HMAC con *pepper* (`MFA_TOKEN_PEPPER`), vence en 5 min, admite 5 intentos y como máximo 5 retos cada 15 min por usuario.
3. El código se envía por n8n (W5). Si la entrega no se confirma, el reto sigue vivo y el usuario puede reenviar.
4. Con el código correcto se emite:
   - **access token** JWT (2 h) con `uid`, `correo`, `rol`, `clienteId`, `sv` (versión de sesión) y `mfa: true`;
   - **refresh token** aleatorio (se guarda solo su SHA-256), rotativo, 7 días.
5. El primer MFA correcto marca `usuarios.correo_verificado_en`.

## Validación en cada petición (`requiereAutenticacion`)

- Firma JWT, `mfa === true`, `uid` y `sv` válidos.
- `session_version` se compara contra MySQL: suspender o cerrar todas las sesiones incrementa la versión y revoca los refresh tokens.
- `requiereAdmin` se basa en el `rol` del token. Las rutas nuevas usan `requierePermiso()`, que lee los permisos en MySQL.

## Almacenamiento en el navegador

- `localStorage['si_auth']`: access token, refresh token y datos de sesión. Es vulnerable a robo por XSS (pendiente: cookie `HttpOnly`).

## Defectos encontrados

| # | Severidad | Defecto |
|---|---|---|
| F1 | Alta | `JWT_SECRET` tiene un valor por defecto en el código (`'cambia-este-secreto'`) y el arranque no valida su fortaleza. |
| F2 | Media | `requiereAdmin` confía en el rol del token; las rutas heredadas (productos, categorías, pedidos, clientes, auditoría) no usan permisos diferenciados. |
| F3 | Media | No existe forma de exigir el cambio de una contraseña inicial (admin sembrado desde variables). |
| F4 | Baja | Tokens en `localStorage` (riesgo XSS). Ya figuraba como pendiente. |

F1–F3 se corrigen en este trabajo; F4 sigue pendiente (ver `CHANGELOG.md`).
