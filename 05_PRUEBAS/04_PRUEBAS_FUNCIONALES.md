# Pruebas funcionales

| Campo | Valor |
|---|---|
| ID documental | DOC-05-04 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Agrupar por proceso de negocio los casos funcionales TC-001…TC-040, indicar qué cubrió la corrida automatizada del 2026-10-16 y describir cómo completar los que quedaron sin ejecutar.

## Alcance

Casos funcionales del [catálogo](03_CATALOGO_DE_CASOS_DE_PRUEBA.md). Las pruebas manuales descritas aquí **no se ejecutaron** en esta auditoría.

## 1. Cobertura por proceso

| Proceso | Casos | Aprobados hoy | Pendientes de ejecutar |
|---|---|---|---|
| Registro verificado y aprobación (UC-001, UC-002) | TC-001…TC-004 | TC-001, TC-002, TC-004 | TC-003 (sincronización del padrón) |
| Autenticación y sesión (UC-003…UC-005) | TC-005…TC-009 | TC-005, TC-006, TC-007, TC-009 | TC-006.b cancelar, TC-008 refresh/logout |
| Mi cuenta (UC-006) | TC-010…TC-013 | TC-010…TC-013 (API) | Pantallas inexistentes (BUG-004, BUG-005) |
| Catálogo (UC-007, UC-015) | TC-014…TC-017 | TC-014 (reglas) | TC-014.b, TC-015, TC-016, TC-017 |
| Compra y pagos (UC-008, UC-009) | TC-018…TC-022, TC-040 | TC-020, TC-021.b, TC-022 | TC-018, TC-019, TC-021; TC-040 no implementado |
| Pedidos y comprobantes (UC-010, UC-011, UC-016) | TC-023…TC-025 | TC-025 | TC-023, TC-024 |
| Clientes (UC-017) | TC-026 | TC-026 | — |
| Verificación institucional (UC-012…UC-014, UC-018) | TC-027…TC-030 | TC-028 (tabla), sub-casos de TC-027 y TC-029 | Flujos HTTP de TC-027…TC-030 |
| Asistente, contacto, reportes, auditoría (UC-019…UC-022) | TC-031…TC-034 | TC-031, TC-034.b | TC-032, TC-033, TC-034 |
| Automatización y plataforma (UC-023) | TC-035…TC-039 | TC-035, TC-037 | TC-036, TC-037.b, TC-038, TC-039 |

## 2. Procedimiento manual recomendado (entorno autorizado)

Ejecutar solo contra una base **de pruebas** (nunca Clever Cloud de producción) y con cuentas sintéticas.

1. Preparar MySQL de pruebas (ver [05_PRUEBAS_DE_INTEGRACION.md](05_PRUEBAS_DE_INTEGRACION.md)) y apuntar `backend/.env` a ella.
2. Generar claves: `npm run claves:generar` (solo agrega las que falten).
3. Levantar Mailpit (SMTP 1025, buzón `http://localhost:8025`) o dejar SMTP vacío para que el código se imprima en consola de laboratorio (`[correo-laboratorio]`).
4. `npm start` en `backend/` y abrir `http://localhost:8081/`.
5. Crear cuentas sintéticas: `node scripts/crear-cuentas-prueba.js --confirmar-base <DB_NAME>` (se niega con `NODE_ENV=production` o si la base no contiene test/dev/local/prueba).
6. Recorrer, en este orden: registro (TC-001) → panel de solicitudes (TC-004) → login con MFA (TC-005, TC-006, incluida la cancelación) → catálogo como visitante y como cliente (TC-014, TC-015) → carrito y checkout con importes .00/.01/.02/.03 (TC-018, TC-019, TC-021) → historial y cancelación (TC-023) → comprobante PDF y reenvío (TC-025) → Mi verificación y panel de verificación (TC-027, TC-028) → compra de restringido con código (TC-029) → panel de productos (TC-016, TC-017) → asistente, contacto y calificación (TC-031, TC-032) → reportes y auditoría (TC-033, TC-034) → cambio de idioma y navegación (TC-038, TC-039).
7. Registrar cada resultado en [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md) y las evidencias (capturas sin datos reales) en [13_EVIDENCIAS/](13_EVIDENCIAS/README.md).

## 3. Observaciones funcionales por inspección (no ejecutadas)

- **[OBS]** No existe pantalla para `/api/mi-cuenta` (perfil, correo, cerrar sesiones, solicitudes); solo `frontend/cambiar-password.html` usa `/api/mi-cuenta/password` (BUG-004, BUG-005).
- **[OBS]** `frontend/js/auth.js` fija `API_BASE = 'http://localhost:8081'`; las pruebas manuales en otro origen fallarán (BUG-003).
- **[OBS]** `POST /api/pedidos` y `POST /api/pagos/procesar` responden 410 (retirados); los pedidos solo se crean por `/api/checkout`.

## Referencias

- [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) · [`../02_ANALISIS/05_CASOS_DE_USO.md`](../02_ANALISIS/05_CASOS_DE_USO.md)
- [`../docs/REGISTRO_VERIFICADO.md`](../docs/REGISTRO_VERIFICADO.md) §6 · [`../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md`](../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
