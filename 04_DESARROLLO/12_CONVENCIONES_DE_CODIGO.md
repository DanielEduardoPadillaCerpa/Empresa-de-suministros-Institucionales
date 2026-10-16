# Convenciones de código

| Campo | Valor |
|---|---|
| ID documental | DOC-04-12 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Recoger las convenciones que el código **ya sigue** para que los cambios nuevos se lean igual que el código existente.

## Alcance

**[OBS]** Convenciones observadas por lectura de `backend/src`, `backend/test`, `frontend` y `n8n`. No hay linter ni formateador configurado; nada de esto se valida automáticamente. Las propuestas se marcan **[REC]**.

## 1. Idioma y nombres

| Elemento | Convención observada | Ejemplos |
|---|---|---|
| Identificadores JS | Español, `camelCase` | `requiereAutenticacion`, `obtenerContexto`, `evaluarProducto`, `enviarCorreoEnSegundoPlano` |
| Constantes | `MAYUSCULAS_CON_GUION_BAJO` | `MFA_CODIGO_VIGENCIA_MINUTOS`, `PERMISOS_STAFF` |
| Archivos backend | `camelCase.js` (algunos en inglés heredados: `paymentJobs.js`, `emailOutbox.js`, `receiptTokens.js`) | `registroInstitucional.js` |
| Archivos frontend | `kebab-case.html/.js` | `mi-verificacion.html`, `checkout-autofill.js` |
| Tablas y columnas | Español, `snake_case`, plural | `solicitudes_registro.resultado_verificacion` |
| Migraciones | `NNN_descripcion.js` con `version`, `descripcion`, `up`, `down` | `003_registro_verificado.js` |
| Comentarios | Español, explican el porqué (seguridad, rendimiento) | cabeceras de `padron.js`, `captcha.js` |
| Mensajes al usuario | Español, genéricos ante errores de seguridad | `'Correo o contraseña incorrectos'` |

## 2. Estilo JavaScript (backend)

- CommonJS (`require`/`module.exports`), `'use strict'` no se usa.
- Indentación de 2 espacios, comillas simples, punto y coma.
- `async/await` con `try/catch` por manejador; transacciones con `pool.getConnection()` → `beginTransaction` → `commit`/`rollback` → `release` en `finally`.
- Cada router en `src/routes/<nombre>.js` exporta `router` (o `{ router, … }` cuando comparte funciones, como `auth.js`, `asistente.js`, `pagos.js`) y se monta en `src/app.js`.
- Validación de entrada: `zod` con `.strict()` (rechaza campos no previstos) o expresiones regulares explícitas (`/^[a-f0-9]{64}$/`, `/^\d{6}$/`).
- Middleware en cadena: `requiereAutenticacion, requiereAdmin, requierePermiso('x')`.

## 3. SQL y datos

- Siempre consultas parametrizadas con `?`; los nombres de tabla/columna interpolados provienen de listas fijas del código (migraciones).
- `FOR UPDATE` en lecturas que preceden una escritura dependiente (checkout, MFA, expiración).
- Datos personales se cifran antes de guardarse (`cifrarCampo`/`cifrar`) y se buscan por índice ciego, nunca en claro.
- Fechas comparadas con `NOW()` de MySQL (no con la hora de Node) para evitar desfases de zona horaria (defecto corregido 2026-10-13).

## 4. Errores, registros y seguridad

- Respuestas de error `{ error: '<mensaje>' }` y, cuando el cliente debe reaccionar, `{ code: 'MAYUSCULAS', error }` (`CUENTA_PENDIENTE`, `RATE_LIMITED`, `REQUIERE_AUTORIZACION_COMPRA`).
- Los logs registran **códigos**, no datos: `console.error('[modulo] Mensaje:', err.code || 'X_FAILED')`. Prefijo entre corchetes por módulo (`[auth]`, `[db]`, `[n8n]`).
- Nunca registrar contraseñas, códigos, tokens ni documentos (REQ-NF-009).
- Comparaciones de secretos en tiempo constante (`crypto.timingSafeEqual`).
- `Cache-Control: no-store` en respuestas con datos personales o retos.

## 5. Frontend

- HTML estático con Bootstrap; JS sin framework cargado por `<script>`; `js/auth.js` define `API_BASE` y se carga antes que el resto.
- Traducciones mediante atributos `data-i18n` y `js/i18n.js` (cobertura incompleta, BUG-016).
- Escape de datos dinámicos antes de insertarlos en el DOM en las páginas nuevas (según `../docs/MODELO_AMENAZAS.md`).

## 6. Pruebas

- `*.spec.js` → Jest (`testMatch` en `package.json`); `*.test.js` → `node:test` con `node:assert/strict`.
- La base de datos se sustituye inyectando un módulo simulado en `require.cache` de `src/db.js`; `nodemailer.createTransport` se reemplaza por un captador.
- Las pruebas de integración se llaman `*.int.spec.js` y se niegan a correr contra bases no locales.

## 7. Git

- Mensajes de commit en español, en imperativo o descriptivos (`Registro verificado con aprobación del admin…`); algunos commits antiguos siguen Conventional Commits (`feat:`, `style:`, `refactor:`). Ver [13_GESTION_DE_VERSIONES_GIT.md](13_GESTION_DE_VERSIONES_GIT.md).

## 8. Recomendaciones

- **[REC]** Añadir ESLint + Prettier con la configuración que reproduzca este estilo y ejecutarlos en CI.
- **[REC]** Declarar `engines.node` en `package.json`.
- **[REC]** Unificar idioma de nombres de archivo nuevos (español) sin renombrar los existentes salvo refactorización planificada.

## Referencias

- [03_MODULOS_Y_RESPONSABILIDADES.md](03_MODULOS_Y_RESPONSABILIDADES.md) · [../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md)
