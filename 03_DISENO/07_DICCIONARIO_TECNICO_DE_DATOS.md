# Diccionario técnico de datos

| Campo | Valor |
|---|---|
| ID documental | DOC-03-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Detallar cada tabla y columna de la base principal con su tipo exacto, nulabilidad, valor por defecto, claves, índices, cifrado y migración de origen.

## Alcance

34 tablas. Tipos y definiciones copiados del DDL en `backend/src/db.js` y `backend/src/migraciones/00*.js` [OBS]. El esquema efectivamente desplegado es NO DETERMINADO.

**Convenciones.** Origen: `base` = `migrar()` en db.js; `db:cols` = ALTER tolerantes de db.js (`migrarColumnasFaltantes`, `migrarAutenticacionMfa`, `migrarCuentaSegura`); `001`/`002`/`003` = migraciones versionadas. Nulo: Sí/No. Cifrado: `C1` = `cifrar()` de `src/crypto.js` (AES-256-GCM; clave heredada `CRYPTO_KEY` o anillo `CRYPTO_KEYS`, sin AAD por campo); `C2:<AAD>` = `cifrarCampo()` de `src/seguridad/cifradoCampos.js` (AES-256-GCM, `ENC_KEY`, AAD indicado); `H` = HMAC/índice ciego; `B` = bcrypt; `S` = SHA-256. El tipo lógico de cifrado se infirió de las llamadas en el código [INF].

## 1. Identidad y sesión

### `usuarios`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | — | base |
| correo | VARCHAR(255) | No | — | UNIQUE | En claro | base |
| password_hash | VARCHAR(255) | No | — | — | B | base |
| cliente_id | INT | Sí | NULL | FK → clientes(id) ON DELETE SET NULL | — | base |
| session_version | INT UNSIGNED | No | 0 | — | — | base / db:cols |
| rol | ENUM('cliente','admin') | Sí | 'cliente' | — | — | base |
| fecha_creacion | DATETIME | Sí | CURRENT_TIMESTAMP | — | — | base |
| correo_verificado_en | DATETIME | Sí | NULL | — | — | 001 |
| es_superadmin | BOOLEAN | No | FALSE | — | — | 002 |
| debe_cambiar_password | BOOLEAN | No | FALSE | — | — | 002 |
| es_cuenta_prueba | BOOLEAN | No | FALSE | — | — | 002 |
| estado_cuenta | ENUM('pendiente','activa','rechazada','suspendida') | No | 'activa' | — | — | 003 |

### `refresh_tokens`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | — | base |
| usuario_id | INT | No | — | FK → usuarios(id) CASCADE | — | base |
| token_hash | VARCHAR(255) | No | — | — | S | base |
| fecha_creacion | DATETIME | Sí | CURRENT_TIMESTAMP | — | — | base |
| fecha_expiracion | DATETIME | No | — | — | — | base |
| mfa_verificado_en | DATETIME | Sí | NULL | — | — | base / db:cols |
| revocado | BOOLEAN | Sí | FALSE | — | — | base |

### `retos_mfa`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| reto_id | CHAR(64) | No | — | PK | — | base |
| usuario_id | INT | No | — | FK → usuarios(id) CASCADE; idx_retos_mfa_usuario_estado (usuario_id, estado, expira_en) | — | base |
| codigo_hash | CHAR(64) | No | — | — | H (`MFA_TOKEN_PEPPER`) | base |
| estado | ENUM('pendiente','verificado','expirado','cancelado','bloqueado') | No | 'pendiente' | índice compuesto | — | base |
| intentos | TINYINT UNSIGNED | No | 0 | — | — | base |
| reenvios | TINYINT UNSIGNED | No | 0 | — | — | base / db:cols |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — | — | base |
| enviado_en | DATETIME | No | CURRENT_TIMESTAMP | — | — | base |
| expira_en | DATETIME | No | — | índice compuesto | — | base |
| proposito | ENUM('inicio_sesion','cambio_correo') | No | 'inicio_sesion' | — | — | base / db:cols |
| correo_destino_cifrado | TEXT | Sí | NULL | — | C1 | base / db:cols |

## 2. Clientes y datos personales

### `clientes`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | — | base |
| nombre_unidad | VARCHAR(255) | Sí | NULL | — | En claro | base |
| direccion_instalacion | VARCHAR(255) | Sí | NULL | — | En claro (editable desde mi-cuenta sin cifrar) | base |
| nit | VARCHAR(100) | Sí | NULL | idx_clientes_nit | En claro | base / 001 (índice) |
| nombre_funcionario | TEXT | Sí | NULL | — | C1 | base |
| correo | TEXT | Sí | NULL | — | C1 | base |
| telefono | TEXT | Sí | NULL | — | C1 | base |
| direccion_entrega | TEXT | Sí | NULL | — | C1 | base |
| autorizacion_general | BOOLEAN | Sí | FALSE | — | — | base |
| fecha_registro | DATETIME | Sí | CURRENT_TIMESTAMP | idx_clientes_verificacion | — | base |
| tipo_institucion | VARCHAR(32) | Sí | NULL | idx_clientes_verificacion | — | 001 |
| estado_verificacion | ENUM('borrador','pendiente','requiere_informacion','aprobado','rechazado','suspendido') | No | 'pendiente' | idx_clientes_verificacion (estado_verificacion, tipo_institucion, fecha_registro) | — | 001 |
| institucion_aprobada | VARCHAR(32) | Sí | NULL | — | — | 001 |
| motivo_estado | VARCHAR(500) | Sí | NULL | — | — | 001 |
| datos_registro_cifrados | TEXT | Sí | NULL | — | C1 (JSON) | 001 |
| dominio_verificado | BOOLEAN | No | FALSE | — | — | 001 |
| tipo_solicitado | VARCHAR(32) | Sí | NULL | — | — | 001 |
| datos_cambio_cifrados | TEXT | Sí | NULL | — | C1 (JSON) | 001 |
| reintentos_envio | TINYINT UNSIGNED | No | 0 | — | — | 001 |
| enviado_revision_en | DATETIME | Sí | NULL | — | — | 001 |
| decidido_en | DATETIME | Sí | NULL | — | — | 001 |
| decidido_por | INT | Sí | NULL | sin FK | — | 001 |
| verificado_hasta | DATETIME | Sí | NULL | — | — | 002 |
| acepta_terminos_en | DATETIME | Sí | NULL | — | — | 002 |

### `datos_sensibles`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | — | base |
| cliente_id | INT | No | — | FK → clientes(id) CASCADE | — | base |
| numero_consulta_antecedentes | TEXT | Sí | NULL | — | C1 | base |
| autorizacion_sensible | BOOLEAN | Sí | FALSE | — | — | base |
| fecha_autorizacion | DATETIME | Sí | CURRENT_TIMESTAMP | — | — | base |

### `solicitudes_cuenta`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — | db:cols |
| usuario_id | INT | No | — | FK → usuarios(id) CASCADE | — | db:cols |
| cliente_id | INT | No | — | FK → clientes(id) CASCADE; idx_solicitudes_cuenta_cliente | — | db:cols |
| campo | ENUM('nit','nombreUnidad','eliminacion','correccion') | No | — | — | — | db:cols |
| detalle | TEXT | No | — | — | En claro | db:cols |
| estado | ENUM('pendiente','aprobada','rechazada') | No | 'pendiente' | idx_solicitudes_cuenta_estado | — | db:cols |
| resuelta_por | INT | Sí | NULL | FK → usuarios(id) SET NULL | — | db:cols |
| respuesta_admin | VARCHAR(500) | Sí | NULL | — | — | db:cols |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | índices | — | db:cols |
| resuelta_en | DATETIME | Sí | NULL | — | — | db:cols |

## 3. Registro verificado (migración 003)

### `padron_institucional`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — | 003 |
| fuente_id | BIGINT UNSIGNED | No | — | UNIQUE uq_padron_fuente | — | 003 |
| nit_hash | CHAR(64) | No | — | idx_padron_nit (no único) | H (`HMAC_KEY`, "nit:<dígitos>") | 003 |
| nombre_cifrado | TEXT | No | — | — | C2:padron.nombre | 003 |
| entidad_cifrada | TEXT | Sí | NULL | — | C2:padron.entidad | 003 |
| tipo_institucion | VARCHAR(32) | No | — | — | En claro (categoría) | 003 |
| estado | ENUM('activa','inactiva') | No | 'activa' | — | — | 003 |
| huella | CHAR(64) | No | '' | — | H (detección de cambios) | 003 |
| sincronizado_en | DATETIME | No | CURRENT_TIMESTAMP ON UPDATE | — | — | 003 |

### `solicitudes_registro`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — | 003 |
| usuario_id | INT | No | — | FK → usuarios(id) CASCADE; idx_solreg_usuario | — | 003 |
| cliente_id | INT | No | — | FK → clientes(id) CASCADE | — | 003 |
| nit_hash | CHAR(64) | No | — | idx_solreg_nit | H | 003 |
| nit_cifrado | TEXT | No | — | — | C2:solicitud.nit | 003 |
| nombre_cifrado | TEXT | No | — | — | C2:solicitud.nombre | 003 |
| tipo_institucion | VARCHAR(32) | No | — | — | — | 003 |
| resultado_verificacion | ENUM('coincide','nit_no_existe','nombre_no_coincide','institucion_no_coincide','persona_inactiva','padron_no_disponible') | No | — | — | — | 003 |
| estado | ENUM('pendiente','aprobada','rechazada') | No | 'pendiente' | idx_solreg_estado (estado, creado_en, id) | — | 003 |
| motivo_rechazo | VARCHAR(500) | Sí | NULL | — | En claro | 003 |
| decidida_por | INT | Sí | NULL | FK → usuarios(id) SET NULL | — | 003 |
| decidida_en | DATETIME | Sí | NULL | — | — | 003 |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | índice | — | 003 |

## 4. Verificación institucional (001 y 002)

### `verificacion_historial` (001)
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado |
|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — |
| cliente_id | INT | No | — | FK → clientes CASCADE; idx_historial_cliente (cliente_id, creado_en) | — |
| estado_anterior | VARCHAR(32) | Sí | NULL | — | — |
| estado_nuevo | VARCHAR(32) | No | — | — | — |
| evento | VARCHAR(40) | No | — | — | — |
| actor_usuario_id | INT | Sí | NULL | FK → usuarios SET NULL | — |
| actor_tipo | ENUM('cliente','staff','sistema') | No | — | — | — |
| motivo | VARCHAR(500) | Sí | NULL | — | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | índice | — |

### `documentos_verificacion` (001)
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado |
|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — |
| cliente_id | INT | No | — | FK → clientes CASCADE; idx_documentos_cliente (cliente_id, estado) | — |
| subido_por | INT | Sí | NULL | FK → usuarios SET NULL | — |
| tipo_documento | VARCHAR(64) | No | — | — | — |
| nombre_original_cifrado | TEXT | No | — | — | C1 |
| mime | VARCHAR(64) | No | — | — | — |
| tamano_bytes | INT UNSIGNED | No | — | — | — |
| sha256 | CHAR(64) | No | — | — | S (del original) |
| archivo | VARCHAR(80) | No | — | UNIQUE | Nombre aleatorio; archivo cifrado en `DOCUMENTOS_DIR` (`cifrarBuffer`) |
| estado | ENUM('vigente','eliminado') | No | 'vigente' | índice | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — | — |
| eliminado_en | DATETIME | Sí | NULL | — | — |

### `solicitudes_verificacion` (002)
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado |
|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — |
| ref | CHAR(32) | No | — | UNIQUE | Referencia opaca |
| cliente_id | INT | No | — | FK → clientes CASCADE; idx_solicitudes_cliente; UNIQUE uq_solicitud_idempotencia (cliente_id, idempotency_key) | — |
| usuario_id | INT | Sí | NULL | FK → usuarios SET NULL | — |
| tipo_institucion | VARCHAR(32) | No | — | — | — |
| operacion | ENUM('compra','catalogo_restringido','renovacion') | No | 'compra' | — | — |
| carrito_hash | CHAR(64) | Sí | NULL | — | S [INF] |
| estado | ENUM('en_curso','requiere_revision','fuente_no_disponible','aprobada','rechazada','expirada','cancelada') | No | 'en_curso' | idx_solicitudes_estado (estado, expira_en) | — |
| idempotency_key | VARCHAR(128) | Sí | NULL | UNIQUE compuesto | — |
| motivo | VARCHAR(500) | Sí | NULL | — | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — | — |
| actualizado_en | DATETIME | No | CURRENT_TIMESTAMP ON UPDATE | — | — |
| expira_en | DATETIME | No | — | índice | — |
| decidida_en | DATETIME | Sí | NULL | — | — |
| decidida_por | INT | Sí | NULL | FK → usuarios SET NULL | — |

### `verificacion_comprobaciones` (002)
| Columna | Tipo | Nulo | Defecto | Clave/Índice |
|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK |
| solicitud_id | BIGINT UNSIGNED | No | — | FK → solicitudes_verificacion CASCADE; UNIQUE uq_comprobacion (solicitud_id, componente) |
| componente | ENUM('vinculo_documental','canal_independiente','entidad') | No | — | UNIQUE compuesto |
| metodo | VARCHAR(40) | No | — | — |
| resultado | ENUM('pendiente','confirmado','no_coincide','datos_insuficientes','fuente_no_disponible','respuesta_invalida','ambiguo') | No | 'pendiente' | — |
| fuente | VARCHAR(80) | Sí | NULL | — |
| referencia | VARCHAR(120) | Sí | NULL | — |
| observacion | VARCHAR(500) | Sí | NULL | — |
| actor_tipo | ENUM('sistema','staff','n8n') | No | 'sistema' | — |
| actor_usuario_id | INT | Sí | NULL | FK → usuarios SET NULL |
| intentos | SMALLINT UNSIGNED | No | 0 | — |
| consultado_en | DATETIME | Sí | NULL | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — |
| actualizado_en | DATETIME | No | CURRENT_TIMESTAMP ON UPDATE | — |

### `identificadores_personales` (002)
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado |
|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — |
| cliente_id | INT | No | — | UNIQUE; FK → clientes CASCADE | — |
| usuario_id | INT | Sí | NULL | FK → usuarios SET NULL | — |
| tipo_documento | VARCHAR(8) | No | — | — | — (CC, CE) |
| numero_cifrado | TEXT | No | — | — | C1 formato v2 (anillo `CRYPTO_KEYS`) |
| indice_hmac | CHAR(64) | No | — | idx_identificadores_indice | H (`IDENT_HMAC_KEY`) |
| ultimos_digitos | CHAR(3) | No | — | — | En claro (enmascarado) |
| autorizado_en | DATETIME | No | — | — | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — | — |
| actualizado_en | DATETIME | No | CURRENT_TIMESTAMP ON UPDATE | — | — |

### `autorizaciones_compra` (002)
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado |
|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — |
| ref | CHAR(64) | No | — | UNIQUE | — |
| usuario_id | INT | No | — | FK → usuarios CASCADE; idx_autorizaciones_usuario (usuario_id, estado, expira_en) | — |
| cliente_id | INT | No | — | FK → clientes CASCADE | — |
| solicitud_id | BIGINT UNSIGNED | No | — | FK → solicitudes_verificacion CASCADE | — |
| carrito_hash | CHAR(64) | No | — | — | S [INF] |
| codigo_hash | CHAR(64) | No | — | — | H (`MFA_TOKEN_PEPPER`) |
| intentos | TINYINT UNSIGNED | No | 0 | — | — |
| estado | ENUM('pendiente_codigo','vigente','consumida','expirada','revocada','bloqueada') | No | 'pendiente_codigo' | índice | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — | — |
| expira_en | DATETIME | No | — | índice | — |
| confirmada_en | DATETIME | Sí | NULL | — | — |
| consumida_en | DATETIME | Sí | NULL | — | — |
| pedido_id | INT | Sí | NULL | sin FK | — |

### `staff_permisos` (001)
| Columna | Tipo | Nulo | Defecto | Clave/Índice |
|---|---|---|---|---|
| usuario_id | INT | No | — | PK (usuario_id, permiso); FK → usuarios CASCADE |
| permiso | VARCHAR(64) | No | — | PK |
| otorgado_por | INT | Sí | NULL | FK → usuarios SET NULL |
| otorgado_en | DATETIME | No | CURRENT_TIMESTAMP | — |

Valores válidos de `permiso` (en código, `PERMISOS_STAFF` de `src/autorizacion.js`): `verificacion.ver`, `verificacion.decidir`, `verificacion.confirmar_institucion`, `documentos.ver`, `identificadores.ver`, `cuentas.suspender`, `restringidos.autorizar`, `productos.cumplimiento`, `catalogo.gestionar`, `pedidos.gestionar`, `clientes.gestionar`, `auditoria.ver`, `staff.permisos`.

## 5. Catálogo

### `categorias` (base)
| Columna | Tipo | Nulo | Defecto | Clave |
|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK |
| nombre | VARCHAR(100) | No | — | UNIQUE |
| descripcion | TEXT | Sí | NULL | — |

### `productos`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Origen |
|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | base |
| nombre | VARCHAR(255) | No | — | — | base |
| descripcion | TEXT | Sí | NULL | — | base |
| precio | DECIMAL(10,2) | No | — | — | base |
| imagen | VARCHAR(255) | Sí | NULL | — | base |
| cantidad_disponible | INT | Sí | 0 | idx_productos_estado_stock | base |
| estado | ENUM('activo','inactivo') | Sí | 'activo' | índices | base |
| fecha_creacion | DATETIME | Sí | CURRENT_TIMESTAMP | — | base |
| restringido | BOOLEAN | Sí | FALSE | — | base |
| categoria_id | INT | Sí | NULL | FK → categorias(id) SET NULL | base |
| macrocategoria | ENUM('general','vestimenta','herramientas') | Sí | 'general' | — | base / db:cols |
| institucion_id | VARCHAR(32) | No | 'policia' | idx_productos_institucion_estado | base / db:cols |
| metadatos | JSON | Sí | NULL | — | base / db:cols |
| revision_legal | ENUM('no_requerida','pendiente','aprobada','bloqueada') | No | 'no_requerida' | — | 001 |

### `productos_elegibilidad` (001)
| Columna | Tipo | Nulo | Defecto | Clave/Índice |
|---|---|---|---|---|
| producto_id | INT | No | — | PK (producto_id, institucion_id); FK → productos CASCADE |
| institucion_id | VARCHAR(32) | No | — | PK; idx_elegibilidad_institucion |
| creado_por | INT | Sí | NULL | FK → usuarios SET NULL |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — |

## 6. Comercio

### `pedidos`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado | Origen |
|---|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | — | base |
| cliente_id | INT | No | — | FK → clientes CASCADE; idx_pedidos_cliente_fecha | — | base |
| fecha_pedido | DATETIME | Sí | CURRENT_TIMESTAMP | índice | — | base |
| items | JSON | No | — | — | — | base |
| total | DECIMAL(10,2) | No | — | — | — | base |
| estado | ENUM('pendiente','pendiente_pago','pagado','expirado','rechazado','confirmado','preparado','enviado','entregado','cancelado') | Sí | 'pendiente' | — | — | base / db:cols |
| datos_comprador_cifrados | TEXT | Sí | NULL | — | C1 (JSON) | base / db:cols |
| direccion_entrega_cifrada | TEXT | Sí | NULL | — | C1 | base / db:cols |
| enviar_comprobante | BOOLEAN | No | FALSE | — | — | base / db:cols |

### `detalle_pedido` (base)
| Columna | Tipo | Nulo | Clave |
|---|---|---|---|
| id | INT AUTO_INCREMENT | No | PK |
| pedido_id | INT | No | FK → pedidos CASCADE |
| producto_id | INT | No | FK → productos CASCADE |
| cantidad | INT | No | — |
| precio_unitario | DECIMAL(10,2) | No | — |

### `pagos` (base)
| Columna | Tipo | Nulo | Defecto | Clave/Índice |
|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK |
| pedido_id | INT | No | — | FK → pedidos CASCADE; idx_pagos_pedido_estado |
| proveedor | VARCHAR(32) | No | — | — |
| referencia_externa | VARCHAR(191) | Sí | NULL | UNIQUE |
| idempotency_key | VARCHAR(128) | No | — | UNIQUE |
| request_hash | CHAR(64) | No | — | — |
| widget_token | VARCHAR(191) | Sí | NULL | — |
| widget_url | TEXT | Sí | NULL | — |
| estado | ENUM('creado','pendiente','aprobado','rechazado','expirado','reembolsado') | No | 'creado' | índice |
| monto_centavos | BIGINT UNSIGNED | No | — | — |
| moneda | CHAR(3) | No | 'COP' | — |
| metodo | VARCHAR(32) | Sí | NULL | — |
| expira_en | DATETIME | No | — | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — |
| actualizado_en | DATETIME | No | CURRENT_TIMESTAMP ON UPDATE | — |

### `eventos_pago` (base)
| Columna | Tipo | Nulo | Defecto | Clave |
|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK |
| evento_id | VARCHAR(191) | No | — | UNIQUE |
| proveedor | VARCHAR(32) | No | — | — |
| pago_id | BIGINT UNSIGNED | No | — | FK → pagos CASCADE |
| payload_hash | CHAR(64) | No | — | — (S) |
| recibido_en | DATETIME | No | CURRENT_TIMESTAMP | — |

### `comprobantes` (base)
| Columna | Tipo | Nulo | Defecto | Clave |
|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK |
| pedido_id | INT | No | — | UNIQUE; FK → pedidos CASCADE |
| numero | VARCHAR(40) | No | — | UNIQUE |
| enviar_correo | BOOLEAN | No | FALSE | — |
| enviado_cliente_en | DATETIME | Sí | NULL | — |
| enviado_admin_en | DATETIME | Sí | NULL | — |
| token_hash | CHAR(64) | Sí | NULL | — (S del token de enlace) |
| expira_en | DATETIME | Sí | NULL | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP | — |

### `solicitudes_reenvio_comprobante` (base)
| Columna | Tipo | Nulo | Clave/Índice |
|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | PK |
| comprobante_id | BIGINT UNSIGNED | No | FK → comprobantes CASCADE; idx_reenvio_comprobante_usuario_fecha |
| usuario_id | INT | No | FK → usuarios CASCADE |
| creado_en | DATETIME | No (CURRENT_TIMESTAMP) | índice |

## 7. Colas

### `correo_outbox` (base)
| Columna | Tipo | Nulo | Defecto | Clave/Índice |
|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK |
| comprobante_id | BIGINT UNSIGNED | No | — | FK → comprobantes CASCADE; idx_correo_outbox_comprobante |
| tipo | ENUM('cliente','admin') | No | — | — |
| estado | ENUM('pendiente','procesando','enviado','fallido') | No | 'pendiente' | idx_correo_outbox_pendiente (estado, disponible_en, id) |
| intentos | TINYINT UNSIGNED | No | 0 | — |
| disponible_en | DATETIME | No | CURRENT_TIMESTAMP | índice |
| ultimo_error_code | VARCHAR(64) | Sí | NULL | — |
| creado_en / actualizado_en | DATETIME | No | CURRENT_TIMESTAMP (+ ON UPDATE) | — |
| enviado_en | DATETIME | Sí | NULL | — |

### `automation_outbox` (base)
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Cifrado |
|---|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT | No | — | PK | — |
| workflow | ENUM('W1','W3','W6','W8','W11') | No | — | — | — |
| dedupe_key | VARCHAR(191) | No | — | UNIQUE | — |
| payload | JSON | No | — | — | C1 si `payload_cifrado` |
| payload_cifrado | BOOLEAN | No | FALSE | — | — |
| estado | ENUM('pendiente','procesando','enviado','fallido') | No | 'pendiente' | idx_automation_outbox_pendiente | — |
| intentos | TINYINT UNSIGNED | No | 0 | — | — |
| disponible_en | DATETIME | No | CURRENT_TIMESTAMP | índice | — |
| ultimo_error_code | VARCHAR(64) | Sí | NULL | — | — |
| creado_en / actualizado_en | DATETIME | No | CURRENT_TIMESTAMP (+ ON UPDATE) | — | — |

### `automation_nonces` (002)
| Columna | Tipo | Nulo | Defecto | Clave/Índice |
|---|---|---|---|---|
| nonce | CHAR(64) | No | — | PK |
| recibido_en | DATETIME | No | CURRENT_TIMESTAMP | idx_nonces_fecha |

## 8. Atención, asistente y reportes (base)

### `atenciones`
| Columna | Tipo | Nulo | Defecto |
|---|---|---|---|
| id | INT AUTO_INCREMENT (PK) | No | — |
| conversacion_id | VARCHAR(100) | Sí | NULL |
| calificacion | INT | Sí | NULL |
| comentario | TEXT (en claro) | Sí | NULL |
| escalado_a_humano | BOOLEAN | Sí | FALSE |
| fecha | DATETIME | Sí | CURRENT_TIMESTAMP |

### `solicitudes_contacto`
| Columna | Tipo | Nulo | Defecto | Cifrado |
|---|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT (PK) | No | — | — |
| tipo_solicitud | ENUM('pqrs','soporte','cotizacion') | No | — | — |
| tipo_entidad | ENUM('publica','privada') | No | — | — |
| entidad | VARCHAR(255) | No | — | En claro |
| nit_cifrado | TEXT | No | — | C1 |
| correo_cifrado | TEXT | No | — | C1 |
| criticidad | ENUM('baja','media','alta','urgente') | No | — | — |
| mensaje | TEXT | No | — | En claro |
| estado | ENUM('recibida','en_gestion','cerrada') | No | 'recibida' | — |
| fecha_creacion | DATETIME | No | CURRENT_TIMESTAMP | — |
Índice: `idx_solicitudes_contacto_estado_fecha (estado, fecha_creacion)`.

### `faq_asistente`
| Columna | Tipo | Nulo | Defecto | Clave |
|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK |
| palabras_clave | VARCHAR(500) | No | — | — |
| pregunta | VARCHAR(255) | No | — | UNIQUE |
| respuesta | TEXT | No | — | — |
| activo | BOOLEAN | No | TRUE | idx_faq_asistente_activo |
| creado_en / actualizado_en | DATETIME | No | CURRENT_TIMESTAMP (+ ON UPDATE) | — |
Nota [OBS]: las 6 FAQ sembradas tienen respuestas marcadoras `[COMPLETAR: …]`.

### `asistente_pendientes`
| Columna | Tipo | Nulo | Defecto |
|---|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT (PK) | No | — |
| conversacion_id | VARCHAR(100) | No | — |
| texto_normalizado | VARCHAR(500) | No | — |
| creado_en | DATETIME | No | CURRENT_TIMESTAMP |
| atendido | BOOLEAN | No | FALSE |
Índice: `idx_asistente_pendientes_fecha (atendido, creado_en)`.

### `reportes_cliente`
| Columna | Tipo | Nulo | Defecto | Clave |
|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK |
| cliente_id | INT | No | — | FK → clientes CASCADE; idx_reportes_cliente_fecha |
| comentario | TEXT | No | — | — |
| calificacion | INT | No | — | — |
| fecha | DATETIME | Sí | CURRENT_TIMESTAMP | — |
| fecha_actualizacion | DATETIME | Sí | CURRENT_TIMESTAMP ON UPDATE | — |

## 9. Auditoría y control

### `auditoria`
| Columna | Tipo | Nulo | Defecto | Clave/Índice | Origen |
|---|---|---|---|---|---|
| id | INT AUTO_INCREMENT | No | — | PK | base |
| usuario_id | INT | Sí | NULL | sin FK | base |
| correo | VARCHAR(255) | Sí | NULL | — | base |
| accion | VARCHAR(40) | No | — | — | base (ENUM) → 001 (VARCHAR) |
| entidad | VARCHAR(50) | No | — | idx_auditoria_entidad (entidad, entidad_id, fecha) | base / 001 |
| entidad_id | VARCHAR(50) | Sí | NULL | índice | base |
| detalle | TEXT | Sí | NULL | — | base |
| fecha | DATETIME | Sí | CURRENT_TIMESTAMP | índice | base |

### `schema_migraciones`
| Columna | Tipo | Nulo | Defecto | Clave |
|---|---|---|---|---|
| version | VARCHAR(100) | No | — | PK |
| descripcion | VARCHAR(255) | No | — | — |
| aplicada_en | DATETIME | No | CURRENT_TIMESTAMP | — |

## Referencias

- [05_DISENO_DE_BASE_DE_DATOS.md](05_DISENO_DE_BASE_DE_DATOS.md) · [06_MODELO_ENTIDAD_RELACION.md](06_MODELO_ENTIDAD_RELACION.md)
- [../backend/src/db.js](../backend/src/db.js) · [../backend/src/migraciones/001_verificacion_institucional.js](../backend/src/migraciones/001_verificacion_institucional.js) · [../backend/src/migraciones/002_verificacion_en_compra.js](../backend/src/migraciones/002_verificacion_en_compra.js) · [../backend/src/migraciones/003_registro_verificado.js](../backend/src/migraciones/003_registro_verificado.js)
- [../02_ANALISIS/09_DICCIONARIO_DE_DATOS.md](../02_ANALISIS/09_DICCIONARIO_DE_DATOS.md)
