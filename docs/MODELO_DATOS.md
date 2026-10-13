# Modelo de datos — migración `001_verificacion_institucional`

Archivo: `backend/src/migraciones/001_verificacion_institucional.js`. Se aplica una vez al arrancar (`migrar()` → `aplicarMigraciones()`) y queda registrada en `schema_migraciones`. Solo agrega; cada paso es idempotente.

## Cambios

**`clientes`** (columnas nuevas): `tipo_institucion`, `estado_verificacion` ENUM(`borrador`,`pendiente`,`requiere_informacion`,`aprobado`,`rechazado`,`suspendido`), `institucion_aprobada`, `motivo_estado`, `datos_registro_cifrados` (dependencia, cargo, municipio, departamento y campos del tipo, cifrados AES-256-GCM), `dominio_verificado`, `tipo_solicitado`, `datos_cambio_cifrados`, `reintentos_envio`, `enviado_revision_en`, `decidido_en`, `decidido_por`. Índices `idx_clientes_verificacion`, `idx_clientes_nit`.

**`usuarios`**: `correo_verificado_en` (se marca en el primer MFA exitoso; en cuentas existentes se rellena con su primer MFA registrado en `refresh_tokens`).

**`productos`**: `revision_legal` ENUM(`no_requerida`,`pendiente`,`aprobada`,`bloqueada`). Los productos ya restringidos quedan en `pendiente`.

**Tablas nuevas**

| Tabla | Propósito | Claves |
|---|---|---|
| `productos_elegibilidad` | Instituciones adicionales que pueden comprar un producto (M:N) | PK (`producto_id`,`institucion_id`), FK a `productos` ON DELETE CASCADE |
| `verificacion_historial` | Cada transición de estado, actor y motivo | FK a `clientes` (CASCADE) y `usuarios` (SET NULL) |
| `documentos_verificacion` | Metadatos del documento; el archivo cifrado vive en `DOCUMENTOS_DIR` con nombre aleatorio | FK a `clientes` (CASCADE); `archivo` UNIQUE; SHA-256 del original |
| `staff_permisos` | Permisos administrativos por usuario | PK (`usuario_id`,`permiso`) |
| `schema_migraciones` | Control de versiones del esquema | PK `version` |

**`auditoria.accion`**: `ENUM` → `VARCHAR(40)` (conserva valores; admite `verificacion_aprobar`, `ver_documento`, `cuenta_suspender`, `producto_cumplimiento`, `permisos_staff`, etc.).

## Datos heredados

- Clientes sin `tipo_institucion` → `borrador`, con motivo explicativo y una fila de historial `migracion_cuenta_heredada`. **No reciben acceso a catálogos por defecto** aunque tuvieran `autorizacion_general = 1` (ese valor solo surte efecto en cuentas aprobadas).
- Administradores existentes → los siete permisos de staff.
- Pedidos, pagos, comprobantes y auditoría no se modifican (verificado sobre una base con el esquema anterior).

## Reversión

`node scripts/migraciones.js estado` muestra lo aplicado. `node scripts/migraciones.js revertir 001_verificacion_institucional --confirmo-perdida-de-datos` elimina las tablas y columnas de esta migración (se pierden decisiones, historial, documentos y permisos) y deja intactas las demás tablas. Después hay que volver al código anterior (respaldo: `.respaldo-pre-verificacion/backend-frontend-2026-10-13.tgz`). Probado en MySQL 8.0: revertir y volver a aplicar funciona.
