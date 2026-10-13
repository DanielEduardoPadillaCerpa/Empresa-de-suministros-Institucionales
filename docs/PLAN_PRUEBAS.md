# Plan de pruebas

| Suite | Comando (desde `backend/`) | Qué cubre | Dependencias |
|---|---|---|---|
| Unitarias Jest | `npx jest --runInBand` | Registro (contrato nuevo), permisos de restringidos, asistente, mi-cuenta, checkout, migración idempotente | Ninguna (BD simulada) |
| Unitarias `node:test` | `npm run test:legacy` | MFA, outbox, comprobantes, pagos, segmentación | Ninguna |
| Integración | `npm run test:integration` | Escenarios A–L contra MySQL real con la app Express completa | MySQL local de pruebas |
| Interfaz (jsdom) | Terminal 1: `node test/ui/servidor-prueba.js` · Terminal 2: `node test/ui/ui-e2e.js` | Registro por pasos, Mi verificación, panel de revisión, catálogo aprobado | Servidor de prueba en :8091 |

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
