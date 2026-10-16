# Manual técnico y administrativo

| Campo | Valor |
|---|---|
| ID documental | DOC-06-12 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Guiar al personal técnico y administrativo en las tareas de operación: cuentas privilegiadas, aprobaciones, permisos, padrón, diagnóstico y comandos.

## Alcance

Comandos de `../backend/scripts/` y funciones administrativas de la interfaz. Ningún comando se ejecutó en esta auditoría (PENDIENTE DE VALIDAR), salvo `npm test`.

> **[REC]** Antes de ejecutar cualquier script que abra conexiones, detener el servidor (límite de 5 conexiones, RSK-004) y confirmar que `.env` apunta a la base correcta.

## 1. Comandos disponibles

| Comando (desde `backend/`) | Función |
|---|---|
| `npm start` | Arranca el servidor (aplica migraciones) |
| `npm run dev` | Arranque con recarga (`node --watch`); **nunca contra producción** |
| `npm test` | Jest + node:test (sin base real) — Verificado 2026-10-16 |
| `npm run test:integration` | Integración contra MySQL local de pruebas |
| `npm run claves:generar` | Agrega a `.env` las claves que falten (`ENC_KEY`, `HMAC_KEY`, `JWT_SECRET`) con respaldo |
| `npm run padron:importar` | Fuerza la copia cifrada del padrón |
| `npm run medir` | Mide tiempos contra la base real con cuentas sintéticas que luego borra |
| `node scripts/migraciones.js estado \| revertir <v> --confirmo-perdida-de-datos` | Estado y reversión de migraciones |
| `node scripts/crear-superadmin.js …` | Superadministrador |
| `node scripts/crear-cuentas-prueba.js …` | Cuentas sintéticas |

## 2. Crear el superadministrador

```bash
# Opción A: contraseña propia (16 a 72 caracteres) sin dejarla en el historial
read -s SUPERADMIN_PASSWORD && export SUPERADMIN_PASSWORD
node scripts/crear-superadmin.js --correo <correo> --confirmar-base <DB_NAME>
unset SUPERADMIN_PASSWORD

# Opción B: contraseña aleatoria mostrada una sola vez (solo terminal interactiva)
node scripts/crear-superadmin.js --correo <correo> --confirmar-base <DB_NAME>
```
- `--confirmar-base` debe coincidir con `DB_NAME`. `--promover` convierte un administrador existente; `--adicional` crea un segundo superadministrador. No convierte cuentas de cliente.
- La cuenta queda con cambio obligatorio de contraseña y MFA. Queda en `auditoria`.
- No hay endpoint HTTP para crear superadministradores (RN-018).

## 3. Administrador inicial

Se crea al arrancar solo si no hay administradores y `ADMIN_EMAIL`/`ADMIN_PASSWORD` (≥ 12) están definidos. Recibe los permisos de staff excepto `identificadores.ver`, **no** es superadministrador y debe cambiar la contraseña. La contraseña no se escribe en los registros.

## 4. Cuentas de prueba sintéticas (solo laboratorio)

```bash
node scripts/crear-cuentas-prueba.js --confirmar-base <DB_NAME> [--salida ruta]
```
Se niega con `NODE_ENV=production` o si el nombre de la base no contiene `test`, `dev`, `local` o `prueba`. Correos `@suministros-prueba.test`; contraseñas en `backend/storage/cuentas-prueba.txt` (permisos 0600, fuera de git). Las cuentas no pueden comprar en producción.

## 5. Aprobar o rechazar solicitudes de registro

1. Entrar con un administrador con `clientes.gestionar` (o superadministrador) a `admin-solicitudes.html`.
2. Abrir la solicitud: se ven el nombre y NIT declarados, el resultado al registrar y el resultado actual contra el padrón (la apertura queda auditada).
3. Resultados: `coincide`, `nit_no_existe`, `nombre_no_coincide`, `institucion_no_coincide`, `persona_inactiva`, `padron_no_disponible`.
4. **Aprobar**: si no es `coincide`, marcar la confirmación explícita. **Rechazar**: motivo de 5 a 500 caracteres (se envía al solicitante; no se guarda en auditoría).
5. Si otro administrador ya decidió, se responde `YA_DECIDIDA`.

## 6. Permisos de personal

Pestaña de personal y permisos en `admin-verificaciones.html` (`staff.permisos`). 13 permisos: `verificacion.ver`, `verificacion.decidir`, `verificacion.confirmar_institucion`, `documentos.ver`, `identificadores.ver`, `cuentas.suspender`, `restringidos.autorizar`, `productos.cumplimiento`, `catalogo.gestionar`, `pedidos.gestionar`, `clientes.gestionar`, `auditoria.ver`, `staff.permisos`. Reglas (RN-017): solo se conceden permisos propios; `staff.permisos` e `identificadores.ver` solo los concede el superadministrador; nadie modifica sus propios permisos; el personal nuevo nace sin permisos y con contraseña temporal.

## 7. Verificación institucional y restringidos

Revisión con doble comprobación (vínculo documental, canal independiente por otra persona, entidad), tabla de decisión, suspensión y concesión de restringidos. Detalle en [../docs/POLITICA_VERIFICACION_IDENTIDAD.md](../docs/POLITICA_VERIFICACION_IDENTIDAD.md). Acceso al número completo del documento solo con `identificadores.ver` y justificación ≥ 20 caracteres (auditado).

## 8. Diagnóstico

Superadministrador → pestaña **Diagnóstico** (`GET /api/verificacion/admin/diagnostico`): migraciones aplicadas, colas (correo, outbox n8n) y configuraciones presentes, sin valores.

## 9. Padrón

Sincronización automática al arrancar y cada `PADRON_SYNC_MINUTOS`; manual con `npm run padron:importar`. Las filas que desaparecen de la fuente quedan `inactiva`; la fuente nunca se modifica.

## 10. Tareas periódicas automáticas del backend

| Tarea | Frecuencia |
|---|---|
| Expiración de pedidos y liberación de reservas | 60 s |
| Mantenimiento de verificaciones | 5 min |
| Worker de correo de comprobantes | 5 s (máx. 5 intentos) |
| Worker del outbox n8n | 5 s (máx. 8 intentos) |
| Sincronización del padrón | `PADRON_SYNC_MINUTOS` (10) |

## 11. Auditoría

`GET /api/auditoria` (permiso `auditoria.ver`), filtros `entidad` y `limite` (máx. 500). No hay pantalla dedicada identificada [OBS].

## Referencias

- [../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
- [../docs/REGISTRO_VERIFICADO.md](../docs/REGISTRO_VERIFICADO.md)
- [../03_DISENO/10_DISENO_DE_SEGURIDAD.md](../03_DISENO/10_DISENO_DE_SEGURIDAD.md)
- [../07_MANTENIMIENTO_Y_SOPORTE/03_GUIA_DE_DIAGNOSTICO.md](../07_MANTENIMIENTO_Y_SOPORTE/03_GUIA_DE_DIAGNOSTICO.md)
