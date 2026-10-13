# Changelog

## 2026-10-13 — Verificación institucional de compradores

### Agregado
- Registro por pasos con tipo de institución y campos condicionales validados en el servidor (`registroInstitucional.js`, `GET /api/auth/registro/tipos`, `frontend/js/registro-wizard.js`).
- Estados de verificación (borrador, pendiente, requiere información, aprobado, rechazado, suspendido), historial y auditoría de cada transición.
- Documentos de acreditación privados, validados por contenido y cifrados en disco.
- Servicio central de autorización (`autorizacion.js`) aplicado a catálogo, detalle, asistente y checkout.
- Elegibilidad de productos muchos-a-muchos y revisión legal preventiva (`revision_legal`).
- Siete permisos de staff diferenciados, alta de personal y gestión de permisos.
- Páginas `mi-verificacion.html` y `admin-verificaciones.html`; tarjeta "Verificaciones pendientes" en el dashboard.
- Migraciones versionadas (`schema_migraciones`) y `scripts/migraciones.js` (estado / revertir).
- Pruebas: integración contra MySQL (24) e interfaz con jsdom (32 verificaciones).
- Documentación en `docs/` y matrices normativa y de elegibilidad.

### Cambiado
- `POST /api/auth/registro` exige `tipoInstitucion` y los campos del tipo; contraseña de 10 a 72 caracteres; límite de 10 registros por IP y hora.
- La institución ya no se deduce del dominio del correo: la fija un revisor. El JWT solo identifica a la persona.
- Visitantes y cuentas no aprobadas ven vitrina sin precios ni productos restringidos.
- Conceder productos restringidos exige el permiso `restringidos.autorizar` y una cuenta aprobada.
- Cambiar restricción o institución de un producto exige `productos.cumplimiento`.
- `server.js` usa `src/app.js` (misma app para el servidor y las pruebas).

### Corregido
- `restringido = "false"` enviado por FormData marcaba el producto como restringido.
- El administrador inicial se creaba con una contraseña conocida y se imprimía en consola.
- `backend/.env` no estaba en `.gitignore`.

### Pendiente
- Actualizar `nodemailer` (vulnerabilidad alta preexistente).
- Antivirus para documentos; CSP/HSTS; sesión en cookie `HttpOnly`.
- Traducción de las páginas nuevas.
- Decisión sobre las cuentas heredadas en la base de producción (ver `AUDITORIA_TECNICA.md` §7).
