# Identificación de interesados

| Campo | Valor |
|---|---|
| ID documental | DOC-01-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Identificar los interesados (personas, roles y sistemas) cuyas necesidades se reflejan en los requerimientos, distinguiendo los roles que el sistema implementa de las personas reales, que no se conocen.

## Alcance

Interesados del sistema y de su documentación. Ninguna persona ha validado este documento. Las responsabilidades organizacionales están en [../00_GESTION_DEL_PROYECTO/04_INTERESADOS_Y_RESPONSABILIDADES.md](../00_GESTION_DEL_PROYECTO/04_INTERESADOS_Y_RESPONSABILIDADES.md).

## 1. Interesados de negocio y organización

| ID | Interesado | Interés | Evidencia | Persona asignada |
|---|---|---|---|---|
| INT-01 | Patrocinador / dueño del producto | Plataforma de suministros institucionales de costo cero | `../docs/REGISTRO_VERIFICADO.md` ("Entorno: laboratorio… Todo lo usado es gratuito") | PENDIENTE DE ASIGNACIÓN |
| INT-02 | Equipo de desarrollo | Mantener y evolucionar el código | Historial Git (autor registrado: "Daniel Eduardo Padilla Cerpa"; dato de Git, no un rol aprobado) | PENDIENTE DE ASIGNACIÓN |
| INT-03 | Responsable de cumplimiento / jurídico | Ley 1581, régimen de productos restringidos | `../docs/TRATAMIENTO_DATOS_PERSONALES.md`, `../docs/MATRIZ_NORMATIVA_COLOMBIA.md` | PENDIENTE DE ASIGNACIÓN |
| INT-04 | Operación / infraestructura | Base Clever Cloud, n8n, SMTP, secretos | `../docs/GUIA_INSTALACION_Y_DESPLIEGUE.md` | PENDIENTE DE ASIGNACIÓN |
| INT-05 | Evaluador académico / auditor | Comprender y evaluar el sistema | Solicitud de esta auditoría | PENDIENTE DE ASIGNACIÓN |
| INT-06 | Entidades compradoras (Policía, Defensa, Bomberos, Socorro, Penitenciario, empresas) | Comprar suministros adecuados a su institución | `../backend/src/registroInstitucional.js` (`TIPOS_COMPRADOR`) | No aplica (segmento) |

## 2. Actores del sistema (roles implementados)

| ID | Actor | Descripción | Implementación |
|---|---|---|---|
| ACT-01 | Visitante | Sin sesión; ve vitrina sin precios | `autenticacionOpcional` en `../backend/src/routes/auth.js`; `CONTEXTO_INVITADO` en `../backend/src/autorizacion.js` |
| ACT-02 | Solicitante | Registro hecho, `usuarios.estado_cuenta = 'pendiente'` | `../backend/src/seguridad/registroVerificado.js` |
| ACT-03 | Cliente activo | Cuenta activa y correo verificado; compra uso general | `obtenerContexto` → `cuentaActiva` |
| ACT-04 | Cliente verificado | Verificación vigente + autorización de restringidos | `../backend/src/verificacionCompra.js` |
| ACT-05 | Administrador / staff | `rol = 'admin'` + permisos de `staff_permisos` (13 permisos) | `PERMISOS_STAFF` en `../backend/src/autorizacion.js` |
| ACT-06 | Superadministrador | `usuarios.es_superadmin`; creado por comando | `../backend/scripts/crear-superadmin.js` |
| ACT-07 | n8n | Orquestador/notificador | `../n8n/workflows/`, `../backend/src/automationOutbox.js` |
| ACT-08 | Proveedor de pago mock | Emite webhooks firmados | `../backend/src/paymentProvider.js` |
| ACT-09 | Fuente del padrón | Base de solo lectura (`personas_institucionales_prueba`) | `../backend/src/seguridad/padron.js` |
| ACT-10 | Servidor SMTP | Entrega correos (Mailpit en laboratorio) | `../backend/src/seguridad/correo.js` |
| ACT-11 | Tareas programadas del backend | Expiración, mantenimiento, outbox, sincronización | `../backend/server.js` |

## 3. Matriz de influencia/interés [INF]

| Interesado | Influencia | Interés | Estrategia propuesta [REC] |
|---|---|---|---|
| INT-01 | Alta | Alto | Gestionar de cerca; validar visión y prioridades |
| INT-03 | Alta | Alto | Validar REQ-NF-017, RN de restringidos |
| INT-04 | Media | Alto | Validar requisitos de infraestructura y secretos |
| INT-02 | Media | Alto | Mantener informado mediante la matriz de trazabilidad |
| INT-05 | Baja | Medio | Informar |
| INT-06 | Baja (hoy) | Alto | Validar usabilidad cuando exista piloto |

## 4. Necesidades por interesado (inferidas)

| Interesado | Necesidad | REQ relacionados |
|---|---|---|
| ACT-02 | Saber el estado de su solicitud sin revelar datos de otros | REQ-F-001, REQ-F-005 |
| ACT-05 | Decidir solicitudes con información suficiente y auditada | REQ-F-004, REQ-F-028, REQ-F-034 |
| ACT-03/04 | Comprar con precios correctos y comprobante | REQ-F-019, REQ-F-025 |
| INT-03 | Minimización y protección de datos | REQ-NF-001, REQ-NF-008, REQ-NF-017 |
| INT-04 | Bajo costo y pocas conexiones | REQ-NF-007, REQ-NF-018 |

## Referencias

- [../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md](../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md)
- [../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
