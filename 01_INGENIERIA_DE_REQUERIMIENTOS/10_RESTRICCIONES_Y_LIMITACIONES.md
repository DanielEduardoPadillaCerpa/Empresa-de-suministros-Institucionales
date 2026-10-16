# Restricciones y limitaciones

| Campo | Valor |
|---|---|
| ID documental | DOC-01-10 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar las restricciones que condicionan los requerimientos y las limitaciones funcionales conocidas del sistema actual.

## Alcance

Restricciones de negocio, técnicas, legales y de entorno, y limitaciones del producto. Las limitaciones de esta auditoría están en [../00_GESTION_DEL_PROYECTO/10_LIMITACIONES_Y_SUPUESTOS.md](../00_GESTION_DEL_PROYECTO/10_LIMITACIONES_Y_SUPUESTOS.md).

## 1. Restricciones

| ID | Tipo | Restricción | Evidencia | Efecto en requerimientos |
|---|---|---|---|---|
| RES-01 | Negocio | Costo cero: solo servicios gratuitos | `../docs/REGISTRO_VERIFICADO.md` | REQ-NF-018; captcha propio (ADR-010); Mailpit; plan gratuito MySQL |
| RES-02 | Entorno | Laboratorio sin HTTPS | `../docs/REGISTRO_VERIFICADO.md`, comentario en `../backend/src/app.js` | REQ-NF-016 PENDIENTE; sin HSTS |
| RES-03 | Técnica | MySQL Clever Cloud con máximo 5 conexiones por usuario | `../backend/src/db.js` (comentario), `../backend/README.md` | REQ-NF-007 |
| RES-04 | Técnica | Latencia de ~150 ms por viaje a MySQL desde el equipo de laboratorio | `../docs/REGISTRO_VERIFICADO.md` §5 | Diseño de lotes en un solo viaje (REQ-NF-006) |
| RES-05 | Técnica | Stack Node.js/Express CommonJS, HTML + Bootstrap sin framework | `../backend/package.json`, `../frontend/` | Todas |
| RES-06 | Técnica | Un solo proceso: captcha y limitadores en memoria | `../backend/src/seguridad/captcha.js` | REQ-NF-004 (BUG-010) |
| RES-07 | Legal | Ley 1581 de 2012 y Decreto 1377 de 2013 (datos personales) | `../docs/TRATAMIENTO_DATOS_PERSONALES.md` | REQ-NF-017, REQ-F-013, REQ-F-027 |
| RES-08 | Legal | Régimen de productos restringidos por validar | `../docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md`, `../docs/MATRIZ_NORMATIVA_COLOMBIA.md` | REQ-F-017, RN-008 |
| RES-09 | Fuentes | Sin acceso autorizado a SIGEP ni Registraduría; solo datos abiertos de entidades (RUES, CHIP) | `../docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md` | REQ-F-028 (verificación documental + humana) |
| RES-10 | Privacidad | n8n no debe recibir datos personales | `../docs/REGISTRO_VERIFICADO.md` §4 | REQ-NF-008, BUG-014 |
| RES-11 | Seguridad | Claves solo en `.env` (fuera de Git), nunca en BD, frontend ni n8n | `../.gitignore`, `../docs/REGISTRO_VERIFICADO.md` §3 | REQ-NF-001, REQ-NF-003 |

## 2. Limitaciones funcionales del sistema actual

| ID | Limitación | REQ / BUG |
|---|---|---|
| LIM-01 | Sin pasarela de pago real; con `NODE_ENV=production` el proveedor mock está prohibido y los demás modos no existen, por lo que el servidor no arranca en modo producción [INF de `../backend/src/paymentProvider.js` y `../backend/server.js`] | REQ-F-040 |
| LIM-02 | Comprobantes no válidos como factura electrónica (no-DIAN) | REQ-F-025 |
| LIM-03 | Mi cuenta sin pantalla (salvo cambio de contraseña) | REQ-F-010 a 013, BUG-004, BUG-005 |
| LIM-04 | Las referencias institucionales sembradas tienen precio 0 y `cotizacion_requerida`: no se compran (409 `COTIZACION_REQUERIDA`), solo se cotizan | `../backend/src/db.js`, `../backend/src/autorizacion.js` |
| LIM-05 | Traducción incompleta | REQ-F-038, BUG-016 |
| LIM-06 | `API_BASE` fijo en `http://localhost:8081` | BUG-003 |
| LIM-07 | Workflows n8n inactivos; W5 y W9 sin uso | REQ-F-036 |
| LIM-08 | Sin antivirus para documentos subidos | REQ-F-027 |
| LIM-09 | El valor `suspendida` de `usuarios.estado_cuenta` no es asignado por ningún flujo | RN-023 (ver [07_REGLAS_DE_NEGOCIO.md](07_REGLAS_DE_NEGOCIO.md)) |
| LIM-10 | Sin borrado automático por plazos de conservación | BUG-015 |
| LIM-11 | Sin pantalla para gestionar `solicitudes_contacto` ni consultar auditoría | REQ-F-032, REQ-F-034 |

## Referencias

- [06_REQUERIMIENTOS_NO_FUNCIONALES.md](06_REQUERIMIENTOS_NO_FUNCIONALES.md), [../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md](../03_DISENO/12_DEUDA_TECNICA_Y_MEJORAS_PROPUESTAS.md)
