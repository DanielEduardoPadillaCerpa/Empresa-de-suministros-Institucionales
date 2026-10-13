# Resultados de pruebas — 2026-10-13

Entorno: Windows 11, Node.js 24.19.0, MySQL 8.0 en Docker (puerto 3307), base `suministros_test`.

| Suite | Resultado |
|---|---|
| Jest unitarias | **101/101** (antes del cambio: 99/99; 6 pruebas se actualizaron porque el contrato cambió a propósito y se agregaron 2 de escalada de privilegios) |
| `node:test` | **32/32** |
| Integración MySQL | **24/24**, incluidos los escenarios A–L |
| Interfaz jsdom | **32/32** verificaciones |
| Migración en base vacía (dos veces) | Correcta e idempotente; 12 productos restringidos quedan en revisión `pendiente`; el administrador inicial recibe 7 permisos |
| Migración sobre esquema anterior con datos | Correcta: cliente heredado → `borrador`; correo verificado a partir de su MFA previo; pedidos y auditoría intactos |
| Reversión y reaplicación | Correctas (la reversión exige `--confirmo-perdida-de-datos`) |
| `npm audit --omit=dev` | 1 vulnerabilidad alta preexistente en `nodemailer` (pendiente) |

## Clasificación del estado

| Elemento | Implementado | Probado automáticamente | Verificado en integración | Pendiente |
|---|---|---|---|---|
| Registro condicional por tipo | Sí | Sí | Sí (MySQL + interfaz) | — |
| Estados, historial y auditoría | Sí | Sí | Sí | — |
| Documentos privados cifrados | Sí | Sí | Sí | Antivirus no disponible |
| Autorización central (catálogo, detalle, asistente, checkout) | Sí | Sí | Sí | — |
| Permisos de staff diferenciados | Sí | Sí | Sí | — |
| Panel de revisión y cumplimiento | Sí | Sí (jsdom) | Sí | Prueba manual en navegador real no realizada |
| MFA y correo | Sin cambios funcionales | Sí (pruebas existentes) | Con receptor local | Envío real por n8n no probado |
| Producción (Clever Cloud) | Migración aplicada por el servidor `--watch` del usuario | — | Solo lectura | Decisión sobre cuentas heredadas |
| Reglas de productos por normativa | Herramienta lista | — | — | Validación jurídica (ver matrices) |

No se afirma que la plataforma sea completamente segura: las pruebas cubren los escenarios definidos, no todos los posibles.
