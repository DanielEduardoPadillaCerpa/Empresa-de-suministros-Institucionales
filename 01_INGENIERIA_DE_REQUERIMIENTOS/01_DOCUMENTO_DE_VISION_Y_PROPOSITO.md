# Documento de visión y propósito

| Campo | Valor |
|---|---|
| ID documental | DOC-01-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Describir, a partir de la evidencia del repositorio, qué es la plataforma "Suite Institucional — Suministros Institucionales", a quién sirve, qué problema resuelve y cuáles son sus límites actuales. La visión aquí expuesta es una **reconstrucción** hecha por ingeniería inversa del código y de la documentación previa; no ha sido aprobada por ningún interesado.

## Alcance

Aplica a todo el sistema contenido en el repositorio: frontend estático (`../frontend/`), backend Node.js/Express (`../backend/`), base de datos MySQL (esquema definido en `../backend/src/db.js` y `../backend/src/migraciones/`) y automatizaciones n8n (`../n8n/`).

## 1. Declaración de visión [INF]

Una plataforma web B2G/B2B que permite a entidades públicas y privadas de Colombia (Policía, Fuerzas Militares y Defensa, Bomberos, organismos de socorro, sistema penitenciario y empresas) **solicitar una cuenta verificada, consultar un catálogo segmentado por institución y comprar suministros**, de modo que:

- solo personas presentes en un padrón institucional y aprobadas por un administrador tengan cuenta (**[OBS]** `../backend/src/routes/auth.js`, `../docs/REGISTRO_VERIFICADO.md`);
- cada institución vea solo los productos que le corresponden y los productos restringidos solo se vendan tras verificación y autorización por compra (**[OBS]** `../backend/src/autorizacion.js`, `../docs/ARQUITECTURA_VERIFICACION.md`);
- los datos personales se protejan con cifrado por campo y minimización hacia terceros (**[OBS]** `../backend/src/seguridad/cifradoCampos.js`, `../backend/src/crypto.js`).

## 2. Problema que aborda [INF]

| Problema | Evidencia | Respuesta del sistema |
|---|---|---|
| Venta de equipos sensibles (chalecos balísticos, grilletes, fundas) a quien no corresponde | Productos con `restringido = TRUE` sembrados en `../backend/src/db.js`; hallazgos H1–H3 en `../docs/AUDITORIA_TECNICA.md` | Visibilidad por contexto (RN-007), revisión legal (RN-008), verificación institucional y autorización por compra (RN-009) |
| Suplantación de funcionarios al registrarse | `../docs/MODELO_AMENAZAS.md` | Registro contra padrón + aprobación humana (RN-001 a RN-003) |
| Exposición de datos personales | `../docs/TRATAMIENTO_DATOS_PERSONALES.md` | Cifrado AES-256-GCM, índices ciegos HMAC (REQ-NF-001) |
| Procesos de compra no trazables | `../docs/INVENTARIO_FUNCIONALIDADES.md` | Checkout idempotente, comprobantes, auditoría (REQ-F-019, REQ-F-025, REQ-F-034) |

## 3. Usuarios objetivo

Ver [02_IDENTIFICACION_DE_INTERESADOS.md](02_IDENTIFICACION_DE_INTERESADOS.md). En resumen: visitante (ACT-01), solicitante (ACT-02), cliente activo (ACT-03), cliente verificado (ACT-04), administrador/staff (ACT-05), superadministrador (ACT-06) y sistemas externos (ACT-07 a ACT-11).

## 4. Capacidades principales

| Capacidad | Requerimientos | Estado global |
|---|---|---|
| Registro verificado y aprobación | REQ-F-001 a REQ-F-004 | Mayormente IMPLEMENTADO Y VERIFICADO |
| Autenticación con MFA y sesión | REQ-F-005 a REQ-F-009 | Mayormente IMPLEMENTADO Y VERIFICADO |
| Mi cuenta | REQ-F-010 a REQ-F-013 | PARCIALMENTE IMPLEMENTADO (sin pantallas, BUG-004) |
| Catálogo segmentado y administración | REQ-F-014 a REQ-F-017 | Mixto |
| Compra, pago mock, pedidos y comprobantes | REQ-F-018 a REQ-F-025 | Mixto; sin pasarela real (REQ-F-040) |
| Verificación institucional en la compra | REQ-F-027 a REQ-F-030 | Mixto |
| Asistente, atención, reportes, auditoría | REQ-F-031 a REQ-F-034 | Mixto; BUG-001 abierto |
| Automatizaciones n8n | REQ-F-035, REQ-F-036 | Backend verificado; instancia NO DETERMINADO |

Detalle en [05_REQUERIMIENTOS_FUNCIONALES.md](05_REQUERIMIENTOS_FUNCIONALES.md) y [06_REQUERIMIENTOS_NO_FUNCIONALES.md](06_REQUERIMIENTOS_NO_FUNCIONALES.md).

## 5. Fuera de alcance actual [OBS]

- Pasarela de pago real: `PAYMENT_MODE=sandbox|prod` falla de forma segura (`../backend/src/paymentProviderInstance.js`, REQ-F-040).
- Facturación electrónica DIAN: los comprobantes son "no-DIAN" (`../backend/README.md`).
- Consulta a SIGEP, Registraduría o biometría (`../docs/POLITICA_VERIFICACION_IDENTIDAD.md` §7, `../docs/VIABILIDAD_SIGEP_DATOS_ABIERTOS.md`).
- Operación en producción: el entorno declarado es de **laboratorio**, sin HTTPS (`../docs/REGISTRO_VERIFICADO.md`).

## 6. Restricciones de la visión

Costo cero y entorno de laboratorio (REQ-NF-018), MySQL con máximo 5 conexiones (REQ-NF-007). Ver [10_RESTRICCIONES_Y_LIMITACIONES.md](10_RESTRICCIONES_Y_LIMITACIONES.md).

## 7. Criterios de éxito propuestos [REC]

No existen métricas de negocio aprobadas. Se proponen, para validación: (a) 0 cuentas activas sin aprobación; (b) 0 ventas de restringidos sin autorización por compra; (c) cobertura de pruebas aprobadas para todos los REQ-F de prioridad Alta; (d) cierre de BUG-001 y BUG-006 antes de cualquier exposición pública.

## Referencias

- [04_ESPECIFICACION_DE_REQUERIMIENTOS_SRS.md](04_ESPECIFICACION_DE_REQUERIMIENTOS_SRS.md)
- [../README.md](../README.md), [../docs/ARQUITECTURA_OBJETIVO.md](../docs/ARQUITECTURA_OBJETIVO.md), [../docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
