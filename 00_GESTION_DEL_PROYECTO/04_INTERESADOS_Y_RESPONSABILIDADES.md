# Interesados y responsabilidades

| Campo | Valor |
|---|---|
| ID documental | DOC-00-04 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Identificar los roles que intervienen en el proyecto y en la operación del sistema, y proponer la asignación de responsabilidades.

## Alcance

[OBS] El repositorio no registra organigrama, equipo, contratos ni acuerdos. Los roles se infieren del código (roles y permisos) y de la documentación previa. Todas las personas figuran como PENDIENTE DE ASIGNACIÓN. El único dato personal disponible es el autor de los commits en Git, que no equivale a un rol aprobado. Los interesados de requerimientos se detallan en [02_IDENTIFICACION_DE_INTERESADOS](../01_INGENIERIA_DE_REQUERIMIENTOS/02_IDENTIFICACION_DE_INTERESADOS.md).

## Interesados del proyecto

| ID | Rol | Interés | Evidencia | Persona |
|---|---|---|---|---|
| INT-01 | Patrocinador / dueño del negocio | Viabilidad, costo cero, decisiones de negocio pendientes | [INF] decisiones pendientes en `docs/REGISTRO_VERIFICADO.md` §4 y §7 | PENDIENTE DE ASIGNACIÓN |
| INT-02 | Desarrollador(es) | Construcción y pruebas | [OBS] 23 commits; autor Git registrado | PENDIENTE DE ASIGNACIÓN (rol formal) |
| INT-03 | Responsable técnico / arquitecto | Decisiones ADR-001…012 | [INF] | PENDIENTE DE ASIGNACIÓN |
| INT-04 | Operación / DevOps | Claves, respaldos, despliegue, n8n | [OBS] scripts y guías en `docs/` | PENDIENTE DE ASIGNACIÓN |
| INT-05 | Oficial de protección de datos / asesor jurídico | Ley 1581, productos restringidos, RNBD | [OBS] `docs/TRATAMIENTO_DATOS_PERSONALES.md` exige revisión jurídica | PENDIENTE DE ASIGNACIÓN |
| INT-06 | Entidades compradoras (Policía, Defensa, Bomberos, Socorro, Penitenciario, empresas) | Comprar suministros con su catálogo | [OBS] `backend/src/tenancy.js`, `registroInstitucional.js` | PENDIENTE |
| INT-07 | Custodio de la fuente del padrón | Proveer la fuente oficial (hoy base de laboratorio) | [OBS] `seguridad/padron.js` | PENDIENTE |
| INT-08 | Evaluador académico / auditor | Revisión del proyecto | [INF] objetivo declarado de la documentación | PENDIENTE |

## Roles operativos del sistema [OBS]

| Rol | Cómo se obtiene | Facultades |
|---|---|---|
| Visitante | Sin sesión | Vitrina sin precios, contacto, normatividad |
| Solicitante | Registro (`estado_cuenta = pendiente`) | Ninguna hasta la aprobación |
| Cliente activo | Aprobación de la solicitud + MFA | Catálogo de su institución, compra de uso general |
| Cliente verificado | Verificación institucional aprobada + autorización de restringidos | Compra de restringidos con código por compra |
| Administrador (staff) | `usuarios.rol = admin` + permisos en `staff_permisos` | 13 permisos granulares (ver [mapa de actores](../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md)) |
| Superadministrador | `scripts/crear-superadmin.js` con `--confirmar-base` | Todos los permisos salvo datos personales; permisos reservados; diagnóstico |
| Revisor A / Revisor B | Staff con `verificacion.decidir` / `verificacion.confirmar_institucion` | Cuatro ojos en la verificación |

## Matriz RACI propuesta [REC]

R = responsable, A = aprueba, C = consultado, I = informado. Propuesta para validación; no refleja acuerdos existentes.

| Actividad | INT-01 | INT-02 | INT-03 | INT-04 | INT-05 |
|---|---|---|---|---|---|
| Aprobar alcance y prioridades | A | C | C | I | C |
| Desarrollar y probar cambios | I | R | A | C | I |
| Decisiones de arquitectura (ADR) | I | C | A/R | C | C |
| Gestión de claves y secretos | I | I | A | R | I |
| Respaldos y restauración | I | I | A | R | I |
| Despliegue a producción | A | C | R | R | C |
| Aprobar solicitudes de registro y verificaciones (operación) | A | I | I | I | C |
| Política de tratamiento de datos | A | I | C | I | R |
| Gestión de incidentes de seguridad | I | C | A | R | C |
| Mantenimiento de la documentación | I | R | A | C | C |

## Acciones requeridas

1. Asignar personas a INT-01…INT-05 y registrar la asignación en este documento.
2. Validar la matriz RACI.
3. Definir quién opera el panel de solicitudes y de verificaciones (roles de staff y superadministrador).

## Referencias

- [Identificación de interesados](../01_INGENIERIA_DE_REQUERIMIENTOS/02_IDENTIFICACION_DE_INTERESADOS.md)
- [Mapa de actores y permisos](../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md)
- [docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
