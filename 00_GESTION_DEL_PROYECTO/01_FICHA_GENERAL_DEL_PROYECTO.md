# Ficha general del proyecto

| Campo | Valor |
|---|---|
| ID documental | DOC-00-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Resumir en una sola página qué es el sistema, con qué está construido, en qué estado se encuentra y dónde está cada cosa.

## Alcance

Datos demostrables a partir del repositorio y de las ejecuciones del 2026-10-16. Los datos de gestión (patrocinador, presupuesto, fechas comprometidas) no existen en el repositorio y figuran como PENDIENTE.

## Identificación

| Atributo | Valor |
|---|---|
| Nombre del sistema | Suite Institucional — Suministros Institucionales [OBS] (`README.md`, título del landing; `backend/package.json` nombre `suministros-backend`) |
| Versión de paquete | 1.0.0 [OBS] (`backend/package.json`). No hay etiquetas de versión en Git (BUG-018) |
| Repositorio | `https://github.com/DanielEduardoPadillaCerpa/Empresa-de-suministros-Institucionales` [OBS] (remoto `origin`) |
| Rama de trabajo | `feature/verificacion-seguridad` (sin fusionar a `main`) [OBS] |
| Autor registrado en Git | Daniel Eduardo Padilla Cerpa [OBS] — dato de Git, no un rol aprobado |
| Patrocinador / cliente | PENDIENTE DE ASIGNACIÓN |
| Gerente / responsable técnico | PENDIENTE DE ASIGNACIÓN |
| Presupuesto | PENDIENTE — restricción declarada de costo cero [OBS] (`docs/REGISTRO_VERIFICADO.md`) |
| Entorno actual | Laboratorio: backend local en Node.js, MySQL en Clever Cloud (plan gratuito), n8n en Docker local, Mailpit opcional [OBS] |
| Periodo con evidencia | 2026-10-11 a 2026-10-15 (23 commits) + documentación del 2026-10-16 |

## Descripción

[OBS] Plataforma web de suministros para entidades públicas e institucionales colombianas (Policía, Defensa, Bomberos, Socorro, Penitenciario y empresas). Ofrece un catálogo segmentado por institución, carrito, checkout con proveedor de pago simulado, comprobantes, asistente de catálogo y paneles administrativos. Su rasgo distintivo es el control de acceso:

1. **Registro verificado**: solo personas que figuran en un padrón institucional (terna NIT + nombre + institución) pueden solicitar cuenta; un administrador aprueba o rechaza.
2. **MFA por correo** en cada inicio de sesión, con captcha propio.
3. **Verificación institucional en la compra** para productos restringidos: documentos cifrados, doble comprobación con cuatro ojos y autorización de un solo uso por compra.

## Tecnología

| Capa | Tecnología [OBS] |
|---|---|
| Frontend | HTML estático, Bootstrap 5.3.3 y Chart.js 4.4.4 por CDN, JavaScript sin framework (`frontend/`) |
| Backend | Node.js (probado en v24.19.0) + Express 4.22.3, CommonJS (`backend/`) |
| Datos | MySQL 8 vía `mysql2`; esquema creado por migraciones al arrancar |
| Seguridad | bcrypt, JWT HS256, AES-256-GCM por campo, HMAC, `express-rate-limit`, `zod` |
| Correo | nodemailer 6.10.1 (SMTP; consola en laboratorio sin SMTP) |
| Automatización | n8n 1.110.1 en Docker, 12 workflows exportados (todos inactivos) |
| Pruebas | Jest 30 + supertest, `node:test`; integración contra MySQL Docker |

## Tamaño y composición

| Elemento | Cantidad [OBS] |
|---|---|
| Archivos versionados | 381 (271 sin contar `backend/img/`) |
| Páginas HTML | 21 |
| Archivos de rutas API | 17 (`backend/src/routes/`) |
| Tablas MySQL | 34: 22 en `db.js`, `schema_migraciones`, 4 de la migración 001, 5 de la 002 y 2 de la 003 (ver [diseño de base de datos](../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md)) |
| Migraciones versionadas | 3 (001, 002, 003) |
| Scripts operativos | 6 (`backend/scripts/`) |
| Workflows n8n | 12 (W1–W12) |
| Pruebas automatizadas | 158 unitarias (107 Jest + 51 `node:test`) aprobadas el 2026-10-16; 48 de integración y 43 de interfaz con evidencia histórica |

## Estado global

| Aspecto | Estado |
|---|---|
| Funcionalidad principal | Implementada; ver [estado por módulo](05_PLAN_DE_TRABAJO_Y_ESTADO_ACTUAL.md) |
| Pruebas | Unitarias aprobadas 2026-10-16; integración, interfaz y rendimiento no reproducidos |
| Producción | NO apta: sin HTTPS, CSP/HSTS, pasarela real ni validación jurídica; dependencia con vulnerabilidad alta (BUG-006) |
| Documentación | Estructura empresarial creada el 2026-10-16, sin aprobación formal |

## Ubicación de los componentes

| Componente | Ruta |
|---|---|
| Servidor y API | [backend/](../backend/) — entrada `backend/server.js`, app `backend/src/app.js` |
| Interfaz | [frontend/](../frontend/) |
| Workflows | [n8n/workflows/](../n8n/workflows/) |
| Documentación previa | [docs/](../docs/) |
| Documentación empresarial | carpetas `00_` a `07_` en la raíz |

## Referencias

- [Índice documental](00_INDICE_DOCUMENTAL.md)
- [Objetivos y alcance](03_OBJETIVOS_Y_ALCANCE.md)
- [Arquitectura actual](../03_DISENO/02_ARQUITECTURA_ACTUAL.md)
- [README del proyecto](../README.md)
