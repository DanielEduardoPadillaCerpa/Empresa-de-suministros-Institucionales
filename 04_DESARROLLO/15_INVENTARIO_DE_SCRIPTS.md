# Inventario de scripts

| Campo | Valor |
|---|---|
| ID documental | DOC-04-15 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Inventariar todos los scripts ejecutables del proyecto, su uso y, sobre todo, su **riesgo** (qué tocan).

## Alcance

**[OBS]** Scripts npm de `../backend/package.json`, utilidades de `../backend/scripts/`, generadores de `../n8n/`, servidores de prueba de `../backend/test/ui/` y archivos sueltos de `../backend/`. Ninguno se ejecutó en la auditoría, salvo `npm test`. Fichas ampliadas en [Scripts_y_Herramientas/](Scripts_y_Herramientas/README.md).

Nivel de riesgo: 🟢 sin efectos externos · 🟡 escribe archivos locales o una base de pruebas · 🔴 **escribe en la base configurada en `backend/.env`** (puede ser la real) o envía correos reales.

## 1. Scripts npm (desde `backend/`)

| Script | Comando | Efecto | Riesgo |
|---|---|---|---|
| `start` | `node server.js` | Arranca, **migra** la base del `.env`, sincroniza padrón, workers | 🔴 |
| `dev` | `node --watch server.js` | Igual, reiniciando y migrando en cada guardado | 🔴 |
| `test` | `test:assistant && test:legacy` | Jest (4 archivos) + `node --test test/*.test.js`; BD simulada | 🟢 (ejecutado: 107/107 + 51/51) |
| `test:assistant` | `jest --runInBand` | Suites Jest | 🟢 |
| `test:legacy` | `node --test test/*.test.js` | Suites `node:test` | 🟢 |
| `test:integration` | `jest --runInBand --testMatch "**/test/integration/*.int.spec.js"` | **Borra todas las tablas** de la base de pruebas; se niega si no es local con `test` en el nombre | 🟡 |
| `claves:generar` | `node scripts/generar-claves.js --escribir` | Agrega a `backend/.env` claves faltantes (respaldo `.env.respaldo-*`) | 🟡 (produce secretos) |
| `padron:importar` | `node scripts/importar-padron.js` | Lee la fuente del padrón y escribe `padron_institucional` | 🔴 |
| `medir` | `node scripts/medir-rendimiento.js` | Crea cuentas `medicion-*@lab.local` y un admin temporal en la base del `.env`, mide y borra lo creado | 🔴 |

## 2. Utilidades de `backend/scripts/`

| Script | Uso | Protecciones [OBS] | Riesgo |
|---|---|---|---|
| `migraciones.js` | `estado` · `revertir <version> --confirmo-perdida-de-datos` | Exige la bandera explícita para revertir | 🔴 (revertir es destructivo) |
| `crear-superadmin.js` | `--correo <c> --confirmar-base <DB_NAME> [--promover] [--adicional]` | `--confirmar-base` debe igualar `DB_NAME`; contraseña de `SUPERADMIN_PASSWORD` (≥16) o aleatoria mostrada solo en terminal interactiva; cambio obligatorio; auditado | 🔴 |
| `crear-cuentas-prueba.js` | `--confirmar-base <DB_NAME> [--salida ruta]` | Se niega con `NODE_ENV=production` o base sin `test/dev/local/prueba`; correos `.test`; contraseñas a archivo 0600 en `backend/storage/` | 🟡 |
| `generar-claves.js` | sin argumentos (muestra) o `--escribir` | Nunca reemplaza una clave existente | 🟡 |
| `importar-padron.js` | sin argumentos | Fuente solo lectura; idempotente | 🔴 |
| `medir-rendimiento.js` | `[--repeticiones 6] [--conservar]` | Borra solo lo que creó (salvo `--conservar`); no imprime códigos | 🔴 |

## 3. n8n

| Script | Uso | Efecto | Riesgo |
|---|---|---|---|
| `n8n/generar-w11.js` | `node n8n/generar-w11.js` | Reescribe `n8n/workflows/W11-verificacion-compra.json` | 🟡 |
| `n8n/generar-w12.js` | `node n8n/generar-w12.js` | Reescribe `n8n/workflows/W12-avisos-registro.json` | 🟡 |
| `n8n/docker-compose.yml` | `docker compose -p n8n -f n8n/docker-compose.yml up -d n8n` | Levanta n8n 1.110.1 con volumen `n8n_data` (credenciales cifradas con `N8N_ENCRYPTION_KEY`) | 🟡 |

## 4. Pruebas de interfaz

| Script | Uso | Efecto | Riesgo |
|---|---|---|---|
| `backend/test/ui/servidor-prueba.js` | `node test/ui/servidor-prueba.js` | Backend real en :8091 contra `suministros_ui_test` (Docker) y receptor MFA local; no usa el `.env` real | 🟡 |
| `backend/test/ui/ui-e2e.js` | `node test/ui/ui-e2e.js` | Pruebas jsdom contra :8091 | 🟡 |

## 5. Archivos sueltos

| Archivo | Situación | Riesgo |
|---|---|---|
| `backend/probar-mfa-n8n.js` | **Roto**: requiere `./src/mfaCourier` (eliminado). Si funcionara, enviaría un correo real con el código `123456` mediante W5 | 🔴 (BUG-009) |
| `backend/scratch_detalle.js` | Fragmento de 24 líneas de la ruta de detalle; no se carga | 🟢 (BUG-009) |
| `backend/generarHash.js` | No versionado (ignorado); contiene contraseña fija según `../docs/AUDITORIA_TECNICA.md` A4 | No inspeccionado |

## 6. Recomendaciones [REC]

- Antes de cualquier script 🔴, comprobar `DB_HOST`/`DB_NAME` del `.env` sin imprimir credenciales y detener el servidor (límite de conexiones).
- Retirar o reparar `probar-mfa-n8n.js` y `scratch_detalle.js`.
- Añadir un script `npm run migraciones:estado` para consulta segura.

## Referencias

- [Scripts_y_Herramientas/README.md](Scripts_y_Herramientas/README.md) · [06_GUIA_DE_EJECUCION_LOCAL.md](06_GUIA_DE_EJECUCION_LOCAL.md)
- [../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
