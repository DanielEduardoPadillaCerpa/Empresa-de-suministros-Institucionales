# Gestión de dependencias

| Campo | Valor |
|---|---|
| ID documental | DOC-07-05 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Inventariar las dependencias de terceros, su estado de seguridad y la política propuesta para mantenerlas.

## Alcance

Paquetes npm de `backend/package.json`, librerías por CDN del frontend e imagen Docker de n8n. Detalle técnico de versiones en [../04_DESARROLLO/07_DEPENDENCIAS_Y_VERSIONES.md](../04_DESARROLLO/07_DEPENDENCIAS_Y_VERSIONES.md).

## 1. Inventario [OBS] (`npm ls --depth=0`, 2026-10-16)

| Paquete | Rango declarado | Instalada | Uso |
|---|---|---|---|
| bcrypt | ^6.0.0 | 6.0.0 | Hash de contraseñas nativo (`seguridad/contrasenas.js`) |
| bcryptjs | ^2.4.3 | 2.4.3 | Respaldo de bcrypt y admin inicial (`db.js`) |
| cors | ^2.8.5 | 2.8.6 | CORS (`app.js`) |
| dotenv | ^16.4.5 | 16.6.1 | Carga de `.env` |
| express | ^4.19.2 | 4.22.3 | Servidor HTTP |
| express-rate-limit | ^7.5.1 | 7.5.1 | Limitación por IP |
| jsonwebtoken | ^9.0.2 | 9.0.3 | JWT HS256 |
| mysql2 | ^3.11.0 | 3.24.2 | Cliente MySQL |
| nodemailer | ^6.9.16 | 6.10.1 | Correo SMTP |
| pdfkit | ^0.17.2 | 0.17.2 | PDF de comprobantes |
| zod | ^4.6.5 | 4.6.5 | Validación de esquemas |
| jest (dev) | ^30.5.2 | 30.5.2 | Pruebas |
| jest-environment-jsdom (dev) | ^30.5.2 | 30.5.2 | Pruebas de DOM |
| supertest (dev) | ^7.3.1 | 7.3.1 | Pruebas HTTP |

Externas: Bootstrap 5.3.3 y Chart.js 4.4.4 por `cdn.jsdelivr.net` con versión exacta [OBS en HTML]; imagen `n8nio/n8n:1.110.1` (`n8n/docker-compose.yml`). Node.js probado: v24.19.0.

**[OBS]** Existe `package-lock.json` en `backend/` y otro mínimo (105 bytes) en la raíz sin `package.json` asociado [INF: residual].

## 2. Estado de seguridad

`npm audit --omit=dev` ejecutado el 2026-10-16 [OBS]:

- **1 vulnerabilidad alta: `nodemailer` ≤ 10.0.5** (instalada 6.10.1). Avisos incluidos: inyección de comandos SMTP y de cabeceras por CRLF, entrega a dominios no previstos por análisis de direcciones, DoS en `addressparser`, omisión de `disableFileAccess/disableUrlAccess`, validación TLS en OAuth2, entre otros.
- Corrección propuesta por npm: `nodemailer@10.1.2` (**cambio mayor**). Registrado como BUG-006 / RSK-005; conocido desde 2026-10-13 (`docs/RESULTADOS_PRUEBAS.md`).

Exposición en este sistema [INF]: el backend usa transporte SMTP con destinatarios provenientes de la base (correos registrados) y no usa `jsonTransport` ni OAuth2 [OBS `seguridad/correo.js`], lo que reduce pero no elimina el riesgo.

## 3. Plan para nodemailer v10 [REC]

1. Rama `chore/nodemailer-v10`.
2. Revisar notas de cambios mayores de nodemailer 7–10 (opciones de `createTransport`, `connectionTimeout`, `greetingTimeout`).
3. `npm install nodemailer@^10.1.2` en `backend/`.
4. `npm test` — las pruebas `receiptEmail.test.js` y `mi-cuenta.spec.js` sustituyen `nodemailer.createTransport`; confirmar que siguen pasando.
5. Prueba manual con Mailpit (`SMTP_HOST=localhost`, puerto 1025): código MFA, aviso de aprobación y comprobante.
6. `npm audit --omit=dev` sin hallazgos altos.
7. Registrar en `00_GESTION_DEL_PROYECTO/08_REGISTRO_DE_CAMBIOS.md`.

## 4. bcrypt y bcryptjs (BUG-017)

**[OBS]** `seguridad/contrasenas.js` intenta `bcrypt` (nativo) y cae a `bcryptjs`; `db.js` usa `bcryptjs` directamente para el administrador inicial. Los hashes son compatibles. **[REC]** Unificar en `seguridad/contrasenas.js` para que el costo (`BCRYPT_COST`) sea uno solo; hoy el admin inicial usa costo 10 fijo.

## 5. Política propuesta [REC]

| Aspecto | Propuesta |
|---|---|
| Frecuencia de revisión | Mensual (MNT-01) y antes de cada liberación |
| Instalación reproducible | `npm ci` con `package-lock.json` versionado |
| Rangos | Mantener `^` para menores; actualizar mayores en rama propia con pruebas |
| CDN | Mantener versiones exactas; añadir atributos `integrity` (SRI) y `crossorigin` [REC] |
| n8n | Fijar versión exacta; actualizar con respaldo del volumen y sin cambiar `N8N_ENCRYPTION_KEY` |
| Node.js | Usar una versión LTS; documentar la versión exacta del servidor |
| Nuevas dependencias | Justificar, revisar licencia y mantenimiento; costo cero (REQ-NF-018) |

## Referencias

- [04_PROCEDIMIENTO_DE_ACTUALIZACION.md](04_PROCEDIMIENTO_DE_ACTUALIZACION.md)
- [07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md](07_REGISTRO_DE_PROBLEMAS_CONOCIDOS.md)
- [../backend/package.json](../backend/package.json)
- [../n8n/docker-compose.yml](../n8n/docker-compose.yml)
