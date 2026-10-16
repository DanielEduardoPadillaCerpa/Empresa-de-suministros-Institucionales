# Estructura real del código

| Campo | Valor |
|---|---|
| ID documental | DOC-04-02 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Mostrar la organización física real del repositorio para ubicar rápidamente cada pieza.

## Alcance

**[OBS]** 381 archivos versionados en Git (`git ls-files`), de los cuales 205 son imágenes en `backend/img/`. Se excluyen del árbol los directorios generados o locales (ver §3). Las carpetas documentales `00_…` a `07_…` creadas el 2026-10-16 no forman parte del código.

## 1. Árbol (sin `node_modules`, `.git` ni imágenes individuales)

```text
0_3-Desarrollo-modernizado/
├── README.md                     Documentación previa (inicio rápido; ver BUG-008)
├── INFORME-INSPECCION.md         Informe previo de corrección de bugs (2026-10-13)
├── file.md                       Archivo vacío (BUG-009)
├── package-lock.json             Lockfile raíz mínimo (105 bytes, sin dependencias)
├── .gitignore
├── backend/
│   ├── server.js                 Punto de entrada: valida config, migra, inicia workers y escucha
│   ├── package.json / package-lock.json
│   ├── .env.example              Plantilla de variables (valores de ejemplo)
│   ├── README.md · ASISTENTE-CATALOGO.md
│   ├── probar-mfa-n8n.js         Prueba manual de W5 (roto: requiere src/mfaCourier.js inexistente)
│   ├── scratch_detalle.js        Fragmento suelto de la ruta de detalle (24 líneas, sin uso)
│   ├── img/                      205 imágenes (productos, banners, capturas admin, logo)
│   ├── sql/003_registro_verificado.sql
│   ├── scripts/                  crear-cuentas-prueba, crear-superadmin, generar-claves,
│   │                             importar-padron, medir-rendimiento, migraciones
│   ├── src/
│   │   ├── app.js                Construcción de la app Express (rutas, CORS, cabeceras)
│   │   ├── db.js                 Pools MySQL, DDL tolerante, semillas, admin inicial
│   │   ├── autorizacion.js       Contexto, evaluarProducto, permisos de staff
│   │   ├── tenancy.js            Instituciones y datos públicos de invitado
│   │   ├── crypto.js             Cifrado heredado y v2 (anillo), índices de identificadores
│   │   ├── configSegura.js       Validación de secretos al arrancar
│   │   ├── auditoria.js          registrarAuditoria / transaccional
│   │   ├── automationOutbox.js · automationSignatures.js · automationAuth.js
│   │   ├── emailOutbox.js · email.js · receiptService.js · receiptTokens.js
│   │   ├── paymentProvider.js · paymentProviderInstance.js · paymentJobs.js · inventoryReservations.js
│   │   ├── mfaCodes.js · registroInstitucional.js
│   │   ├── verificacion.js · verificacionCompra.js · verificacionJobs.js
│   │   ├── assistant/            indiceCatalogo, llmAdapter, motor, normalizador, sinonimos.json
│   │   ├── migraciones/          index.js, 001_…, 002_…, 003_…
│   │   ├── seguridad/            avisosN8n, captcha, cifradoCampos, contrasenas, correo,
│   │   │                         normalizacion, padron, registroVerificado
│   │   └── routes/               17 routers (asistente, atencion, auditoria, auth, automatizaciones,
│   │                             categorias, checkout, clientes, comprobantes, miCuenta, misreportes,
│   │                             pagos, pedidos, productos, reportes, solicitudesRegistro, verificacion)
│   └── test/
│       ├── *.spec.js (Jest: 4 archivos) · *.test.js (node:test: 8 archivos)
│       ├── integration/          ayudantes.js, compra-verificada.int.spec.js, verificacion.int.spec.js
│       └── ui/                   servidor-prueba.js, ui-e2e.js
├── frontend/
│   ├── 20 páginas .html          landing, index (catálogo), producto-detalle, login, registro,
│   │                             checkout, historial, mis-pedidos, mis-reportes, mi-verificacion,
│   │                             cambiar-password, contacto, leyes, reportes, admin-clientes,
│   │                             admin-dashboard, admin-pedidos, admin-productos,
│   │                             admin-solicitudes, admin-verificaciones
│   ├── css/  (8)                 admin-console, catalogo, global-ui, registro-premium, style,
│   │                             tenant-ui, theme-modern, verificacion
│   └── js/   (12)                admin-solicitudes-contador, auth, captcha, cart, chatbot,
│                                 checkout-autofill, global-layout, i18n, imagenes, navbar,
│                                 registro-wizard, reportes
├── n8n/
│   ├── docker-compose.yml        Servicio n8n 1.110.1 (contenedor empresa-n8n, puerto 5678)
│   ├── generar-w11.js · generar-w12.js   Generadores de W11/W12
│   └── workflows/                W1–W12 (JSON importables, todos active:false)
└── docs/                         27 documentos previos (.md, .docx, .csv)
```

> Recuento [OBS]: 20 páginas HTML, 12 archivos JS y 8 hojas CSS en `frontend/`.

## 2. Resumen de `backend/img/`

**[OBS]** 205 imágenes versionadas (JPG, PNG, WEBP, JPEG): fotografías de productos referenciadas por la semilla de `db.js`, imágenes de banner por institución (`Armada.jpg`, `Marina.jpg`, `bomberos-dominio-publico.jpg`, `*-unsplash.jpg`), capturas del panel (`admin-*.jpg`, `catalogo.jpg`), `Imagen del Landing.png` y `logo-suministros.png`. Se sirven en `/img`. **[INF]** La licencia de las imágenes no está documentada (PENDIENTE DE VALIDACIÓN). Las imágenes subidas desde el panel van a `backend/img/productos/` (creada en tiempo de ejecución).

## 3. Elementos excluidos o no versionados

| Elemento | Motivo | Tratamiento |
|---|---|---|
| `.git/` | Historial | No modificado ni copiado |
| `backend/node_modules/` | Dependencias de terceros | Resumido en [07](07_DEPENDENCIAS_Y_VERSIONES.md) |
| `backend/.env`, `backend/.env.respaldo-*`, `n8n/.env` | Secretos | **Acceso restringido**; no leídos |
| `backend/storage/` | Documentos cifrados y archivo de cuentas de prueba | Ignorado por Git; no inspeccionado |
| `backend/generarHash.js` | Herramienta local con contraseña fija (docs/AUDITORIA_TECNICA A4) | Ignorado por Git; no leído |
| `respaldos-n8n/` | Respaldos con credenciales cifradas | Ignorado; no leído |
| `.respaldo-pre-verificacion/` | Respaldo del código anterior a 2026-10-13 | Ignorado; no leído |
| `.aider.chat.history.md`, `.aider.input.history` | Historial de herramienta local | Ignorado; no leído |

## Referencias

- [04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md](04_INVENTARIO_DE_ARCHIVOS_RELEVANTES.md) · [03_MODULOS_Y_RESPONSABILIDADES.md](03_MODULOS_Y_RESPONSABILIDADES.md)
- [../.gitignore](../.gitignore)
