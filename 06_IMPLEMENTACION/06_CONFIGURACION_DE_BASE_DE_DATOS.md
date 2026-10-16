# Configuración de base de datos

| Campo | Valor |
|---|---|
| ID documental | DOC-06-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Explicar cómo se prepara y configura MySQL para el sistema y cómo se crea o actualiza el esquema.

## Alcance

Base principal de la aplicación, base fuente del padrón (solo lectura) y base de pruebas de integración. Diseño del modelo: [../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md](../03_DISENO/05_DISENO_DE_BASE_DE_DATOS.md); guía para desarrollo: [../04_DESARROLLO/09_GUIA_DE_BASE_DE_DATOS.md](../04_DESARROLLO/09_GUIA_DE_BASE_DE_DATOS.md).

## Base principal

| Aspecto | Configuración | Evidencia |
|---|---|---|
| Motor | MySQL 8 (InnoDB, `utf8mb4`) | `CREATE TABLE … ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` en [../backend/src/db.js](../backend/src/db.js) |
| Conexión | `DB_HOST`, `DB_PORT` (3306), `DB_USER`, `DB_PASSWORD`, `DB_NAME` | db.js |
| Pools | Principal: `DB_CONNECTION_LIMIT` recortado a máx. 4 (por defecto 3), `connectTimeout` 20 s, keep-alive, `idleTimeout` 60 s. Transaccional: 1 conexión con `multipleStatements: true` (lotes `START TRANSACTION … COMMIT` con valores parametrizados) | db.js |
| Permisos del usuario | CREATE, ALTER, INDEX, DROP (solo para revertir), SELECT, INSERT, UPDATE, DELETE sobre `DB_NAME` [INF] | Las migraciones ejecutan DDL al arrancar |
| Zona horaria | Los cálculos de vencimiento usan `NOW()` de MySQL (corrección del 2026-10-13 sobre MFA reciente) | docs/RESULTADOS_PRUEBAS.md |

## Creación del esquema

**[OBS]** No hay que ejecutar SQL a mano. Al arrancar, `migrar()`:

1. Crea con `CREATE TABLE IF NOT EXISTS` las tablas base (clientes, datos_sensibles, categorias, productos, solicitudes_contacto, atenciones, usuarios, refresh_tokens, retos_mfa, pedidos, pagos, eventos_pago, comprobantes, correo_outbox, solicitudes_reenvio_comprobante, automation_outbox, faq_asistente, asistente_pendientes, detalle_pedido, reportes_cliente, auditoria).
2. Aplica ALTER tolerantes (columnas e índices faltantes) y crea `solicitudes_cuenta`.
3. Siembra categorías y productos de ejemplo solo si `categorias` está vacía, más referencias institucionales para cotización (idempotente), y 6 preguntas frecuentes con texto `[COMPLETAR: …]`.
4. Aplica las migraciones versionadas pendientes y las registra en `schema_migraciones`:
   - `001_verificacion_institucional` (estados de verificación, documentos, elegibilidad, permisos de staff);
   - `002_verificacion_en_compra` (solicitudes, comprobaciones, identificadores, autorizaciones de compra, nonces, superadmin);
   - `003_registro_verificado` (`usuarios.estado_cuenta`, `padron_institucional`, `solicitudes_registro`).
5. Crea el administrador inicial si no existe ninguno y se definió `ADMIN_PASSWORD` (≥ 12).

Alternativa manual para la 003: [../backend/sql/003_registro_verificado.sql](../backend/sql/003_registro_verificado.sql) (idempotente; `mysql < 003_registro_verificado.sql`). PENDIENTE DE VALIDAR.

### Efectos de las migraciones sobre datos existentes (de la documentación previa)

- 001: clientes sin tipo de institución pasan a `borrador`; productos restringidos quedan con `revision_legal='pendiente'`; `auditoria.accion` pasa de ENUM a VARCHAR(40); administradores existentes reciben 7 permisos.
- 002: administradores existentes reciben permisos heredados; cuentas aprobadas reciben `verificado_hasta`.
- 003: cuentas existentes quedan `activa`; las nuevas nacen `pendiente`.

## Consultar y revertir migraciones

```bash
cd backend
node scripts/migraciones.js estado
node scripts/migraciones.js revertir <version> --confirmo-perdida-de-datos
```
Revertir elimina tablas y columnas de esa migración (pérdida de datos). Ver [10_PLAN_DE_ROLLBACK.md](10_PLAN_DE_ROLLBACK.md). PENDIENTE DE VALIDAR (probado históricamente en MySQL 8 según docs/MODELO_DATOS.md).

## Base fuente del padrón

- `PADRON_DB_URI` (o `MYSQL_ADDON_URI`), tabla `personas_institucionales_prueba` en el laboratorio. El backend **solo ejecuta SELECT** sobre ella y copia los datos cifrados a `padron_institucional` al arrancar y cada `PADRON_SYNC_MINUTOS` (10). Forzar: `npm run padron:importar`.
- **[REC]** Usuario de solo lectura para esta conexión. Rotar su contraseña (compartida en texto durante el desarrollo, RSK-002).

## Base de pruebas de integración

MySQL 8 en Docker en el puerto 3307, nombre con `test` (las suites **borran todas las tablas** y se niegan a correr si la base no es local o no contiene `test`). Variables `TEST_DB_*`. Ver [../docs/PLAN_PRUEBAS.md](../docs/PLAN_PRUEBAS.md).

## Buenas prácticas [REC]

- Una base por entorno; nunca apuntar desarrollo a producción (RSK-003).
- Detener el servidor antes de ejecutar scripts para no superar 5 conexiones (RSK-004).
- Respaldo antes de cada despliegue ([09](09_PLAN_DE_RESPALDO_Y_RESTAURACION.md)).

## Referencias

- [../docs/MODELO_DATOS.md](../docs/MODELO_DATOS.md)
- [../backend/src/migraciones/index.js](../backend/src/migraciones/index.js)
- [../backend/scripts/migraciones.js](../backend/scripts/migraciones.js)
