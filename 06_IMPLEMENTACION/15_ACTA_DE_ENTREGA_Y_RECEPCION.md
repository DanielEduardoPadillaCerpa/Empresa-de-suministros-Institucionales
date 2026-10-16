# Acta de entrega y recepción

| Campo | Valor |
|---|---|
| ID documental | DOC-06-15 |
| Versión | 1.0 |
| Estado | PLANTILLA — PENDIENTE DE DILIGENCIAR Y APROBAR |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Plantilla para formalizar la entrega del sistema. **[OBS]** No existe evidencia de ninguna entrega formal, contrato, cliente aprobador ni firma. Este documento **no constituye** una entrega ni una aceptación.

## Alcance

Entrega de código, documentación, configuración (sin secretos) y conocimiento operativo.

## 1. Datos generales

| Campo | Valor |
|---|---|
| Proyecto | Suite Institucional — plataforma de suministros para entidades públicas |
| Versión entregada | PENDIENTE (sugerida: la que resulte de REL-004 + correcciones; hoy sin etiqueta) |
| Commit / etiqueta | PENDIENTE |
| Entorno | PENDIENTE |
| Fecha de entrega | PENDIENTE |
| Entrega | PENDIENTE DE ASIGNACIÓN |
| Recibe | PENDIENTE DE ASIGNACIÓN |

## 2. Elementos entregados

| # | Elemento | Ubicación | Entregado (S/N) | Observaciones |
|---|---|---|---|---|
| 1 | Código backend | `backend/` | | |
| 2 | Código frontend | `frontend/` | | |
| 3 | Workflows n8n | `n8n/workflows/` | | 12 exportados, todos inactivos |
| 4 | Script SQL 003 | `backend/sql/` | | |
| 5 | Documentación empresarial | `00_…` a `07_…` | | |
| 6 | Documentación técnica previa | `docs/`, `README.md`, `backend/README.md` | | Contiene inconsistencias (BUG-008) |
| 7 | Plantilla de configuración | `backend/.env.example` | | Sin secretos |
| 8 | Secretos y claves del entorno | Canal seguro acordado (no en esta acta) | | |
| 9 | Accesos (base, SMTP, n8n, GitHub) | Canal seguro acordado | | |
| 10 | Resultados de pruebas | `05_PRUEBAS/` | | Solo unitarias ejecutadas el 2026-10-16 |

## 3. Estado conocido al momento de la entrega

Defectos abiertos: BUG-001 a BUG-018 (ver [../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md](../05_PRUEBAS/09_REGISTRO_DE_DEFECTOS.md)). Pendientes: pasarela de pagos (REQ-F-040), HTTPS (REQ-NF-016), validación jurídica (REQ-NF-017), workflows n8n (REQ-F-036).

## 4. Criterios de aceptación acordados

PENDIENTE DE DEFINIR por las partes.

## 5. Observaciones de quien recibe

PENDIENTE.

## 6. Decisión

- [ ] Recibido a satisfacción
- [ ] Recibido con observaciones
- [ ] No recibido

## 7. Firmas

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Entrega | PENDIENTE DE ASIGNACIÓN | | |
| Recibe | PENDIENTE DE ASIGNACIÓN | | |
| Testigo / supervisor | PENDIENTE DE ASIGNACIÓN | | |

## Referencias

- [13_LISTA_DE_VERIFICACION_PREPRODUCCION.md](13_LISTA_DE_VERIFICACION_PREPRODUCCION.md)
- [16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md](16_REGISTRO_DE_VERSIONES_Y_LIBERACIONES.md)
