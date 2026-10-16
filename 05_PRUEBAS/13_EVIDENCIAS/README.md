# Evidencias de pruebas

| Campo | Valor |
|---|---|
| ID documental | DOC-05-13 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Guardar las evidencias reales de ejecución de pruebas y fijar las reglas para agregar nuevas.

## Alcance

Evidencias textuales de corridas automatizadas y, en el futuro, capturas de pruebas manuales. No se han generado capturas de pantalla en esta auditoría.

## Contenido

| Archivo | Descripción | Corrida |
|---|---|---|
| [2026-10-16_resumen_npm_test.md](2026-10-16_resumen_npm_test.md) | Resumen fiel de la salida de `npm test` | EJ-2026-10-16-01 |

## Reglas para nuevas evidencias

1. Nombre: `AAAA-MM-DD_<caso-o-suite>.<ext>` (p. ej. `2026-11-02_TC-019_checkout.png`).
2. Sin datos personales reales, códigos MFA, tokens, contraseñas, cadenas de conexión ni valores de `.env`. Usar cuentas sintéticas (`.test`, NIT `999…`).
3. Indicar en [../10_RESULTADOS_DE_EJECUCION.md](../10_RESULTADOS_DE_EJECUCION.md) el ID de la corrida y el commit.
4. No incluir volcados de base de datos ni documentos de identidad, aunque sean de prueba.
5. No modificar evidencias existentes; agregar una nueva versión con otra fecha.

## Referencias

- [../10_RESULTADOS_DE_EJECUCION.md](../10_RESULTADOS_DE_EJECUCION.md) · [../03_CATALOGO_DE_CASOS_DE_PRUEBA.md](../03_CATALOGO_DE_CASOS_DE_PRUEBA.md)
