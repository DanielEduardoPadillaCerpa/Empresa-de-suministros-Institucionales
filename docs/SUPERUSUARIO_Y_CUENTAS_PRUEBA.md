# Superadministrador y cuentas de prueba

## 1. Crear el superadministrador

Desde `backend/`, con `.env` apuntando a la base correcta:

```bash
# Opción A: contraseña inicial propia (16 a 72 caracteres), sin dejarla en el historial de la terminal
read -s SUPERADMIN_PASSWORD && export SUPERADMIN_PASSWORD
node scripts/crear-superadmin.js --correo persona@dominio.gov.co --confirmar-base <DB_NAME>
unset SUPERADMIN_PASSWORD

# Opción B: contraseña aleatoria, mostrada UNA vez (solo en una terminal interactiva)
node scripts/crear-superadmin.js --correo persona@dominio.gov.co --confirmar-base <DB_NAME>
```

Qué garantiza el comando (probado en `compra-verificada.int.spec.js` §16):

- `--confirmar-base` debe coincidir con `DB_NAME`, para no operar sobre la base equivocada.
- No hay contraseñas fijas en el código ni en la documentación. Si no hay `SUPERADMIN_PASSWORD` ni terminal interactiva, el comando se niega a generar una contraseña que quedaría en un registro de CI.
- La contraseña nunca se escribe en un registro. La opción A no la imprime.
- Es idempotente: si el correo ya es superadministrador, no cambia nada. Para un segundo superadministrador hace falta `--adicional`, y para promover a un administrador existente, `--promover` (conserva su contraseña y cierra sus sesiones).
- No convierte cuentas de cliente.
- La cuenta queda con `debe_cambiar_password = TRUE`. Hasta cambiarla, solo puede consultar su cuenta y cambiar la contraseña (`PASSWORD_CHANGE_REQUIRED`). El inicio de sesión exige MFA por correo como cualquier cuenta.
- La creación queda en `auditoria` (`crear_superadmin` / `promover_superadmin`) con el host de origen.

Si el entorno no permite ejecutar comandos (por ejemplo, un PaaS sin consola), se ejecuta desde un equipo de operación con acceso a la base, con las mismas variables. No hay endpoint HTTP para crear superadministradores.

El administrador que crea `ADMIN_EMAIL`/`ADMIN_PASSWORD` al primer arranque **no es superadministrador** y también debe cambiar su contraseña.

## 2. Facultades

| Puede | Cómo |
|---|---|
| Ver todos los paneles administrativos: pedidos, clientes, productos, categorías, auditoría, verificaciones y permisos | Tiene de forma implícita todos los permisos de staff, **excepto los de datos personales** |
| Conceder `staff.permisos` e `identificadores.ver`, y modificar a otros superadministradores | Reservado al superadministrador |
| Consultar el diagnóstico (migraciones, colas, configuración presente) | `GET /api/verificacion/admin/diagnostico`, pestaña *Diagnóstico* |
| Probar los flujos de cliente | Con las cuentas sintéticas de la sección 3, **no** suplantando cuentas reales (no existe la suplantación) |

No tiene por defecto (debe concedérselo explícitamente, y queda auditado):

- `documentos.ver`: descargar la evidencia;
- `identificadores.ver`: ver el número completo del documento. Exige además una justificación de 20 caracteres o más en cada acceso, que queda en `auditoria` (`ver_identificador`) sin el número.

Nunca accede a contraseñas (solo hay hashes bcrypt), códigos MFA (solo hay HMAC), claves criptográficas ni secretos de n8n: viven en variables de entorno, no en la base.

### Límites de un administrador no superadministrador con `staff.permisos`

- Solo concede o retira los permisos que él mismo tiene.
- Nunca los reservados.
- No modifica sus propios permisos ni a un superadministrador.
- El personal que crea debe cambiar la contraseña temporal en su primer acceso.

## 3. Cuentas de prueba sintéticas

```bash
node scripts/crear-cuentas-prueba.js --confirmar-base <DB_NAME> [--salida ruta]
```

- Se niega con `NODE_ENV=production` o si el nombre de la base no contiene `test`, `dev`, `local` o `prueba`.
- Los correos usan `@suministros-prueba.test` (dominio reservado `.test`): nunca llegan a un buzón real ni coinciden con dominios institucionales. Las organizaciones usan NIT sintéticos con prefijo `999`.
- Las contraseñas son aleatorias y se escriben en un archivo con permisos 0600 (por defecto `backend/storage/cuentas-prueba.txt`, fuera de git). No se imprimen.
- Las cuentas quedan marcadas `es_cuenta_prueba`: **en producción no pueden comprar** (`CUENTA_DE_PRUEBA`). Las comprobaciones sintéticas llevan `fuente = 'cuenta_de_prueba'` y la observación "Dato sintético".
- Es idempotente.

| Perfil | Correo | Estado |
|---|---|---|
| Cuenta general (empresa) | `general@` | Activa, sin verificar |
| Policía | `policia@` | Activa, sin verificar |
| Bomberos (voluntario) | `bomberos@` | Activa, sin verificar |
| Socorro (Defensa Civil) | `socorro@` | Activa, sin verificar |
| Pendiente de verificación | `pendiente@` | En verificación (comprobaciones pendientes) |
| Autorizada para comprar | `autorizada@` | Verificada (Policía) y autorizada para restringidos |
| Suspendida | `suspendida@` | Suspendida |
| Administrador limitado | `revisor@` | Staff con solo `verificacion.ver` |

El inicio de sesión exige MFA. Con Mailpit local, los códigos llegan a http://localhost:8025.

**No se deben crear en la base de producción.** El script lo impide por nombre y por `NODE_ENV`. Si alguna vez fuera necesario un entorno de prueba en el mismo servidor, debe usar otra base.
