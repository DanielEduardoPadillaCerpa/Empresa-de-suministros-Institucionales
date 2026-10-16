# Plan de respaldo y restauración

| Campo | Valor |
|---|---|
| ID documental | DOC-06-09 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN (procedimiento propuesto) |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Proponer qué respaldar, cómo y cómo restaurar. **[OBS]** El repositorio no contiene ningún mecanismo de respaldo automatizado ni evidencia de restauraciones probadas (RSK-012). Todo el contenido es **[REC]** y está PENDIENTE DE VALIDAR.

## Alcance

Base MySQL principal, documentos cifrados (`DOCUMENTOS_DIR`), claves y configuración, volumen de n8n. La operación continua se trata en [../07_MANTENIMIENTO_Y_SOPORTE/06_RESPALDO_Y_RECUPERACION.md](../07_MANTENIMIENTO_Y_SOPORTE/06_RESPALDO_Y_RECUPERACION.md).

## Activos a respaldar

| Activo | Ubicación | Criticidad | Nota |
|---|---|---|---|
| Base principal | MySQL `DB_NAME` | Muy alta | Contiene datos cifrados: sin las claves no sirven |
| Claves | `backend/.env` / gestor de secretos (`ENC_KEY*`, `HMAC_KEY`, `CRYPTO_KEY`, `CRYPTO_KEYS`, `IDENT_HMAC_KEY`, `JWT_SECRET`, `MFA_TOKEN_PEPPER`, …) | Muy alta | Respaldar **separado** de la base |
| Documentos de verificación | `DOCUMENTOS_DIR` (por defecto `backend/storage/documentos`) | Alta | Cifrados con la clave del anillo |
| Archivo de cuentas de prueba | `backend/storage/cuentas-prueba.txt` | Baja | Solo laboratorio |
| n8n | Volumen Docker `n8n_data` + `N8N_ENCRYPTION_KEY` de `n8n/.env` | Media | Credenciales de n8n cifradas con esa clave |
| Código | Repositorio Git | Media | Ya replicado en GitHub |
| Fuente del padrón | Base externa | NO APLICA | No es propiedad del sistema; solo lectura |

## Procedimiento de respaldo [REC]

1. **Base** (con el servidor detenido o en ventana de baja actividad; cuenta 1 conexión adicional):
   ```bash
   mysqldump --single-transaction --routines --triggers -h <host> -P <puerto> -u <usuario> -p <DB_NAME> > respaldo_<fecha>.sql
   ```
   Cifrar el archivo resultante y guardarlo fuera del servidor.
2. **Documentos**: copiar `DOCUMENTOS_DIR` completo (los archivos ya están cifrados).
3. **Claves**: exportar desde el gestor de secretos a un almacén offline cifrado con control de acceso de dos personas.
4. **n8n**: exportar workflows y respaldar el volumen `n8n_data`.
5. Registrar fecha, versión (commit) y suma de verificación de cada respaldo.

Frecuencia propuesta: base diaria y antes de cada despliegue; documentos diaria; claves en cada cambio. Retención: PENDIENTE (depende de la política de conservación, BUG-015).

## Restauración [REC]

1. Provisionar MySQL 8 vacío.
2. `mysql -h <host> -u <usuario> -p <DB_NAME> < respaldo_<fecha>.sql`.
3. Restaurar `DOCUMENTOS_DIR` y las **mismas** claves con las que se cifraron los datos.
4. Desplegar el commit correspondiente al respaldo (las migraciones posteriores se aplicarían al arrancar).
5. Arrancar y comprobar: `node scripts/migraciones.js estado`, inicio de sesión de prueba, apertura de una solicitud en el panel (descifrado correcto), descarga de un documento por personal autorizado.

## Pruebas de restauración

Ninguna ejecutada. **[REC]** Restaurar trimestralmente en un entorno aislado y registrar el resultado.

## Referencias

- [10_PLAN_DE_ROLLBACK.md](10_PLAN_DE_ROLLBACK.md)
- [../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md)
