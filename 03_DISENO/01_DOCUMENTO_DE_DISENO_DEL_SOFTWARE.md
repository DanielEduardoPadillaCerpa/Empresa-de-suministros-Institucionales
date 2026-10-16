# Documento de diseño del software (SDD)

| Campo | Valor |
|---|---|
| ID documental | DOC-03-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Documento rector del área de diseño. Describe, a partir del código existente, cómo está construida la plataforma de suministros institucionales ("Suite Institucional") y enlaza los documentos de detalle (arquitectura, componentes, despliegue, datos, API, interfaces, seguridad y decisiones).

## Alcance

Cubre el backend `backend/` (Node.js + Express), el frontend estático `frontend/`, la base MySQL y las automatizaciones `n8n/`. Describe la **arquitectura actual observada**; las propuestas se marcan **[REC]** y se agrupan en [02_ARQUITECTURA_ACTUAL.md §Arquitectura objetivo propuesta](02_ARQUITECTURA_ACTUAL.md) y [12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md).

## 1. Visión general del diseño

**[OBS]** Es una aplicación web monolítica: un único proceso Node.js (`backend/server.js`) construye la app Express (`backend/src/app.js`), monta 17 routers bajo `/api/*`, sirve el frontend HTML/Bootstrap como estáticos desde el mismo origen y arranca trabajos en segundo plano (colas de correo y de automatización, expiración de pedidos, mantenimiento de verificaciones, sincronización del padrón, refresco del índice del asistente). La persistencia es MySQL (`mysql2/promise`), con migraciones aplicadas al arrancar. n8n se usa solo para avisos y orquestación; las decisiones de negocio y de autorización residen en el backend.

## 2. Elementos de diseño (DIS)

| ID | Elemento | Descripción breve | Documento de detalle | Requerimientos |
|---|---|---|---|---|
| DIS-001 | Arquitectura monolítica Express (API + estáticos) | Un proceso, un origen, workers internos | [02](02_ARQUITECTURA_ACTUAL.md), [03](03_DIAGRAMA_DE_COMPONENTES.md) | Transversal |
| DIS-002 | Modelo de datos MySQL | 34 tablas InnoDB utf8mb4 | [05](05_DISENO_DE_BASE_DE_DATOS.md), [06](06_MODELO_ENTIDAD_RELACION.md), [07](07_DICCIONARIO_TECNICO_DE_DATOS.md) | REQ-F-001…004 |
| DIS-003 | API REST `/api/*` | JSON, Bearer JWT, códigos HTTP | [08](08_DISENO_DE_API.md) | REQ-F-001…004, 010–017, 023–026, 033–034 |
| DIS-004 | Autenticación JWT + refresh + MFA | Sesión de 2 h, refresh rotativo 7 días, código por correo | [10](10_DISENO_DE_SEGURIDAD.md) | REQ-F-005…013 |
| DIS-005 | Autorización central y permisos | `autorizacion.js`, `staff_permisos`, superadministrador | [10](10_DISENO_DE_SEGURIDAD.md) | REQ-F-014…017, 027–030 |
| DIS-006 | Cifrado por campo y anillo de claves | AES-256-GCM, AAD, HMAC | [10](10_DISENO_DE_SEGURIDAD.md), [07](07_DICCIONARIO_TECNICO_DE_DATOS.md) | REQ-F-001…004, 027–030, REQ-NF-001 |
| DIS-007 | Outbox y firmas HMAC hacia n8n | `automation_outbox`, `avisosN8n.js` | [03](03_DIAGRAMA_DE_COMPONENTES.md), [ADR-006](11_DECISIONES_DE_ARQUITECTURA/ADR-006_n8n_orquestador_outbox_firmado.md) | REQ-F-035, 036 |
| DIS-008 | Proveedor de pago mock | Webhook HMAC, idempotencia | [08](08_DISENO_DE_API.md), [ADR-009](11_DECISIONES_DE_ARQUITECTURA/ADR-009_pagos_proveedor_mock.md) | REQ-F-018…022, 040 |
| DIS-009 | Interfaz HTML/Bootstrap y navegación | 20 páginas, JS sin framework | [09](09_DISENO_DE_INTERFACES_Y_NAVEGACION.md) | REQ-F-038, 039 |
| DIS-010 | Despliegue | Node local, MySQL Clever Cloud, n8n Docker | [04](04_DIAGRAMA_DE_DESPLIEGUE.md) | Transversal |
| DIS-011 | Migraciones | DDL tolerante + versionadas 001–003 | [05](05_DISENO_DE_BASE_DE_DATOS.md), [ADR-002](11_DECISIONES_DE_ARQUITECTURA/ADR-002_mysql_gestionado_migraciones_al_arrancar.md) | REQ-F-037 |
| DIS-012 | Asistente por reglas | Motor local, Ollama opcional | [03](03_DIAGRAMA_DE_COMPONENTES.md) | REQ-F-031, 032 |

## 3. Tecnologías verificadas

| Capa | Tecnología y versión instalada [OBS] | Evidencia |
|---|---|---|
| Ejecución | Node.js v24.19.0 (equipo de laboratorio); README exige ≥18 | `npm test` 2026-10-16, `README.md` |
| Framework | express 4.22.3, cors 2.8.6, express-rate-limit 7.5.1 | `backend/package.json`, `npm ls` |
| Datos | mysql2 3.24.2 (MySQL 8 según documentación previa) | `backend/src/db.js` |
| Seguridad | jsonwebtoken 9.0.3, bcrypt 6.0.0 (+ bcryptjs 2.4.3), zod 4.6.5, `crypto` nativo | `backend/src/seguridad/` |
| Correo / PDF | nodemailer 6.10.1, pdfkit 0.17.2 | `backend/src/seguridad/correo.js`, `routes/comprobantes.js` |
| Frontend | HTML + Bootstrap 5.3.3 y Chart.js 4.4.4 por CDN jsDelivr, JS sin framework | `frontend/*.html` |
| Automatización | n8n `n8nio/n8n:1.110.1` (Docker) | `n8n/docker-compose.yml` |
| Pruebas | jest 30.5.2, supertest 7.3.1, `node:test` | `backend/test/` |

## 4. Principios de diseño identificados

1. **[OBS]** El servidor es la autoridad: precios, inventario, permisos y estado de cuenta se leen de MySQL en cada decisión (`autorizacion.js`, `routes/auth.js` `requiereAutenticacion`).
2. **[OBS]** Minimización: n8n recibe referencias opacas o eventos sin datos personales (excepción documentada: NIT de persona jurídica en W11, BUG-014).
3. **[OBS]** Cifrado por defecto de datos personales y separación de claves de cifrado y de índices ciegos.
4. **[OBS]** Operaciones críticas en transacción (checkout con `FOR UPDATE`, aprobación atómica de registro con `affectedRows = 2`).
5. **[OBS]** Costo cero en laboratorio: captcha propio, Mailpit, plan gratuito de MySQL (ver [ADR-010](11_DECISIONES_DE_ARQUITECTURA/ADR-010_captcha_propio_en_memoria.md), [ADR-011](11_DECISIONES_DE_ARQUITECTURA/ADR-011_pool_conexiones_limitado.md)).

## 5. Limitaciones del diseño

Ver [12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md): BUG-001 (reportes sin autenticación), BUG-003 (`API_BASE` fijo), BUG-010 a BUG-013 (estado en memoria, tokens en `localStorage`, sin TLS/CSP/HSTS, datos heredados con clave débil).

## Referencias

- [02_ARQUITECTURA_ACTUAL.md](02_ARQUITECTURA_ACTUAL.md) · [11_DECISIONES_DE_ARQUITECTURA/README.md](11_DECISIONES_DE_ARQUITECTURA/README.md)
- Código: [../backend/server.js](../backend/server.js), [../backend/src/app.js](../backend/src/app.js)
- Documentación previa: [../docs/ARQUITECTURA_ACTUAL.md](../docs/ARQUITECTURA_ACTUAL.md), [../docs/ARQUITECTURA_OBJETIVO.md](../docs/ARQUITECTURA_OBJETIVO.md), [../docs/ARQUITECTURA_VERIFICACION.md](../docs/ARQUITECTURA_VERIFICACION.md)
