# Matriz permiso de staff → endpoints

| Campo | Valor |
|---|---|
| ID documental | DOC-04-API-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Saber qué endpoints habilita cada uno de los 13 permisos definidos en `PERMISOS_STAFF` (`../../backend/src/autorizacion.js`).

## Alcance

**[OBS]** Todos exigen además JWT con MFA, cuenta activa, rol `admin` leído de la base y no tener contraseña inicial pendiente. El superadministrador (`usuarios.es_superadmin`) tiene implícitos todos los permisos **excepto** `documentos.ver` e `identificadores.ver` (RN-017). `staff.permisos` e `identificadores.ver` solo los concede un superadministrador.

| Permiso | Descripción (código) | Endpoints |
|---|---|---|
| `verificacion.ver` | Consultar solicitudes de verificación | `GET /api/verificacion/admin/solicitudes`, `GET …/solicitudes/:clienteId`, `POST …/:clienteId/comprobaciones/:componente` (más el permiso del componente) |
| `verificacion.decidir` | Revisión documental y decisión | `POST …/:clienteId/decision`, `POST …/:clienteId/cambio-tipo`; componentes `vinculo_documental` y `entidad` |
| `verificacion.confirmar_institucion` | Segunda comprobación por canal oficial | Componente `canal_independiente` en `…/comprobaciones/:componente` |
| `documentos.ver` | Descargar documentos | `GET /api/verificacion/admin/documentos/:id` (auditado) |
| `identificadores.ver` | Ver el número completo del documento | `POST …/:clienteId/identificador/revelar` (justificación 20–500, auditado) |
| `cuentas.suspender` | Suspender y reactivar | `POST …/:clienteId/suspension` |
| `restringidos.autorizar` | Conceder/revocar restringidos | `POST …/:clienteId/restringidos`; `autorizacionGeneral` en `PUT /api/clientes/:id` |
| `productos.cumplimiento` | Elegibilidad, restricción, revisión legal | `GET /api/verificacion/admin/productos`, `PUT …/admin/productos/:id/cumplimiento`; necesario para crear restringidos o cambiar restricción/institución en `POST/PUT /api/productos` |
| `catalogo.gestionar` | CRUD de productos y categorías | `POST/PUT/DELETE /api/productos`, `GET /api/productos/bajo-inventario`, `POST/PUT/DELETE /api/categorias`, `GET /api/productos?incluir_inactivos=1` |
| `pedidos.gestionar` | Pedidos de todos los clientes | `GET /api/pedidos/todos`, `PUT /api/pedidos/:id`, `GET /api/pedidos/:clienteId` |
| `clientes.gestionar` | Fichas de clientes y solicitudes de cuenta | `/api/clientes` (GET, GET :id, POST, PUT, DELETE), `GET/PATCH /api/mi-cuenta/solicitudes*`, todo `/api/admin/solicitudes` |
| `auditoria.ver` | Registro de auditoría | `GET /api/auditoria` |
| `staff.permisos` | Personal y permisos | `GET /api/verificacion/admin/permisos`, `PUT …/admin/permisos/:usuarioId`, `POST …/admin/personal` |
| *(cualquier staff)* | — | `GET /api/verificacion/admin/mis-permisos` |
| *(solo superadmin)* | — | `GET /api/verificacion/admin/diagnostico` |

**[OBS]** Asignación de componentes a permisos (`PERMISO_COMPONENTE`, `routes/verificacion.js:855`): `vinculo_documental` → `verificacion.decidir`; `canal_independiente` → `verificacion.confirmar_institucion`; `entidad` (revisión manual) → `verificacion.decidir`.

## Referencias

- [../../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md](../../02_ANALISIS/04_MAPA_DE_ACTORES_Y_PERMISOS.md)
- [../../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md](../../docs/SUPERUSUARIO_Y_CUENTAS_PRUEBA.md)
