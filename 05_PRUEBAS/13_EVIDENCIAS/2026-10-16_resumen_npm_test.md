# Evidencia EJ-2026-10-16-01 — resumen de `npm test`

| Campo | Valor |
|---|---|
| ID documental | DOC-05-13-EJ-2026-10-16-01 |
| Versión | 1.0 |
| Estado | Evidencia de ejecución (transcripción fiel de la salida; responsable de validación PENDIENTE DE ASIGNACIÓN) |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Conservar el resultado real de la corrida automatizada usada para clasificar los casos de prueba como APROBADO.

## Alcance

Solo la salida de `npm test`. No contiene datos sensibles: las pruebas generan sus propias claves aleatorias y usan correos `.test` y NIT `999…`.

## 1. Ejecución

| Campo | Valor |
|---|---|
| Comando | `cd backend && npm test` |
| Scripts | `npm run test:assistant` (`jest --runInBand`) y luego `npm run test:legacy` (`node --test test/*.test.js`) |
| Sistema | Windows 11 Pro 10.0.26200 |
| Node.js | v24.19.0 |
| Base de datos | Simulada en memoria (las suites reemplazan `src/db`); no se conectó a ningún MySQL |
| Correo | `nodemailer` simulado; ningún envío real |
| Código de salida | 0 |

## 2. Jest (`test:assistant`)

Salida resumida (Jest no se ejecutó en modo detallado, por lo que no lista cada prueba):

```
Test Suites: 4 passed, 4 total
Tests:       107 passed, 107 total
Snapshots:   0 total
Time:        3.966 s
Ran all test suites.
```

Suites incluidas según `backend/package.json` (`jest.testMatch`): `test/assistant.spec.js`, `test/account-registration-phase0.spec.js`, `test/mi-cuenta.spec.js`, `test/db-account-migration.spec.js`. Los 107 casos incluyen las expansiones de `test.each` de `assistant.spec.js` («responde con datos respaldados a: %s»); los nombres de cada prueba se leen en los archivos fuente.

## 3. `node:test` (`test:legacy`) — pruebas aprobadas tal como aparecen

**automation.test.js**
- ✔ automation signatures verify payload, timestamp, and tampering
- ✔ n8n workflow exports are valid JSON and Code nodes parse
- ✔ W8 valida la firma y permite solo los tres eventos de cuenta
- ✔ automation endpoints require their own configured token

**paymentJobs.test.js**
- ✔ expired payment changes status and releases the reserved quantities in one transaction
- ✔ expiration rolls back instead of silently losing a reserved product

**receiptEmail.test.js**
- ✔ el comprobante se envía por SMTP directo y nunca por un webhook
- ✔ el enlace del comprobante exige una URL base válida
- ✔ en producción sin SMTP el envío falla en lugar de imprimirse

**receiptService.test.js**
- ✔ approved payment queues admin email and only queues customer email with consent
- ✔ approved payment does not queue customer email without consent

**receiptTokens.test.js**
- ✔ receipt link validates only for its order and stored token hash
- ✔ receipt link rejects expired tokens

**registro-verificado.test.js**
- ✔ cifrado: formato v1:iv:tag:cifrado, IV aleatorio e ida y vuelta
- ✔ cifrado: el AAD (nombre del campo) impide mover un valor a otra columna
- ✔ cifrado: detecta alteraciones
- ✔ cifrado: rotación por versión (la clave anterior sigue descifrando)
- ✔ índice ciego: estable, separado por dominio y distinto de un SHA-256 simple
- ✔ comparación en tiempo constante
- ✔ NIT: solo dígitos y sin dígito de verificación
- ✔ nombre: sin tildes, mayúsculas, solo letras y palabras ordenadas
- ✔ padrón: NIT + nombre + institución
- ✔ padrón: el detalle para el administrador trae el nombre del padrón descifrado
- ✔ padrón: una caída de la base se marca como padron_no_disponible
- ✔ captcha: un solo intento, respuesta correcta y vencimiento
- ✔ n8n: solo viaja {evento, solicitud_id, resultado} con firma verificable
- ✔ n8n W12: el nodo Code acepta la firma del backend y rechaza alteraciones
- ✔ flujo: registro → pendiente → aprobación → login con MFA
- ✔ flujo: una verificación que no coincide exige confirmación explícita; el rechazo lleva motivo
- ✔ flujo: captcha, validación y acceso al panel

**tenancy.test.js** (suite «segmentación institucional»)
- ✔ resuelve agente@policia.gov.co como policia
- ✔ resuelve funcionario@ejercito.mil.co como defensa
- ✔ resuelve usuario@armada.mil.co como defensa
- ✔ resuelve usuario@fac.mil.co como defensa
- ✔ resuelve bombero@dnbc.gov.co como bomberos
- ✔ resuelve voluntario@defensacivil.gov.co como socorro
- ✔ resuelve funcionario@inpec.gov.co como penitenciario
- ✔ resuelve usuario@gmail.com como corporativo
- ✔ solo acepta identificadores de tenant conocidos
- ✔ un producto general es visible en todos los catálogos, no así uno de otro tenant
- ✔ la respuesta de invitado no expone precio, inventario, restricción ni metadatos

(Los correos anteriores son datos de entrada fijos de la prueba, no cuentas reales.)

**verificacion-compra.test.js**
- ✔ tabla de decisión: solo tres confirmaciones de personas distintas permiten aprobar
- ✔ tabla de decisión: ningún resultado distinto de confirmado aprueba y nada rechaza automáticamente
- ✔ normalización de identificadores: formatos equivalentes producen el mismo valor
- ✔ índice HMAC: estable para el mismo documento, distinto por tipo y por clave, y no es un SHA-256 simple
- ✔ cifrado v2: versionado, rotación de clave activa, detección de alteraciones
- ✔ hash del carrito: independiente del orden y de líneas repetidas, sensible a cantidades
- ✔ solo NIT de persona jurídica sale hacia n8n (nunca uno que contenga una cédula)
- ✔ configuración segura: en producción rechaza secretos de ejemplo
- ✔ W11 valida la firma, la forma exacta de cada evento y nunca acepta una cédula como NIT
- ✔ W11 clasifica la entidad sin confundir ausencia con fraude

Resumen final:

```
ℹ tests 51
ℹ suites 1
ℹ pass 51
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 426.4347
```

## 4. Mensajes en la salida que no son fallos

| Mensaje | Origen | Interpretación |
|---|---|---|
| `[padron] Consulta no disponible: ECONNRESET` | `registro-verificado.test.js`, prueba «padrón: una caída de la base se marca como padron_no_disponible» | Caso negativo **simulado**: la base simulada lanza `ECONNRESET` para comprobar que el resultado es `padron_no_disponible` |
| `[n8n] No se pudo entregar el aviso de registro: FETCH_FAILED` | `registro-verificado.test.js` (avisos a n8n) | Caso negativo **simulado**: el aviso a n8n falla y se comprueba que el registro no se bloquea; no se contactó ningún n8n real |
| `[config] N8N_W11_CALLBACK_SECRET no está configurado…` (5 veces) y `[config] CRYPTO_KEYS o IDENT_HMAC_KEY no están configurados…` | `verificacion-compra.test.js` («configuración segura…») | Avisos esperados de `validarConfiguracionSegura()` en un entorno de prueba sin esas variables; no son errores |

## Referencias

- [../10_RESULTADOS_DE_EJECUCION.md](../10_RESULTADOS_DE_EJECUCION.md) · [`../../backend/package.json`](../../backend/package.json) · [`../../backend/test/`](../../backend/test/)
