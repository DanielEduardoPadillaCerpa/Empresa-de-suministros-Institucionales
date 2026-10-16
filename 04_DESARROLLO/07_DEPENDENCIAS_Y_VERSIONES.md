# Dependencias y versiones

| Campo | Valor |
|---|---|
| ID documental | DOC-04-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar las dependencias declaradas, las versiones realmente instaladas y su estado de seguridad.

## Alcance

`../backend/package.json`, salida de `npm ls --depth=0` y `npm audit --omit=dev` ejecutados el 2026-10-16 (solo lectura; no se instaló ni actualizó nada), librerías de frontend por CDN e imagen de n8n.

## 1. Backend — dependencias de producción

| Paquete | Declarada | Instalada | Uso en el código | Observaciones |
|---|---|---|---|---|
| express | ^4.19.2 | 4.22.3 | Servidor HTTP (`src/app.js`) | — |
| cors | ^2.8.5 | 2.8.6 | CORS con lista de orígenes | — |
| dotenv | ^16.4.5 | 16.6.1 | Carga `backend/.env` (`server.js`) | — |
| mysql2 | ^3.11.0 | 3.24.2 | Pools y consultas parametrizadas (`src/db.js`, `seguridad/padron.js`) | `multipleStatements` solo en el pool de lotes |
| jsonwebtoken | ^9.0.2 | 9.0.3 | JWT HS256 | — |
| bcrypt | ^6.0.0 | 6.0.0 | Hash de contraseñas (nativo) | Requiere compilación/binario |
| bcryptjs | ^2.4.3 | 2.4.3 | Respaldo de bcrypt y admin inicial (`db.js`) | Duplicidad (BUG-017) |
| express-rate-limit | ^7.5.1 | 7.5.1 | Limitadores por IP | Memoria del proceso (BUG-010) |
| nodemailer | ^6.9.16 | 6.10.1 | Envío SMTP (`seguridad/correo.js`) | **Vulnerabilidad alta** (BUG-006) |
| pdfkit | ^0.17.2 | 0.17.2 | PDF del comprobante | — |
| zod | ^4.6.5 | 4.6.5 | Validación de esquemas | — |

## 2. Backend — dependencias de desarrollo

| Paquete | Declarada | Instalada | Uso |
|---|---|---|---|
| jest | ^30.5.2 | 30.5.2 | Suites `*.spec.js` |
| jest-environment-jsdom | ^30.5.2 | 30.5.2 | Pruebas de widget/DOM |
| supertest | ^7.3.1 | 7.3.1 | Pruebas HTTP sobre `crearApp()` |

**[OBS]** También se usa el ejecutor nativo `node:test` (sin dependencia). Configuración Jest en `package.json` (`testMatch` de 4 archivos).

## 3. Frontend (CDN, sin gestor de paquetes)

| Librería | Versión | Origen | Páginas |
|---|---|---|---|
| Bootstrap (bundle JS + CSS) | 5.3.3 | cdn.jsdelivr.net | Casi todas |
| Chart.js | 4.4.4 | cdn.jsdelivr.net | `admin-dashboard.html`, `reportes.html` |

**[OBS]** Las 20 páginas cargan recursos de cdn.jsdelivr.net y ninguna usa el atributo `integrity` (SRI). **[REC]** Añadir `integrity` + `crossorigin` o servir las librerías localmente.

## 4. Infraestructura

| Componente | Versión | Evidencia |
|---|---|---|
| Node.js | Probado 24.19.0; README pide ≥18 | ejecución 2026-10-16 |
| MySQL | 8.0 (pruebas históricas) | `../docs/RESULTADOS_PRUEBAS.md` |
| n8n | `n8nio/n8n:1.110.1` | `../n8n/docker-compose.yml` |
| Ollama (opcional) | NO DETERMINADO | `OLLAMA_URL`, `OLLAMA_MODEL` |

## 5. Auditoría de seguridad (`npm audit --omit=dev`, 2026-10-16)

**[OBS]** 1 vulnerabilidad de severidad **alta**: `nodemailer <=10.0.5` (instalada 6.10.1). Avisos incluidos: inyección de comandos SMTP (`envelope.size`, CRLF en `name`), inyección de cabeceras `List-*`, entrega a dominio no previsto (punycode, comentarios RFC 5322, conflicto de interpretación), DoS en `addressparser`, lectura de archivos/SSRF por `raw`/`resolveContent`, reutilización de `servername` TLS en caché DNS y validación TLS en OAuth2. Corrección propuesta por npm: `nodemailer@10.1.2` (**cambio mayor**, `npm audit fix --force`).

- **[INF]** El código solo usa `createTransport` + `sendMail` con destinatarios propios y textos fijos; el riesgo real depende de que ningún dato del usuario llegue a cabeceras o direcciones sin validar (los correos de usuario se validan con zod/regex).
- **[REC]** Actualizar a 10.x en una rama dedicada, revisar cambios de API y repetir `receiptEmail.test.js`, `mi-cuenta.spec.js` y `registro-verificado.test.js` más una prueba SMTP manual con Mailpit. Ver [../07_MANTENIMIENTO_Y_SOPORTE/05_GESTION_DE_DEPENDENCIAS.md](../07_MANTENIMIENTO_Y_SOPORTE/05_GESTION_DE_DEPENDENCIAS.md).

## 6. Observaciones

- **[OBS]** `../package-lock.json` en la raíz no tiene dependencias ni `package.json` asociado.
- **[OBS]** No existe `engines` en `package.json`. **[REC]** declarar la versión de Node soportada.

## Referencias

- [05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md](05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md)
- [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)
