# Decisiones de arquitectura (ADR) — índice

| Campo | Valor |
|---|---|
| ID documental | DOC-03-11 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar las decisiones de arquitectura del sistema. **No existían ADR formales en el repositorio:** estas fueron **reconstruidas a partir del código, del historial Git y de la documentación previa** (`docs/`). Su estado es "Aceptada (inferida del código) — aprobación formal PENDIENTE".

## Alcance

Decisiones estructurales vigentes en la rama `feature/verificacion-seguridad`.

## Formato

Cada ADR contiene: contexto, decisión, alternativas consideradas (solo si hay evidencia; si no, "no documentadas"), consecuencias, estado y evidencia.

## Índice

| ID | Título | Fecha de la evidencia | Documento |
|---|---|---|---|
| ADR-001 | Monolito Node.js/Express que sirve API y frontend desde el mismo origen | 2026-10-11 en adelante | [ADR-001](ADR-001_monolito_express_mismo_origen.md) |
| ADR-002 | MySQL gestionado con migraciones automáticas al arrancar | 2026-10-13 (versionadas) | [ADR-002](ADR-002_mysql_gestionado_migraciones_al_arrancar.md) |
| ADR-003 | Sesión JWT HS256 + refresh rotativo + MFA por correo | Anterior a 2026-10-13 | [ADR-003](ADR-003_sesion_jwt_refresh_mfa.md) |
| ADR-004 | Autorización centralizada con permisos granulares y superadministrador | 2026-10-13 | [ADR-004](ADR-004_autorizacion_centralizada_permisos.md) |
| ADR-005 | Cifrado por campo AES-256-GCM e índices ciegos HMAC | 2026-10-13 / 2026-10-15 | [ADR-005](ADR-005_cifrado_por_campo_indices_ciegos.md) |
| ADR-006 | n8n solo como orquestador; outbox firmado con HMAC | Fase 4 (anterior a 2026-10-13) | [ADR-006](ADR-006_n8n_orquestador_outbox_firmado.md) |
| ADR-007 | Correo directo con nodemailer | 2026-10-15 | [ADR-007](ADR-007_correo_directo_nodemailer.md) |
| ADR-008 | Registro verificado contra padrón cifrado con aprobación humana | 2026-10-15 | [ADR-008](ADR-008_registro_verificado_padron_aprobacion.md) |
| ADR-009 | Pagos con proveedor mock firmado | Fase 1 (anterior a 2026-10-13) | [ADR-009](ADR-009_pagos_proveedor_mock.md) |
| ADR-010 | Captcha propio en memoria | 2026-10-15 | [ADR-010](ADR-010_captcha_propio_en_memoria.md) |
| ADR-011 | Pool de conexiones limitado (3 + 1) | 2026-10-15 | [ADR-011](ADR-011_pool_conexiones_limitado.md) |
| ADR-012 | Verificación institucional diferida al momento de la compra | 2026-10-13 | [ADR-012](ADR-012_verificacion_diferida_a_la_compra.md) |

## Proceso propuesto para nuevas decisiones [REC]

1. Crear `ADR-0NN_<slug>.md` con el mismo formato y estado "Propuesta".
2. Revisión por el responsable técnico (PENDIENTE DE ASIGNACIÓN).
3. Cambiar a "Aceptada" o "Rechazada" con fecha y aprobador; registrar en [../../00_GESTION_DEL_PROYECTO/07_REGISTRO_DE_DECISIONES.md](../../00_GESTION_DEL_PROYECTO/07_REGISTRO_DE_DECISIONES.md).

## Referencias

- [../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md](../01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) · [../../docs/CHANGELOG.md](../../docs/CHANGELOG.md)
