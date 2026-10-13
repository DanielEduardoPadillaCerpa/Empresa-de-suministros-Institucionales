# Resultados de pruebas

## Corrida del 2026-10-13: verificación en la compra (rama `feat/verificacion-en-compra`)

Entorno: Windows 11, Node.js 24.19.0, MySQL 8.0 en Docker (puerto 3307), bases `suministros_test` y `suministros_ui_test`. **Ninguna prueba usó la base de Clever Cloud.**

| Suite | Antes del cambio (commit `07e7e37`) | Después | Notas |
|---|---|---|---|
| Jest unitarias | 101/101 | **106/106** | Se actualizó el contrato del registro (ahora mínimo) y los mocks del contexto de staff. Nuevas: rechazo de campos diferidos, aceptación de términos, administrador sin `clientes.gestionar`, solicitudes de cuenta sin permiso y cambio de contraseña obligatorio |
| `node:test` | 32/32 | **42/42** | Nuevo `verificacion-compra.test.js` (10): tabla de decisión, normalización, HMAC, cifrado v2 con rotación y alteración, hash del carrito, NIT de persona jurídica, configuración segura, firma y clasificación de los nodos de W11 |
| Integración MySQL | 24/24 | **48/48** | `verificacion.int.spec.js` (23, adaptado) + `compra-verificada.int.spec.js` (25, nuevo) |
| Interfaz jsdom | 32/32 | **43/43** | Registro mínimo, Mi verificación, panel con doble comprobación, catálogo y cambio de contraseña |
| `npm audit --omit=dev` | 1 alta (`nodemailer`) | 1 alta (`nodemailer`) | Preexistente, no se trató en este trabajo |

### Defectos encontrados y corregidos durante las pruebas

1. **Zona horaria del MFA (preexistente).** `refresh_tokens.mfa_verificado_en` se escribía con la hora local de Node (UTC−5) y se comparaba con `NOW()` de MySQL (UTC). El cambio de contraseña ("MFA reciente") fallaba siempre que las zonas difirieran. Ahora se usa `NOW()` de la base.
2. **Referencia a una variable inexistente en el catálogo** (`index.html`), introducida durante este trabajo y detectada por la prueba de interfaz: el catálogo quedaba vacío para cuentas con sesión. Corregido.
3. **Bloqueo del superadministrador al editar sus propios permisos.** La regla "no puedes quitarte `staff.permisos`" no consideraba que el superadministrador lo tiene implícito. Corregido.

### Criterios 1–20 (ver `PLAN_PRUEBAS.md` §3)

Todos tienen al menos una prueba automatizada ejecutada y aprobada en esta corrida.

| Clasificación | Elementos |
|---|---|
| Implementado y probado automáticamente | Registro mínimo · cuenta activa para uso general · verificación diferida · documento de identidad cifrado con índice HMAC · doble comprobación con cuatro ojos · tabla de decisión · respuestas de n8n autenticadas con anti-repetición · autorización por compra de un solo uso · vigencia y renovación · superadministrador por comando · permisos reservados · cuentas de prueba sintéticas · cambio obligatorio de la contraseña inicial · diagnóstico · validación de secretos al arrancar · cifrado versionado · migración 002 reversible |
| Implementado, probado solo en su lógica (no desplegado) | Workflow n8n W11: el código de sus nodos se ejecutó en pruebas; no se importó en n8n porque la API local respondió 401 |
| Implementado, sin prueba automatizada de interfaz | Diálogo del código en `checkout.html` (el flujo de API está probado); avisos en `producto-detalle.html` |
| Pendiente de credenciales | Token de la API de n8n; `DATOS_GOV_APP_TOKEN`; secretos W11 en producción; rotación de `JWT_SECRET` y `CRYPTO_KEY` débiles del `.env` actual |
| Pendiente de autorización externa | Convenio con la Registraduría (ANI); listados vigentes de Supervigilancia y de la DNBC |
| Pendiente de validación jurídica | Aviso de privacidad y política; plazos de conservación; régimen de productos restringidos; RNBD |
| No implementado | Consulta a SIGEP II (no apta ni autorizada); biometría (no justificada); placa policial (sin definición del negocio); recifrado de datos heredados; borrado automático por plazo; segundo factor distinto del correo; cookie `HttpOnly`; CSP/HSTS; antivirus; actualización de `nodemailer` |

No se afirma que la plataforma sea completamente segura: las pruebas cubren los escenarios definidos, no todos los posibles.

---

## Corrida anterior: verificación institucional (2026-10-13, commit `07e7e37`)

| Suite | Resultado |
|---|---|
| Jest unitarias | 101/101 |
| `node:test` | 32/32 |
| Integración MySQL | 24/24, incluidos los escenarios A–L |
| Interfaz jsdom | 32/32 |
| Migración 001 en base vacía, sobre esquema anterior y reversión | Correctas |
