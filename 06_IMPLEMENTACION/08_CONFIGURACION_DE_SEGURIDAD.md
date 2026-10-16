# Configuración de seguridad

| Campo | Valor |
|---|---|
| ID documental | DOC-06-08 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Reunir los ajustes de seguridad que deben configurarse al instalar y operar el sistema. El diseño de los controles está en [../03_DISENO/10_DISENO_DE_SEGURIDAD.md](../03_DISENO/10_DISENO_DE_SEGURIDAD.md).

## Alcance

Secretos y claves, red/proxy, CORS, cabeceras, cuentas privilegiadas, correo y n8n. No contiene ningún valor secreto.

## 1. Secretos y claves

| Secreto | Uso | Si se pierde | Si se filtra | Rotación |
|---|---|---|---|---|
| `ENC_KEY` (+ `ENC_KEY_V<n>`) | Cifrado del padrón y solicitudes de registro | Datos irrecuperables (RSK-001) | Descifrado de NIT/nombres | Nueva clave + `ENC_KEY_VERSION` + conservar la anterior en `ENC_KEY_V<n>` |
| `HMAC_KEY` | Índices ciegos del NIT | Hay que recalcular índices | Enumeración por fuerza bruta | Requiere recalcular `nit_hash` (no hay script) |
| `CRYPTO_KEY` (heredada) | Datos personales antiguos y documentos | Irrecuperables | Descifrado | Pendiente script de recifrado (BUG-013) |
| `CRYPTO_KEYS`/`CRYPTO_KEY_ACTIVA` | Cifrado v2 (identificadores, documentos nuevos) | Irrecuperables | Descifrado | Añadir `k2`, activarla, conservar `k1` |
| `IDENT_HMAC_KEY` | Índice del documento de identidad | Índice inválido | Enumeración | No rotar sin recalcular |
| `JWT_SECRET` | Firma de sesiones | Se cierran sesiones | Suplantación | Rotar = cierre global de sesiones |
| `MFA_TOKEN_PEPPER` | HMAC de códigos | Códigos en curso inválidos | Facilita ataques a códigos | Rotar en ventana |
| `PAYMENT_WEBHOOK_SECRET`, `RECEIPT_LINK_SECRET`, `N8N_*` | Firmas e integraciones | Integración falla | Falsificación de eventos | Rotar en ambos extremos |

Procedimiento [REC]:
1. Generar con `npm run claves:generar` o `crypto.randomBytes`.
2. Guardar en un gestor de secretos del entorno y una copia cifrada fuera del servidor (al menos de `ENC_KEY`, `CRYPTO_KEYS`, `HMAC_KEY`, `IDENT_HMAC_KEY`).
3. **Rotar antes de producción**: los secretos legibles detectados en auditorías previas y la contraseña de la base del padrón compartida en texto (RSK-002).
4. Nunca en el repositorio, en la base, en n8n (salvo los secretos propios de cada workflow), en el frontend ni en capturas.

## 2. Red, proxy y transporte

- **HTTPS: PENDIENTE** (REQ-NF-016, BUG-012). El laboratorio no tiene TLS; el código no activa HSTS ni `upgrade-insecure-requests` a propósito.
- Detrás de un proxy: `TRUST_PROXY_HOPS` = número de saltos (p. ej. 1) para que los limitadores por IP vean la IP real. Un valor mayor del real permite falsificar la IP con `X-Forwarded-For` [INF].
- `CORS_ORIGINS`: lista exacta de orígenes del frontend (obligatoria en producción). Las solicitudes sin cabecera `Origin` se aceptan.
- Cabeceras ya aplicadas por `app.js`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy` (cámara, micrófono, ubicación desactivados). **[REC]** Añadir CSP y HSTS en el proxy cuando exista HTTPS.

## 3. Cuentas privilegiadas

- Administrador inicial: solo si `ADMIN_PASSWORD` ≥ 12; debe cambiar la contraseña al primer acceso. **[REC]** Borrar `ADMIN_PASSWORD` del `.env` después.
- Superadministrador: solo por comando ([12](12_MANUAL_TECNICO_Y_ADMINISTRATIVO.md)); no tiene `documentos.ver` ni `identificadores.ver` por defecto.
- Principio de mínimo privilegio con los 13 permisos de staff (RN-017).
- Revisar periódicamente `staff_permisos` y la auditoría.

## 4. Correo

`SMTP_HOST` obligatoria en producción; credenciales en el gestor de secretos; SPF/DKIM/DMARC. Actualizar `nodemailer` (BUG-006) tras probar los envíos.

## 5. n8n

Secretos distintos por workflow; `N8N_W11_CALLBACK_SECRET` distinto de `N8N_W11_SECRET`; no guardar ejecuciones; no activar workflows sin credenciales. Decidir sobre BUG-014.

## 6. Riesgos aceptados temporalmente (requieren aprobación formal)

| Riesgo | Control compensatorio actual |
|---|---|
| BUG-001 reportes sin autenticación | Ninguno; **[REC]** bloquear `/api/reportes` en el proxy hasta corregir |
| BUG-002 calificaciones sin límite | Ninguno |
| BUG-010 captcha/limitadores en memoria | Una sola instancia |
| BUG-011 tokens en localStorage | Escape de datos dinámicos en páginas nuevas |
| `/api/pagos/dev/simular-webhook` activo fuera de `NODE_ENV=production` | No usar datos reales en entornos no productivos |

## Referencias

- [../backend/src/configSegura.js](../backend/src/configSegura.js)
- [../backend/src/app.js](../backend/src/app.js)
- [../docs/MODELO_AMENAZAS.md](../docs/MODELO_AMENAZAS.md)
- [../docs/ARQUITECTURA_VERIFICACION.md](../docs/ARQUITECTURA_VERIFICACION.md)
