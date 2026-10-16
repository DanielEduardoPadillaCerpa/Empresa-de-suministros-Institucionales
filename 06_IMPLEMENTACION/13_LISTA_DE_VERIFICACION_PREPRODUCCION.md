# Lista de verificación preproducción

| Campo | Valor |
|---|---|
| ID documental | DOC-06-13 |
| Versión | 1.0 |
| Estado | BORRADOR — PLANTILLA SIN DILIGENCIAR |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Lista de control que debe diligenciarse antes de exponer el sistema a usuarios reales.

## Alcance

Código, configuración, datos, seguridad, integraciones, operación y aprobaciones. **Ninguna casilla se marca en este documento**: se marca durante la verificación real, indicando fecha, responsable y evidencia.

## Bloqueantes conocidos

- [ ] Existe una forma válida de arrancar con `NODE_ENV=production` (hoy imposible: mock prohibido y pasarela real no implementada; REQ-F-040, RSK-015).
- [ ] BUG-001 corregido: `/api/reportes/mensual` exige autenticación y permiso.
- [ ] BUG-003 resuelto: `API_BASE` del frontend coincide con el origen público.
- [ ] BUG-006 resuelto o aceptado formalmente: `nodemailer` actualizado y envíos reprobados.
- [ ] HTTPS habilitado con HSTS y CSP (BUG-012, REQ-NF-016).

## Código y versión

- [ ] Rama `feature/verificacion-seguridad` revisada y fusionada en `main` (BUG-018).
- [ ] Etiqueta de versión creada y registrada en [16](16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md).
- [ ] Archivos residuales retirados o justificados (BUG-007, BUG-009).
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas sin tratar.

## Pruebas

- [ ] `npm test` aprobado sobre la versión a liberar.
- [ ] `npm run test:integration` aprobado contra MySQL de pruebas.
- [ ] Pruebas de interfaz (`test/ui`) aprobadas.
- [ ] Prueba manual de compra restringida completa en navegador real.
- [ ] Correos reales recibidos (MFA, aprobación/rechazo, comprobante, autorización de compra).

## Configuración y secretos

- [ ] `NODE_ENV`, `CORS_ORIGINS`, `TRUST_PROXY_HOPS` definidos para el entorno.
- [ ] Secretos generados aleatoriamente y distintos por propósito; ninguno de laboratorio reutilizado.
- [ ] Contraseña de la base del padrón rotada (RSK-002).
- [ ] Claves de cifrado respaldadas fuera del servidor con control de acceso.
- [ ] `ADMIN_PASSWORD` y `SUPERADMIN_PASSWORD` retirados del entorno después de usarse.
- [ ] `BCRYPT_COST=12`.
- [ ] `DOCUMENTOS_DIR` en almacenamiento persistente y privado.
- [ ] `SMTP_*` configurado con SPF/DKIM/DMARC.

## Base de datos

- [ ] Base dedicada al entorno (no compartida con desarrollo).
- [ ] Respaldo completo previo tomado **y restaurado** con éxito en otro entorno.
- [ ] `node scripts/migraciones.js estado` muestra 001, 002 y 003 aplicadas.
- [ ] Revisadas cuentas heredadas (`borrador`) y productos con `revision_legal='pendiente'`.
- [ ] Preguntas frecuentes del asistente sin textos `[COMPLETAR: …]`.
- [ ] Productos y precios de ejemplo revisados o retirados.

## Integraciones

- [ ] Fuente del padrón oficial definida (no la base de laboratorio) con usuario de solo lectura.
- [ ] Decisión sobre W11 y el NIT a n8n registrada (BUG-014).
- [ ] Workflows n8n necesarios importados, con credenciales, y activados; los sin uso (W5, W9) desactivados.

## Cumplimiento y operación

- [ ] Aviso de privacidad, política de tratamiento y plazos de conservación validados jurídicamente (RSK-010, BUG-015).
- [ ] Régimen de productos restringidos validado.
- [ ] Responsables de operación, soporte y aprobaciones asignados (RSK-013).
- [ ] Procedimiento de incidentes y monitoreo definidos ([../07_MANTENIMIENTO_Y_SOPORTE/](../07_MANTENIMIENTO_Y_SOPORTE/01_PLAN_DE_MANTENIMIENTO.md)).
- [ ] Superadministrador creado y contraseña cambiada.

## Firma de la verificación

| Rol | Nombre | Fecha | Resultado |
|---|---|---|---|
| Responsable técnico | PENDIENTE DE ASIGNACIÓN | | |
| Responsable de seguridad | PENDIENTE DE ASIGNACIÓN | | |
| Responsable del negocio | PENDIENTE DE ASIGNACIÓN | | |

## Referencias

- [05_GUIA_DE_DESPLIEGUE.md](05_GUIA_DE_DESPLIEGUE.md)
- [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)
