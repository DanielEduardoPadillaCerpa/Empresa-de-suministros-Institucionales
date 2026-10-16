# Pruebas de rendimiento

| Campo | Valor |
|---|---|
| ID documental | DOC-05-07 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Documentar los objetivos de tiempo de respuesta (REQ-NF-006), la herramienta de medición existente y las mediciones disponibles, distinguiendo claramente lo histórico de lo ejecutado en esta auditoría.

## Alcance

Registro, login, aprobación, rechazo y contador de solicitudes; p95 del asistente en modo reglas. No incluye pruebas de carga ni de estrés (no existen en el repositorio).

## 1. Estado

**En esta auditoría no se realizó ninguna medición de rendimiento** [OBS]. TC-106 está BLOQUEADO porque `npm run medir` usa la base real configurada en `backend/.env` y requiere autorización.

Única métrica ejecutada hoy: la prueba unitaria `assistant.spec.js` «p95 del modo reglas permanece por debajo de 150 ms» pasó (motor en memoria, sin red ni base).

## 2. Mediciones históricas (2026-10-15, no reproducidas)

Fuente: [`docs/REGISTRO_VERIFICADO.md`](../docs/REGISTRO_VERIFICADO.md) §5. Equipo de laboratorio, ~150 ms por viaje a MySQL (Clever Cloud), bcrypt costo 10.

| Operación | Mediana | p95 | Meta |
|---|---|---|---|
| Registro (202) | 360 ms | 863 ms (primer registro tras arrancar) | < 600 ms |
| Login paso 1 (202) | 421 ms | 423 ms | < 600 ms |
| Login fallido (401) | 246 ms | 246 ms | < 600 ms |
| Aprobar | 192 ms | 193 ms | < 300 ms |
| Rechazar | 176 ms | 176 ms | < 300 ms |
| Contador de pendientes | 161 ms | 167 ms | < 300 ms |

Estos valores son una referencia del autor original; no fueron verificados por esta auditoría.

## 3. Cómo ejecutar `npm run medir` (solo en entorno autorizado)

1. Obtener autorización del responsable de la base (PENDIENTE DE ASIGNACIÓN): el script crea cuentas sintéticas en la base real y las borra al terminar.
2. **Detener el servidor** antes de ejecutar: la base permite 5 conexiones por usuario y el servidor usa hasta 4 (RSK-004).
3. Desde `backend/`: `npm run medir` (`scripts/medir-rendimiento.js`).
4. Registrar fecha, commit, ubicación del equipo, latencia de red y resultados en [10_RESULTADOS_DE_EJECUCION.md](10_RESULTADOS_DE_EJECUCION.md).
5. **[REC]** Preferir una base de pruebas cercana al servidor para mediciones repetibles.

## 4. Factores conocidos [INF]

- La latencia a la base domina los tiempos; con el backend desplegado junto a la base se espera una reducción importante (afirmación del documento histórico, no verificada).
- El pool limitado (3 + 1, REQ-NF-007) restringe la concurrencia.
- bcrypt con costo 12 en producción aumentará el tiempo del registro y el login respecto al laboratorio.

## Referencias

- [03_CATALOGO_DE_CASOS_DE_PRUEBA.md](03_CATALOGO_DE_CASOS_DE_PRUEBA.md) (TC-106, TC-107) · [`../backend/scripts/medir-rendimiento.js`](../backend/scripts/medir-rendimiento.js)
