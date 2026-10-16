# Informe final de auditoría documental

| Campo | Valor |
|---|---|
| ID documental | DOC-00-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Este informe resume la auditoría técnica y documental de la plataforma Suite Institucional: qué se inspeccionó, qué se creó, qué se verificó de verdad, qué quedó pendiente y qué debe validar una persona. Es la puerta de entrada para un responsable técnico, un auditor o un evaluador.

## Alcance

Cubre el repositorio completo en la rama `feature/verificacion-seguridad`, sincronizada con `origin`. Excluye la base de datos real, la instancia de n8n y los servicios externos, porque no se accedió a ellos. Es una auditoría **documental**: no se modificó la aplicación.

## 1. Resultado en una frase

**[OBS]** La plataforma tiene una implementación amplia y bien probada a nivel unitario en registro verificado, autenticación con MFA, cifrado y autorización. Aun así, **no está lista para producción**:
- con `NODE_ENV=production` el servidor no arranca (BUG-019);
- no hay pasarela de pagos real;
- faltan HTTPS, CSP y HSTS;
- hay un endpoint de reportes expuesto sin autenticación (BUG-001);
- `nodemailer` tiene una vulnerabilidad alta;
- la validación jurídica, los respaldos y los responsables siguen pendientes.

## 2. Áreas y archivos inspeccionados

| Área | Qué se inspeccionó | Profundidad |
|---|---|---|
| Raíz | `README.md`, `INFORME-INSPECCION.md`, `.gitignore`, `file.md`, `package-lock.json` | Completa |
| Backend: arranque y app | `backend/server.js`, `backend/src/app.js`, `backend/package.json`, `backend/.env.example` (solo nombres de variables) | Completa |
| Backend: rutas | Los 17 routers de `backend/src/routes/`; 97 endpoints documentados con archivo y línea | Completa (lectura del código y de los middleware) |
| Backend: dominio y seguridad | `autorizacion.js`, `configSegura.js`, `crypto.js`, `seguridad/*`, `verificacion*.js`, `payment*`, `receipt*`, `email*`, `automation*`, `tenancy.js`, `assistant/*` | Cabeceras, exportaciones y lógica crítica |
| Persistencia | `backend/src/db.js` (34 tablas), `src/migraciones/001–003`, `sql/003_registro_verificado.sql`, `scripts/migraciones.js` | Completa |
| Scripts | `backend/scripts/*.js`, `n8n/generar-w11.js`, `n8n/generar-w12.js`, `backend/probar-mfa-n8n.js`, `backend/scratch_detalle.js` | Propósito y riesgos |
| Frontend | 20 páginas HTML, 12 scripts JS y 8 hojas CSS: llamadas a la API, scripts por página y CDN | Mapeo completo de llamadas `/api/*` |
| Automatización | `n8n/docker-compose.yml` (sin secretos) y los 12 workflows (nodos, disparadores, estado `active`, ajustes de guardado) | Completa sobre los archivos |
| Pruebas | `backend/test/**` (14 archivos), nombres de los casos | Completa |
| Documentación previa | 26 documentos de `docs/`, `backend/README.md`, `backend/ASISTENTE-CATALOGO.md` | Leída y contrastada con el código |
| Git | `git log`, ramas, sincronización con `origin` (solo lectura) | Completa |

## 3. Carpetas y documentos creados

| Carpeta | Documentos | Contenido destacado |
|---|---|---|
| [00_GESTION_DEL_PROYECTO](00_INDICE_DOCUMENTAL.md) | 12 | Índice y control documental, ficha, acta (plantilla), riesgos RSK-001…017, decisiones, cambios REL-001…005, este informe |
| [01_INGENIERIA_DE_REQUERIMIENTOS](../01_INGENIERIA_DE_REQUERIMIENTOS/04_ESPECIFICACION_DE_REQUERIMIENTOS_SRS.md) | 12 | 40 REQ-F, 18 REQ-NF, 23 reglas de negocio, historias, criterios de aceptación y [matriz de trazabilidad](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md) |
| [02_ANALISIS](../02_ANALISIS/01_DOCUMENTO_DE_ANALISIS_DEL_SISTEMA.md) | 12 | Procesos, actores y permisos, especificación de UC-001…023, flujos con errores, modelo conceptual, riesgos técnicos |
| [03_DISENO](../03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) | 24 | Arquitectura actual frente a la objetivo, componentes, despliegue, modelo entidad-relación de 34 tablas, diccionario técnico, seguridad y 12 ADR |
| [04_DESARROLLO](../04_DESARROLLO/README.md) | 38 | Inventario (MD + CSV, 176 archivos), 97 endpoints, variables, scripts, fichas W1–W12, diagramas `.mmd`, ejemplos seguros |
| [05_PRUEBAS](../05_PRUEBAS/01_PLAN_DE_PRUEBAS.md) | 15 | 69 casos de prueba, registro de defectos BUG-001…031, evidencia real de `npm test` |
| [06_IMPLEMENTACION](../06_IMPLEMENTACION/01_PLAN_DE_IMPLEMENTACION.md) | 16 | Instalación, configuración, despliegue, respaldo, rollback, manuales de usuario y técnico, lista de preproducción, acta (plantilla) |
| [07_MANTENIMIENTO_Y_SOPORTE](../07_MANTENIMIENTO_Y_SOPORTE/01_PLAN_DE_MANTENIMIENTO.md) | 8 | Incidentes (un único incidente real documentado), diagnóstico, dependencias, continuidad |

En total son **136 archivos** documentales y **47 diagramas Mermaid**, además de 4 archivos `.mmd`. El código fuente original se quedó en su ubicación y no se duplicó.

## 4. Documentos previos reutilizados (conservados sin cambios)

`README.md`, `INFORME-INSPECCION.md`, `backend/README.md`, `backend/ASISTENTE-CATALOGO.md`, `docs/ARQUITECTURA_ACTUAL.md`, `docs/ARQUITECTURA_OBJETIVO.md`, `docs/ARQUITECTURA_VERIFICACION.md`, `docs/AUDITORIA_TECNICA.md`, `docs/CHANGELOG.md`, `docs/FLUJO_AUTENTICACION_ACTUAL.md`, `docs/FLUJO_N8N_VERIFICACION.md`, `docs/GUIA_INSTALACION_Y_DESPLIEGUE.md`, `docs/INVENTARIO_FUNCIONALIDADES.md`, `docs/MODELO_AMENAZAS.md`, `docs/MODELO_DATOS.md`, `docs/PLAN_PRUEBAS.md`, `docs/RESULTADOS_PRUEBAS.md`, `docs/REGISTRO_VERIFICADO.md`, `docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md`, `docs/VARIABLES_ENTORNO.md`, `docs/POLITICA_VERIFICACION_IDENTIDAD.md`, `docs/TRATAMIENTO_DATOS_PERSONALES.md`, las matrices normativa, de elegibilidad y de falsos positivos/negativos, y `docs/Flujos-n8n.docx`. La nueva documentación los enlaza como evidencia; sus resultados de pruebas se citan como **históricos**. El único cambio fuera de las carpetas nuevas es una sección añadida al final de `README.md` que apunta a esta estructura.

## 5. Funcionalidades identificadas (estado)

| Estado | REQ-F | Ejemplos |
|---|---|---|
| IMPLEMENTADO Y VERIFICADO (por pruebas ejecutadas hoy) | 17 | Registro verificado, padrón, panel de solicitudes, login con MFA, revocación de sesión, comprobantes, asistente, expiración de pedidos, eventos a n8n |
| PARCIALMENTE IMPLEMENTADO | 4 | Mi cuenta: perfil, cambio de correo y solicitudes de datos solo por API (BUG-004 y BUG-005); i18n incompleta |
| IMPLEMENTADO, NO VERIFICADO | 17 | Checkout, pagos mock, catálogo HTTP, verificación institucional completa, autorización de compra, permisos de staff, reportes, auditoría |
| NO DETERMINADO | 1 | Workflows n8n operativos en una instancia (REQ-F-036) |
| DOCUMENTADO, NO IMPLEMENTADO | 1 | Pasarela de pagos real (REQ-F-040) |

El detalle está en [05_REQUERIMIENTOS_FUNCIONALES](../01_INGENIERIA_DE_REQUERIMIENTOS/05_REQUERIMIENTOS_FUNCIONALES.md) y en la [matriz de trazabilidad](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md).

## 6. Pruebas realmente ejecutadas

| Fecha | Comando | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-16 | `npm test` en `backend/` (Node 24.19.0, Windows 11, base simulada en memoria) | **Jest 107/107** y **node:test 51/51** aprobadas | [13_EVIDENCIAS/2026-10-16_resumen_npm_test.md](../05_PRUEBAS/13_EVIDENCIAS/2026-10-16_resumen_npm_test.md) |
| 2026-10-16 | `npm audit --omit=dev` | 1 vulnerabilidad alta (`nodemailer` 6.10.1) | [07_DEPENDENCIAS_Y_VERSIONES](../04_DESARROLLO/07_DEPENDENCIAS_Y_VERSIONES.md) |
| 2026-10-16 | Script de verificación documental (enlaces, rutas, vacíos, secretos, Mermaid) | Ver §10 | Este informe |

Casos de prueba: **32 APROBADOS, 23 BLOQUEADOS, 11 NO EJECUTADOS, 3 PENDIENTES y 0 FALLIDOS** (69 en total). Ver el [catálogo](../05_PRUEBAS/03_CATALOGO_DE_CASOS_DE_PRUEBA.md).

## 7. Pruebas pendientes

- Integración contra MySQL 8 local (`npm run test:integration`): está bloqueada porque no hay contenedor de pruebas. Es la evidencia principal del checkout, el catálogo HTTP, la verificación en la compra y los permisos.
- Interfaz con jsdom (`backend/test/ui/`): necesita un servidor de prueba y una base vacía.
- Rendimiento (`npm run medir`): **usa la base real**; solo debe ejecutarse con autorización. Las cifras del 2026-10-15 son históricas.
- SMTP real, importación y activación de los workflows en n8n, consulta a datos.gov.co (W11).
- Pruebas de seguridad TC-201…212 en un entorno autorizado, en particular TC-208 (BUG-001).
- Prueba de restauración de respaldos (no existe procedimiento ejecutado).

## 8. Componentes que no pudieron inspeccionarse

- La base MySQL de Clever Cloud, real o de padrón: no se abrió ninguna conexión.
- La instancia n8n (`empresa-n8n`) y su volumen de credenciales; no se puede comparar lo desplegado con el repositorio.
- `backend/.env`, `n8n/.env`, `respaldos-n8n/`, `.respaldo-pre-verificacion/`, `.aider*`: se excluyeron a propósito porque contienen secretos o respaldos.
- `backend/storage/` (documentos cifrados y cuentas de prueba): son datos de ejecución excluidos de git.
- Los commits históricos que solo existen en la rama `backup-antes-de-cambiar-autor` (por ejemplo `07e7e37`, citado por documentos previos).
- Las licencias de las 205 imágenes de `backend/img/`.

## 9. Inconsistencias encontradas

| Tema | Detalle | Dónde se registra |
|---|---|---|
| Arranque en producción | `server.js` valida el proveedor de pagos al iniciar y ningún modo es válido con `NODE_ENV=production` | BUG-019 |
| Documentación previa frente al código | Referencias a `src/mfaCourier.js` y `.vscode/settings.json`, que no existen; backend/README describe MFA y comprobantes por n8n W5/W9; puerto 8080 en el código frente a 8081 en `.env.example`; README raíz con encabezados residuales | BUG-008 |
| Plantilla de entorno | Variables declaradas que nadie usa y `STOCK_MINIMO` sin declarar | BUG-027 |
| Modelo de estados | `usuarios.estado_cuenta='suspendida'` nunca se asigna; `clientes.estado_verificacion` toma por defecto `pendiente`, pero el registro inserta `borrador` | BUG-025, `03_DISENO/07` |
| Costo de bcrypt | El cambio de contraseña y el admin inicial ignoran `BCRYPT_COST` | BUG-024 |
| Cifrado | `nit`, `nombre_unidad` y `direccion_instalacion` se guardan en claro, aunque la documentación previa dice que las direcciones se cifran | BUG-029 |
| Funciones sin pantalla | Mi cuenta, solicitudes de cuenta, auditoría, PQRS e inventario bajo | BUG-004, BUG-005, BUG-028 |
| Visibilidad | La tabla de `docs/ARQUITECTURA_OBJETIVO.md` es anterior a la migración 002: hoy una cuenta activa ya compra productos de uso general | `02_ANALISIS/04` |
| Estados de prueba | La matriz de trazabilidad y el catálogo de pruebas diferían en 7 casos (NO EJECUTADO frente a BLOQUEADO); **se armonizaron** según el catálogo de pruebas | `01/11`, `01/09` |

## 10. Verificación de la documentación (Fase 7)

| Control | Resultado |
|---|---|
| Las 8 carpetas principales existen | ✔ |
| Todos los documentos previstos existen; incluye 12 ADR y las 7 subcarpetas de 04 | ✔ (136 archivos) |
| Documentos vacíos o casi vacíos (< 200 caracteres) | 0 |
| Enlaces Markdown relativos revisados | ~1.050, todos resuelven después de crear este informe |
| Rutas de código citadas que no existen | Solo `backend/storage/…` y `backend/img/productos/`: son directorios que se crean al ejecutar el sistema (documentos, cuentas de prueba e imágenes subidas desde el panel) y están excluidos de git. Se dejan a propósito |
| Endpoints documentados respaldados por código | 97, cada uno con `archivo:línea` |
| Tablas y columnas | Tomadas de `db.js` y de las migraciones 001–003 (34 tablas) |
| Diagramas Mermaid | 47; todos usan tipos válidos y tienen los bloques cerrados |
| Resultados inventados | Ninguno: APROBADO solo cuando la corrida del 2026-10-16 lo respalda |
| Secretos copiados (hashes bcrypt, claves hex de 32 bytes, URI con contraseña, claves privadas, hosts de Clever Cloud, asignaciones de variables secretas) | 0 coincidencias |
| Código funcional y configuración original modificados | **Ninguno**: `git status` solo muestra carpetas nuevas y la sección añadida a `README.md` |

## 11. Información que necesita validación humana

1. Responsables, patrocinador y aprobadores (todos PENDIENTE DE ASIGNACIÓN). Actas de inicio y de entrega por diligenciar.
2. Las decisiones pendientes DEC-P-01…07 de [07_REGISTRO_DE_DECISIONES](07_REGISTRO_DE_DECISIONES.md): NIT hacia n8n en W11, cuentas heredadas, fusión a `main`, validación jurídica, infraestructura de producción, pasarela de pagos y actualización de `nodemailer`.
3. Validación jurídica de la Ley 1581, de los plazos de conservación y del régimen de productos restringidos.
4. Las prioridades de los requerimientos, que se infirieron.
5. Que el comportamiento descrito como "inferido de la implementación" coincide con lo que el negocio espera.
6. Las licencias de uso de las imágenes de producto.
7. RTO, RPO y la política de respaldos.

## 12. Riesgos documentales y técnicos

- **Técnicos principales:** pérdida de claves de cifrado (RSK-001), secretos expuestos o débiles (RSK-002), base de producción usada desde desarrollo (RSK-003), `nodemailer` vulnerable (RSK-005), falta de TLS/CSP/HSTS (RSK-007), endpoint de reportes abierto (RSK-008), ausencia de respaldos verificados (RSK-012), arranque en producción imposible (BUG-019).
- **Documentales:**
  - los documentos previos de `docs/` siguen teniendo inconsistencias (BUG-008) y no se editaron para no alterar la evidencia;
  - toda la documentación nueva es un BORRADOR sin aprobar;
  - las cifras y estados son válidos para el commit `4742737` y pueden quedar obsoletos con el siguiente cambio.

## 13. Confirmación del alcance de las modificaciones

**[OBS]** Durante esta auditoría:
- **no** se modificó ningún archivo de `backend/`, `frontend/`, `n8n/` ni `docs/`;
- **no** se cambiaron esquemas, variables de entorno, dependencias ni workflows;
- **no** se ejecutaron migraciones, despliegues, envíos de correo ni automatizaciones;
- **no** se abrió ninguna conexión a bases de datos.

Los cambios fueron estos:
1. Se crearon las 8 carpetas documentales.
2. Se añadió al final de `README.md` una sección de enlaces a la nueva documentación.
3. Se publicaron los cambios en el repositorio remoto con un commit en la rama `feature/verificacion-seguridad`, a petición expresa del usuario.

## 14. Recomendaciones priorizadas [REC]

| Prioridad | Recomendación | Relación |
|---|---|---|
| 1 | Proteger `GET /api/reportes/mensual` con autenticación y permiso, y limitar `POST /api/atencion/calificacion` | BUG-001, BUG-002 |
| 2 | Rotar los secretos señalados y la contraseña de la base del padrón; definir dónde se guardan y respaldan las claves | RSK-001, RSK-002 |
| 3 | Resolver el arranque en producción (adaptador de pasarela o desacoplar la validación del arranque) | BUG-019, REQ-F-040 |
| 4 | Actualizar `nodemailer` a la v10 en una rama, con pruebas de correo | BUG-006 |
| 5 | Habilitar HTTPS, CSP y HSTS; llevar la sesión a una cookie `HttpOnly`; agregar SRI a los CDN | BUG-011, BUG-012, BUG-026 |
| 6 | Levantar MySQL de pruebas y ejecutar la integración y la interfaz para convertir los casos BLOQUEADOS en evidencia | §7 |
| 7 | Implementar y probar respaldos (BD, documentos, claves, volumen n8n) | RSK-012 |
| 8 | Hacer configurable `API_BASE`, unificar el costo de bcrypt y registrar solo códigos de error | BUG-003, BUG-022, BUG-024 |
| 9 | Construir las pantallas que faltan (Mi cuenta, solicitudes, auditoría, PQRS) | BUG-004, BUG-005, BUG-028 |
| 10 | Revisar y fusionar la rama a `main`, etiquetar versiones y depurar residuos y la documentación previa inconsistente | BUG-008, BUG-009, BUG-018, BUG-023 |
| 11 | Validación jurídica y asignación formal de responsables; aprobar este conjunto documental | RSK-010, RSK-013 |

## 15. Seguimiento posterior (2026-10-16)

Después de la auditoría se corrigieron BUG-001, BUG-002, BUG-004 y BUG-005, y parcialmente BUG-028 (código, migración 004, pantallas nuevas y pruebas). Las recomendaciones 1 y 9 de la §14 quedan atendidas, salvo la pantalla de inventario bajo. Detalle en [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md) y en [../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md](../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md).

## Referencias

- [00_INDICE_DOCUMENTAL.md](00_INDICE_DOCUMENTAL.md)
- [06_MATRIZ_DE_RIESGOS.md](06_MATRIZ_DE_RIESGOS.md)
- [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)
- [../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md](../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md)
- [../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md](../01_INGENIERIA_DE_REQUERIMIENTOS/11_MATRIZ_DE_TRAZABILIDAD.md)
- [../docs/RESULTADOS_PRUEBAS.md](../docs/RESULTADOS_PRUEBAS.md)
