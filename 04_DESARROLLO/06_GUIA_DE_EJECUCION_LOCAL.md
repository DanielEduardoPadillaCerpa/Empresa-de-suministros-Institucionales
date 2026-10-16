# Guía de ejecución local

| Campo | Valor |
|---|---|
| ID documental | DOC-04-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Explicar cómo arrancar el sistema, ejecutar cada suite de pruebas y comprobar que funciona en un entorno local.

## Alcance

Entorno de desarrollo local tras completar [05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md](05_GUIA_DE_INSTALACION_DEL_ENTORNO_DE_DESARROLLO.md). **[OBS]** En la auditoría del 2026-10-16 no se arrancó el servidor; solo se ejecutó `npm test`.

## 1. Comandos npm (desde `backend/`)

| Comando | Qué hace | Toca base de datos | Validado 2026-10-16 |
|---|---|---|---|
| `npm start` | `node server.js` | **Sí** (migra al arrancar) | No |
| `npm run dev` | `node --watch server.js` (reinicia y migra en cada guardado) | **Sí** | No |
| `npm test` | `test:assistant` (Jest) + `test:legacy` (`node --test test/*.test.js`) | No (BD simulada) | **Sí: 107/107 + 51/51** |
| `npm run test:integration` | Jest sobre `test/integration/*.int.spec.js` | Sí — **borra todas las tablas** de la base de pruebas | No (BLOQUEADO: requiere MySQL de pruebas) |
| `npm run claves:generar` | `generar-claves.js --escribir` | No (escribe `.env`) | No |
| `npm run padron:importar` | Sincroniza el padrón | Sí | No |
| `npm run medir` | Mide tiempos contra la base del `.env` | **Sí** (crea y borra cuentas sintéticas) | No |

## 2. Arrancar

```bash
cd backend
npm start
```

Salida esperada **[OBS en código]**: avisos `[config]` si faltan claves opcionales, `[db] Tablas verificadas/creadas correctamente.`, `[migraciones] …` en la primera ejecución, `[env] Archivo .env: …` y `[server] Backend corriendo en http://localhost:<PORT>`.

Abrir `http://localhost:<PORT>/` → redirige a `landing.html`. **[OBS]** El frontend usa `API_BASE = 'http://localhost:8081'` fijo (`../frontend/js/auth.js`, BUG-003): use `PORT=8081` o el frontend no encontrará la API. No abra los HTML con `file://` (origen nulo rechazado por CORS según README).

## 3. Primer acceso

1. Con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (≥12) definidos, el primer arranque crea un administrador con todos los permisos de staff (salvo `identificadores.ver`) y **cambio de contraseña obligatorio**.
2. Inicie sesión en `login.html` (captcha + código MFA en Mailpit `http://localhost:8025` o en la consola).
3. Para superadministrador: `node scripts/crear-superadmin.js --correo <correo> --confirmar-base <DB_NAME>` (ver [15_INVENTARIO_DE_SCRIPTS.md](15_INVENTARIO_DE_SCRIPTS.md)).
4. Flujo de prueba sugerido por `../docs/REGISTRO_VERIFICADO.md` §6: registrar `Juan Camilo Rodríguez`, NIT `999000001-2`, institución Policía (datos sintéticos del padrón de laboratorio) → aprobar en `admin-solicitudes.html` → iniciar sesión. *PENDIENTE DE VALIDACIÓN*.

## 4. Pruebas de integración y de interfaz (no ejecutadas)

```bash
# MySQL de pruebas (puerto 3307; el nombre de la base debe contener "test")
docker run -d --name suministros-test-mysql -e MYSQL_ROOT_PASSWORD=<definir> \
  -e MYSQL_DATABASE=suministros_test -e MYSQL_USER=test -e MYSQL_PASSWORD=<definir> -p 3307:3306 mysql:8.0
# Variables TEST_DB_HOST, TEST_DB_PORT, TEST_DB_USER, TEST_DB_PASSWORD, TEST_DB_NAME
npm run test:integration

# Interfaz (jsdom): base suministros_ui_test vacía
node test/ui/servidor-prueba.js     # terminal 1, servidor en :8091
node test/ui/ui-e2e.js              # terminal 2
```

Fuente: `../docs/PLAN_PRUEBAS.md`. **[OBS]** La suite de integración se niega a ejecutarse si la base no es local o su nombre no contiene `test`. Resultados históricos (2026-10-13): integración 48/48 e interfaz 43/43 (`../docs/RESULTADOS_PRUEBAS.md`) — evidencia histórica no reproducida.

## 5. Comprobaciones rápidas

| Comprobación | Resultado esperado |
|---|---|
| `GET /` con `Accept: application/json` | `{"status":"ok","servicio":"Suministros Institucionales - Backend"}` |
| `GET /api/auth/registro/tipos` | Lista de tipos de institución (público, caché 300 s) |
| `GET /api/auth/captcha` | `{ id, svg }` con `Cache-Control: no-store` |
| `node scripts/migraciones.js estado` | 001, 002 y 003 aplicadas |

## 6. Detener

`Ctrl+C`. **[OBS]** Detenga el servidor antes de correr scripts que abren conexiones contra la misma base (límite de 5 conexiones del plan gratuito).

## Referencias

- [14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md](14_SOLUCION_DE_PROBLEMAS_CONOCIDOS.md) · [15_INVENTARIO_DE_SCRIPTS.md](15_INVENTARIO_DE_SCRIPTS.md)
- [../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md](../05_PRUEBAS/10_RESULTADOS_DE_EJECUCION.md)
- [../docs/PLAN_PRUEBAS.md](../docs/PLAN_PRUEBAS.md)
