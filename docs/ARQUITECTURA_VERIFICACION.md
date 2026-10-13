# Arquitectura de la verificación en la compra

Estado: implementado y probado (ver [RESULTADOS_PRUEBAS.md](RESULTADOS_PRUEBAS.md)). Migración `002_verificacion_en_compra`.

## 1. Cuatro conceptos separados

| Concepto | Qué decide | Dónde vive |
|---|---|---|
| **Autenticación** | Quién controla la cuenta (contraseña + código MFA por correo) | `routes/auth.js` |
| **Cuenta activa** | La persona confirmó su correo y no está suspendida. Con eso compra productos de uso general | `autorizacion.obtenerContexto()` → `cuentaActiva` |
| **Verificación** | La identidad y el vínculo con la institución están comprobados y la comprobación sigue vigente (`verificado_hasta`) | `verificacionCompra.js` + `routes/verificacion.js` |
| **Autorización** | Si una operación concreta se permite: por producto (`evaluarProducto`) y, en los restringidos, por compra (autorización de un solo uso) | `autorizacion.js`, `routes/checkout.js` |

El cifrado protege la **confidencialidad**. El HMAC sirve para **buscar coincidencias** sin descifrar. Ninguno de los dos verifica identidades ni autoriza operaciones.

## 2. Flujo

```
Registro mínimo ──► cuenta activa (borrador) ──► compra de uso general
                                   │
                    producto restringido / renovación
                                   ▼
         Mi verificación: entidad + documento de identidad + evidencia
                                   │  POST /mi-solicitud/enviar (idempotente)
                                   ▼
      solicitudes_verificacion (ref opaca) + 3 comprobaciones
        ├─ vinculo_documental   → revisor A        (verificacion.decidir)
        ├─ canal_independiente  → correo institucional (sistema)
        │                         o confirmación oficial por revisor B ≠ A
        └─ entidad              → n8n W11 consulta datos.gov.co (respuesta firmada)
                                  o revisión manual con referencia
                                   │  tabla de decisión (backend)
                                   ▼
               aprobar (humano) ─► verificado_hasta = hoy + 365 días
                                   │  + autorización de restringidos (restringidos.autorizar)
                                   ▼
      Checkout con restringidos ─► 403 REQUIERE_AUTORIZACION_COMPRA
                                   │  POST /compra/autorizacion → código al correo
                                   │  POST /compra/autorizacion/confirmar
                                   ▼
     POST /api/checkout { autorizacionCompra } → se consume en la misma transacción
```

## 3. Responsabilidades

| Componente | Hace | No hace |
|---|---|---|
| Backend | Valida, cifra, guarda, aplica la tabla de decisión, autoriza, audita y es la autoridad final | Consultar SIGEP ni la Registraduría (no hay acceso autorizado; ver [VIABILIDAD](VIABILIDAD_SIGEP_DATOS_ABIERTOS.md)) |
| MySQL | Guarda estados, resultados cifrados y el índice HMAC | Decidir: no hay triggers ni reglas de negocio en la base |
| n8n (W11) | Consulta datos.gov.co por NIT de persona jurídica, avisa al equipo y al titular, dispara el mantenimiento | Recibir cédulas, nombres o documentos; aprobar; escribir otra cosa que el componente `entidad` |
| Personas del equipo | Revisión documental, confirmación institucional (cuatro ojos) y decisión final | Aprobar sin la tabla de decisión: el servidor lo impide (`COMPROBACIONES_INCOMPLETAS`) |

## 4. Modelo de datos (migración 002)

| Tabla / columna | Contenido |
|---|---|
| `solicitudes_verificacion` | `ref` opaca (32 hex), cliente, operación (`compra`, `catalogo_restringido`, `renovacion`), estado (`en_curso`, `requiere_revision`, `fuente_no_disponible`, `aprobada`, `rechazada`, `expirada`, `cancelada`), clave de idempotencia y vencimiento a 30 días |
| `verificacion_comprobaciones` | Una fila por componente: método, resultado (`pendiente`, `confirmado`, `no_coincide`, `datos_insuficientes`, `fuente_no_disponible`, `respuesta_invalida`, `ambiguo`), fuente, referencia, actor e intentos |
| `identificadores_personales` | Tipo (`CC`, `CE`), número cifrado (`v2:`), `indice_hmac`, últimos 3 dígitos y fecha de autorización. Una fila por cliente |
| `autorizaciones_compra` | `ref` (64 hex), usuario, cliente, solicitud aprobada, hash del carrito, hash del código, intentos, estado (`pendiente_codigo`, `vigente`, `consumida`, `expirada`, `revocada`, `bloqueada`) y pedido |
| `automation_nonces` | Nonces ya aceptados de n8n (anti-repetición, se depuran a las 24 h) |
| `usuarios.es_superadmin`, `debe_cambiar_password`, `es_cuenta_prueba` | Superadministrador, credencial inicial y cuentas sintéticas |
| `clientes.verificado_hasta`, `acepta_terminos_en` | Vigencia de la verificación y aceptación de términos |

Correspondencia de estados (se comprueba en la prueba 20):

- `clientes.estado_verificacion = 'pendiente'` ⇔ la última solicitud está en curso, en revisión o con la fuente caída.
- `aprobado` ⇔ la última solicitud está `aprobada`.

## 5. Modelo criptográfico

| Elemento | Algoritmo | Clave | Notas |
|---|---|---|---|
| Datos personales nuevos y documentos | AES-256-GCM (IV aleatorio de 12 bytes, etiqueta de 16) | `CRYPTO_KEYS` (anillo versionado; `CRYPTO_KEY_ACTIVA`) | Formato `v2:<id>:<base64>`; los binarios empiezan con `SIK2`. Si el descifrado falla, lanza `DECRYPT_FAILED`: nunca devuelve el texto cifrado |
| Datos anteriores | AES-256-GCM con la clave heredada `CRYPTO_KEY` | Texto rellenado a 32 bytes | Solo lectura compatible; ver pendientes |
| Índice del documento de identidad | HMAC-SHA256(`IDENT_HMAC_KEY`, `"CC:" + número normalizado`) | Independiente del cifrado | Impide enumerar cédulas con solo la base de datos; un SHA-256 simple no lo impediría |
| Códigos de autorización de compra | HMAC-SHA256(`MFA_TOKEN_PEPPER`, `compra:<ref>:<usuario>:<código>`) | Pepper de MFA | 10 min de vigencia, 5 intentos, 5 por usuario cada 15 min |
| Mensajes backend → n8n | HMAC-SHA256(`N8N_W11_SECRET`, `timestamp.cuerpo`) | Propio de W11 | Ventana de 5 min |
| Respuestas n8n → backend | HMAC-SHA256(`N8N_W11_CALLBACK_SECRET`, …) + nonce | **Distinto** del de ida | Si se compromete el canal de ida, no se pueden falsificar respuestas |

**Rotación.** Se agrega `k2` a `CRYPTO_KEYS` y se marca `CRYPTO_KEY_ACTIVA=k2`. Los datos nuevos usan `k2` y `k1` sigue descifrando. Falta implementar el script de recifrado en segundo plano (ver pendientes). `IDENT_HMAC_KEY` no se rota sin recalcular el índice, para lo cual hay que descifrar cada número con el anillo.

**Dónde viven las claves.** Solo en variables de entorno del proceso (o en el gestor de secretos del proveedor). Nunca en MySQL, en el frontend, en registros ni en n8n. El arranque en producción falla si los secretos son débiles o de ejemplo (`configSegura.js`).

## 6. Normalización del identificador

- Solo están habilitados `CC` y `CE`. Se quitan espacios, puntos y guiones, y se pasa a mayúsculas.
- En la CC se quitan los ceros a la izquierda. CC: 4 a 10 dígitos. CE: 4 a 15 caracteres alfanuméricos.
- **"Placa" no se recoge.** El negocio no ha definido qué identificador es ni para qué se necesitaría; el número policial no equivale a la cédula. Si se define, se agrega un tipo nuevo con su propia justificación y normalización.

## 7. Endpoints nuevos

| Método y ruta | Quién | Propósito |
|---|---|---|
| `POST /api/verificacion/mi-solicitud/identificador` | Titular | Registrar el documento (requiere `autorizaTratamiento: true`) |
| `POST /api/verificacion/mi-solicitud/enviar` | Titular | Envío o renovación (admite `Idempotency-Key`) |
| `POST /api/verificacion/admin/solicitudes/:id/comprobaciones/:componente` | Staff con el permiso del componente | Registrar un resultado |
| `POST /api/verificacion/admin/solicitudes/:id/identificador/revelar` | `identificadores.ver` | Acceso excepcional con justificación auditada |
| `GET /api/verificacion/admin/diagnostico` | Superadministrador | Migraciones, colas y configuración presente (sin valores) |
| `POST /api/verificacion/compra/autorizacion` y `/confirmar` | Titular verificado | Autorización de una compra con restringidos |
| `POST /api/automatizaciones/verificaciones/resultado` | n8n (HMAC + nonce) | Resultado del componente `entidad` |
| `POST /api/automatizaciones/verificaciones/mantenimiento` | n8n (`x-automation-token`) | Reintentos y expiraciones (idempotente; también corre un job interno cada 5 min) |
