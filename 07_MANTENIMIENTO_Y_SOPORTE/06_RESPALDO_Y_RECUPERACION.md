# Respaldo y recuperación (operación)

| Campo | Valor |
|---|---|
| ID documental | DOC-07-06 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Definir, desde la operación continua, qué activos deben respaldarse y cómo comprobar que un respaldo se puede restaurar. El plan formal (frecuencias, retención, procedimiento de restauración de despliegue) está en [../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md](../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md); este documento no lo duplica.

## Alcance

Base MySQL, archivos privados, claves y n8n.

## 1. Situación actual [OBS]

- **No existe ningún respaldo automatizado** en el repositorio (sin scripts, cron ni tareas programadas de respaldo). RSK-012.
- La documentación previa pide `mysqldump` manual antes de desplegar (`docs/GUIA_INSTALACION_Y_DESPLIEGUE.md`).
- `scripts/generar-claves.js` guarda una copia del `.env` antes de modificarlo (`backend/.env.respaldo-*`, excluido de Git por `.gitignore`).
- Existe un respaldo local previo del código en `.respaldo-pre-verificacion/` (excluido de Git; no inspeccionado en esta auditoría).
- No se conoce la política de respaldos del plan de Clever Cloud usado: **NO DETERMINADO**.

## 2. Activos a respaldar

| Activo | Ubicación | Por qué | Sensibilidad |
|---|---|---|---|
| Base MySQL | Definida por `DB_*` (Clever Cloud) | Cuentas, pedidos, pagos, verificaciones, auditoría, padrón cifrado | Alta (datos personales cifrados y en claro) |
| Documentos de verificación | `DOCUMENTOS_DIR` (por defecto `backend/storage/documentos`, excluido de Git) | Evidencia cifrada; sin ella no se recuperan | Alta |
| Archivo de cuentas de prueba | `backend/storage/cuentas-prueba.txt` | Contraseñas sintéticas | Media |
| Claves | `ENC_KEY` (+ `ENC_KEY_V*`), `HMAC_KEY`, `CRYPTO_KEY`, `CRYPTO_KEYS`, `IDENT_HMAC_KEY`, `JWT_SECRET`, `MFA_TOKEN_PEPPER`, secretos n8n | **Sin ellas los datos cifrados son irrecuperables** (RSK-001) | Crítica |
| Volumen n8n | `n8n_n8n_data` (workflows y credenciales) | Configuración de automatizaciones | Alta |
| `N8N_ENCRYPTION_KEY` | `n8n/.env` | Cifra las credenciales guardadas en n8n; no debe cambiar | Crítica |
| Código | Repositorio Git (GitHub) | Ya respaldado por Git | Baja |

> Las claves **no** deben guardarse junto con el volcado de la base: un mismo robo comprometería ambos. [REC] Guardarlas en un gestor de secretos o bóveda separada.

## 3. Procedimiento propuesto [REC]

1. Detener escrituras o elegir horario de baja actividad; recordar el límite de 5 conexiones.
2. Volcado lógico: `mysqldump --single-transaction --routines --triggers <DB_NAME> > respaldo-AAAAMMDD.sql` (credenciales por archivo de opciones, no en la línea de comandos).
3. Copiar `DOCUMENTOS_DIR` completo.
4. Respaldar el volumen n8n: `docker run --rm -v n8n_n8n_data:/datos -v <destino>:/respaldo alpine tar czf /respaldo/n8n-AAAAMMDD.tgz -C /datos .` [INF: comando estándar no probado aquí].
5. Cifrar los archivos de respaldo y calcular su SHA-256.
6. Registrar fecha, tamaño, hash y ubicación (sin secretos).

## 4. Verificación de restauración [REC]

1. Crear una base MySQL 8 local de pruebas (nombre con `test`).
2. Restaurar el volcado; copiar `DOCUMENTOS_DIR` a una carpeta temporal.
3. Configurar un `.env` de pruebas con las **mismas claves** del respaldo.
4. Arrancar el backend y verificar: `node scripts/migraciones.js estado` muestra 001–003 aplicadas; un administrador puede abrir el detalle de una solicitud (descifra NIT y nombre); la descarga de un documento funciona.
5. Comparar conteos de tablas clave (`usuarios`, `clientes`, `pedidos`, `solicitudes_registro`) con el origen.
6. Destruir la copia de prueba y registrar el resultado (MNT-11).

**[OBS]** No hay ninguna prueba de restauración registrada a la fecha.

## Referencias

- [../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md](../06_IMPLEMENTACION/09_PLAN_DE_RESPALDO_Y_RESTAURACION.md)
- [08_PLAN_DE_CONTINUIDAD.md](08_PLAN_DE_CONTINUIDAD.md)
- [../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md)
- [../n8n/docker-compose.yml](../n8n/docker-compose.yml)
