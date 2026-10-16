# Scripts y herramientas — fichas

| Campo | Valor |
|---|---|
| ID documental | DOC-04-SCR-00 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Fichas de uso seguro de cada utilidad. El resumen con niveles de riesgo está en [../15_INVENTARIO_DE_SCRIPTS.md](../15_INVENTARIO_DE_SCRIPTS.md).

## Alcance

**[OBS]** Basado en los comentarios de cabecera y el código de cada script. No se ejecutó ninguno salvo `npm test`. No se crean scripts nuevos en esta carpeta.

## Fichas

### generar-claves.js
- **Ruta:** `../../backend/scripts/generar-claves.js` · `npm run claves:generar`
- **Hace:** genera `ENC_KEY` y `HMAC_KEY` (32 bytes hex, distintas) y `JWT_SECRET` (48 bytes hex). Sin `--escribir` solo las muestra; con `--escribir` agrega a `backend/.env` las que **falten** y guarda antes un respaldo `.env.respaldo-*`.
- **Precauciones:** la salida contiene secretos: no ejecutar en CI ni compartir la terminal. Los respaldos `.env.respaldo-*` también son secretos (ignorados por Git).

### migraciones.js
- **Ruta:** `../../backend/scripts/migraciones.js`
- **Uso:** `node scripts/migraciones.js estado` · `node scripts/migraciones.js revertir <version> --confirmo-perdida-de-datos`
- **Hace:** consulta `schema_migraciones` o ejecuta el `down()` de 001/002/003.
- **Precauciones:** usa la base del `.env`. Respaldo previo obligatorio. Revertir no restaura el código.

### crear-superadmin.js
- **Ruta:** `../../backend/scripts/crear-superadmin.js`
- **Uso:** `node scripts/crear-superadmin.js --correo <correo> --confirmar-base <DB_NAME> [--promover] [--adicional]`
- **Hace:** crea (o promueve) un superadministrador con cambio obligatorio de contraseña; auditado (`crear_superadmin`/`promover_superadmin`). Idempotente.
- **Precauciones:** contraseña desde `SUPERADMIN_PASSWORD` (≥16, borrar después) o aleatoria mostrada solo en terminal interactiva. No hay endpoint HTTP equivalente (RN-018).

### crear-cuentas-prueba.js
- **Ruta:** `../../backend/scripts/crear-cuentas-prueba.js`
- **Uso:** `node scripts/crear-cuentas-prueba.js --confirmar-base <DB_NAME> [--salida ruta]`
- **Hace:** 8 perfiles sintéticos (`general@`, `policia@`, `bomberos@`, `socorro@`, `pendiente@`, `autorizada@`, `suspendida@`, `revisor@` en `suministros-prueba.test`), marcados `es_cuenta_prueba`.
- **Precauciones:** se niega en producción o si la base no contiene `test/dev/local/prueba`. El archivo de contraseñas (0600, `backend/storage/cuentas-prueba.txt`) es sensible.

### importar-padron.js
- **Ruta:** `../../backend/scripts/importar-padron.js` · `npm run padron:importar`
- **Hace:** copia la fuente (`PADRON_DB_URI`) a `padron_institucional` cifrada; filas desaparecidas → `inactiva`. Nunca escribe en la fuente.
- **Precauciones:** procesa datos personales; detener el servidor si comparte el límite de conexiones.

### medir-rendimiento.js
- **Ruta:** `../../backend/scripts/medir-rendimiento.js` · `npm run medir`
- **Uso:** `[--repeticiones 6] [--conservar]`
- **Hace:** levanta la app en el mismo proceso, crea cuentas `medicion-*@lab.local` y un administrador temporal, mide registro, login paso 1, aprobar, rechazar y contador, y borra lo creado.
- **Precauciones:** escribe en la base real del `.env`; correos descartados. Resultados históricos en `../../docs/REGISTRO_VERIFICADO.md` §5.

### generar-w11.js / generar-w12.js
- **Ruta:** `../../n8n/generar-w11.js`, `../../n8n/generar-w12.js`
- **Hace:** regeneran los JSON de W11 y W12 a partir del código de sus nodos (más fácil de revisar que el JSON).
- **Precauciones:** sobrescriben `n8n/workflows/W11-…json`/`W12-…json`; re-importar en n8n tras regenerar.

### servidor-prueba.js / ui-e2e.js
- **Ruta:** `../../backend/test/ui/`
- **Hace:** servidor real en :8091 contra `suministros_ui_test` y pruebas jsdom del registro, Mi verificación, panel y catálogo.
- **Precauciones:** requiere MySQL de pruebas; reiniciar el servidor entre corridas (límite de login).

### probar-mfa-n8n.js (obsoleto)
- **Ruta:** `../../backend/probar-mfa-n8n.js`
- **Estado:** roto (requiere `src/mfaCourier.js`, eliminado) y obsoleto (W5 sin uso). No ejecutar. BUG-009.

## Referencias

- [../15_INVENTARIO_DE_SCRIPTS.md](../15_INVENTARIO_DE_SCRIPTS.md) · [../../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
