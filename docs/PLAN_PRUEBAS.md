# Plan de pruebas

| Suite | Comando (desde `backend/`) | Qué cubre | Dependencias |
|---|---|---|---|
| Unitarias Jest | `npx jest --runInBand` | Registro (contrato nuevo), permisos de restringidos, asistente, mi-cuenta, checkout, migración idempotente | Ninguna (BD simulada) |
| Unitarias `node:test` | `npm run test:legacy` | MFA, outbox, comprobantes, pagos, segmentación; **tabla de decisión, cifrado v2, HMAC, normalización, configuración segura y nodos de código de W11** (`verificacion-compra.test.js`) | Ninguna |
| Integración | `npm run test:integration` | `verificacion.int.spec.js` (escenarios A–L adaptados al registro mínimo) y `compra-verificada.int.spec.js` (criterios 1–20 de la sección 3) contra MySQL real con la app completa y los scripts CLI | MySQL local de pruebas |
| Interfaz (jsdom) | Terminal 1: `node test/ui/servidor-prueba.js` · Terminal 2: `node test/ui/ui-e2e.js` | Registro mínimo, Mi verificación (documento de identidad, comprobaciones), panel con doble comprobación, catálogo, cambio de contraseña | Servidor de prueba en :8091 y base `suministros_ui_test` **vacía** (el login tiene un límite de 10 por IP cada 15 min: reinicia el servidor entre corridas) |

## Base de datos de pruebas

```bash
docker run -d --name suministros-test-mysql -e MYSQL_ROOT_PASSWORD=<root> \
  -e MYSQL_DATABASE=suministros_test -e MYSQL_USER=test -e MYSQL_PASSWORD=<clave> -p 3307:3306 mysql:8.0
```

La suite de integración **borra todas las tablas** de la base indicada; por eso se niega a ejecutarse si la base no es local o su nombre no contiene `test`. Variables: `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME`. El correo MFA se simula capturando el código; nunca sale a n8n.

## Escenarios obligatorios (sección 10.2)

| Id | Escenario | Resultado esperado |
|---|---|---|
| A | Visitante consulta catálogo restringido | Sin restringidos ni precios; detalle 404 |
| B | Cuenta pendiente usa la API | Vitrina; restringido 404; checkout 403 `CUENTA_NO_APROBADA` |
| C | Bomberos pide producto exclusivo de Policía | 404 y ausente del listado |
| D | Policía consulta producto elegible | 200 con precio y `puedeComprar` |
| E | Id de otra institución en el checkout | 409 sin revelar la institución |
| F | Restringido sin autorización | 409 (revisión pendiente) → 403 (sin autorización) → 201 con ambas |
| G | Se revoca la autorización con sesión abierta | Siguiente compra 403 |
| H | Admin solo con `verificacion.ver` | 403 al decidir, cambiar cumplimiento, marcar restringido o darse permisos |
| I | Cuenta suspendida con JWT vigente | 401; refresh 401; nuevo login sigue sin poder comprar |
| J | Documentos de otra institución | Titular ajeno 404; staff sin permiso 403; con permiso 200 y auditoría; disco cifrado |
| K | Elegibilidad cambia antes de confirmar | 409 `REVISION_LEGAL_PENDIENTE`; M:N habilita otra institución |
| L | Precio alterado en el navegador | Total calculado con el precio de MySQL |

Además: campos por tipo, campos ajenos, manipulación de rol/estado, NIT inválido, correo duplicado, archivos inválidos, solicitud incompleta, cambio de tipo (en borrador y aprobada), transiciones y motivos obligatorios, historial y auditoría, regresión de asistente, categorías, historial de pedidos y perfil de checkout.

## 3. Criterios de la verificación en la compra (migración 002)

Spec: `test/integration/compra-verificada.int.spec.js`, salvo que se indique otro.

| # | Criterio | Prueba |
|---|---|---|
| 1 | Registro con el formulario mínimo | `1–3. Registro mínimo`; `verificacion.int` 10.1; unitarias `account-registration-phase0` |
| 2 | La categoría elegida se guarda | `1–3` (`tipo_institucion`) |
| 3 | El registro no concede restringidos | `1–3` (`REQUIERE_VERIFICACION`, sin restringidos en el catálogo) |
| 4 | El catálogo aplica la elegibilidad en el servidor | `verificacion.int` A–E, B |
| 5 | La compra restringida exige comprobaciones | `5.` (`REQUIERE_AUTORIZACION_COMPRA`), "doble comprobación… cuatro ojos" |
| 6 | Una respuesta válida permite continuar | `6.` |
| 7 | Una ausencia en un registro público no rechaza | `7.` |
| 8 | Una respuesta ambigua no autoriza | `8.` |
| 9 | Una fuente caída no autoriza | `9.` |
| 10 | Una respuesta de n8n falsa o manipulada no autoriza | `10.`, `10b.` |
| 11 | Un resultado antiguo no se reutiliza | `11.`, `11b.` |
| 12 | Los reintentos no duplican | `12.` |
| 13 | Una cuenta suspendida no compra con un token vigente | `13.`; `verificacion.int` I |
| 14 | El cliente no altera precios, roles ni institución | `14.`; `verificacion.int` L y manipulación |
| 15 | Un administrador limitado no hace operaciones de superadministrador | `15.`; `verificacion.int` H |
| 16 | El superadministrador revisa los paneles | `16.`, `16b.`; interfaz (diagnóstico oculto para no superadministradores) |
| 17 | Sin datos sensibles en registros ni respuestas | `17.` (consola espiada, respuestas, outbox, base) |
| 18 | Las funciones previas siguen funcionando | `18.`; suites unitarias y `verificacion.int` completas; interfaz |
| 19 | Las migraciones conservan los datos | `19.` (idempotencia, reversión y reaplicación con conteos) |
| 20 | Estados consistentes | `20.` |

Pruebas manuales recomendadas, **no ejecutadas**:

- Compra restringida completa en un navegador real (diálogo del código).
- Importar W11 en n8n y procesar una solicitud real contra datos.gov.co.
- Correos reales por SMTP.
