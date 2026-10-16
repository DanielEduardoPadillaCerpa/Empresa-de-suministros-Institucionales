# Orden de creación de tablas

| Campo | Valor |
|---|---|
| ID documental | DOC-04-BD-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Registrar el orden en que el código crea las tablas y sus dependencias por clave foránea, útil para restaurar, depurar o reconstruir una base.

## Alcance

**[OBS]** Derivado de la lectura de `migrar()` en `../../backend/src/db.js` (líneas 719–1050) y de las migraciones 001–003.

| # | Tabla | Creada en | Claves foráneas (ON DELETE) |
|---|---|---|---|
| 1 | clientes | db.js | — |
| 2 | datos_sensibles | db.js | cliente_id → clientes (CASCADE) |
| 3 | categorias | db.js | — (nombre UNIQUE) |
| 4 | productos | db.js | categoria_id → categorias (SET NULL) |
| 5 | solicitudes_contacto | db.js | — |
| 6 | atenciones | db.js | — |
| 7 | usuarios | db.js | cliente_id → clientes (SET NULL); correo UNIQUE |
| 8 | refresh_tokens | db.js | usuario_id → usuarios (CASCADE) |
| 9 | retos_mfa | db.js | usuario_id → usuarios (CASCADE) |
| 10 | pedidos | db.js | cliente_id → clientes (CASCADE) |
| 11 | pagos | db.js | pedido_id → pedidos (CASCADE); idempotency_key y referencia_externa UNIQUE |
| 12 | eventos_pago | db.js | pago_id → pagos (CASCADE); evento_id UNIQUE |
| 13 | comprobantes | db.js | pedido_id → pedidos (CASCADE) UNIQUE |
| 14 | correo_outbox | db.js | comprobante_id → comprobantes (CASCADE) |
| 15 | solicitudes_reenvio_comprobante | db.js | comprobante_id → comprobantes, usuario_id → usuarios (CASCADE) |
| 16 | automation_outbox | db.js | — (dedupe_key UNIQUE) |
| 17 | faq_asistente | db.js (+ 6 FAQ con texto `[COMPLETAR: …]`) | — |
| 18 | asistente_pendientes | db.js | — |
| 19 | detalle_pedido | db.js | pedido_id → pedidos, producto_id → productos (CASCADE) |
| 20 | reportes_cliente | db.js | cliente_id → clientes (CASCADE) |
| 21 | auditoria | db.js | — |
| 22 | solicitudes_cuenta | db.js `migrarCuentaSegura` | usuario_id, cliente_id (CASCADE); resuelta_por → usuarios (SET NULL) |
| 23 | schema_migraciones | migraciones/index.js | — |
| 24 | productos_elegibilidad | 001 | producto_id → productos (CASCADE); creado_por → usuarios (SET NULL) |
| 25 | verificacion_historial | 001 | cliente_id (CASCADE); actor_usuario_id (SET NULL) |
| 26 | documentos_verificacion | 001 | cliente_id (CASCADE); subido_por (SET NULL) |
| 27 | staff_permisos | 001 | usuario_id (CASCADE); otorgado_por (SET NULL) |
| 28 | solicitudes_verificacion | 002 | cliente_id (CASCADE); usuario_id, decidida_por (SET NULL) |
| 29 | verificacion_comprobaciones | 002 | solicitud_id (CASCADE); actor_usuario_id (SET NULL) |
| 30 | identificadores_personales | 002 | cliente_id UNIQUE (CASCADE); usuario_id (SET NULL) |
| 31 | autorizaciones_compra | 002 | usuario_id, cliente_id, solicitud_id (CASCADE) |
| 32 | automation_nonces | 002 | — |
| 33 | padron_institucional | 003 | — (fuente_id UNIQUE; nit_hash no único) |
| 34 | solicitudes_registro | 003 | usuario_id, cliente_id (CASCADE); decidida_por (SET NULL) |

**[OBS]** Motor InnoDB y `utf8mb4` en todas. **[INF]** El orden respeta las dependencias: para restaurar manualmente basta seguir la numeración.

**[OBS]** Riesgo de diseño: borrar un `cliente` elimina en cascada sus pedidos, pagos, comprobantes, documentos y solicitudes. **[REC]** Evaluar borrado lógico antes de usar `DELETE /api/clientes/:id` con datos reales.

## Referencias

- [README.md](README.md) · [../09_GUIA_DE_BASE_DE_DATOS.md](../09_GUIA_DE_BASE_DE_DATOS.md)
