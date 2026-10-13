# Suite Institucional — Suministros para comisaría policial

Proyecto completo: sitio web (Bootstrap 5) + backend (Node.js/Express) + MySQL (Clever Cloud).
Pensado para trabajarse en VS Code, sin dependencias de Java/Spring Boot.

## Estructura

```
suite-institucional/
├── frontend/     -> HTML/CSS/JS estático (backend en localhost:8081 o Live Server)
└── backend/      -> API en Node.js + Express (ver backend/README.md para instrucciones)
```

## Cómo correrlo

1. **Backend primero:**
   ```bash
   cd backend
   npm install
   cp .env.example .env      # completa DB_PASSWORD, CRYPTO_KEY y JWT_SECRET
   npm start
   ```
   Debe quedar corriendo en `http://localhost:8081`.

2. **Frontend:**
   Con el backend corriendo, abre `http://localhost:8081/` — redirige a la página de entrada
   y sirve el frontend desde el mismo origen que la API. También puedes usar Live Server en
   `http://localhost:5501` (puerto configurado para Live Server en `.vscode/settings.json`);
   ese origen y `http://localhost:5500` están permitidos en la configuración local de CORS.
   No abras el HTML con `file://`, porque el navegador envía un origen nulo que se rechaza.

## Flujo de navegación

```
landing.html  →  index.html (catálogo)  →  agregar productos al carrito
                                          →  intentar "Continuar con el registro"
                                          →  ¿hay sesión activa?
                                              NO  → login.html (o registro.html si no tiene cuenta)
                                              SÍ  → registro.html (checkout / registro de cliente)
```

## Qué hace cada página del frontend

| Página | Función |
|---|---|
| `landing.html` | Página de aterrizaje / entrada principal del sitio |
| `login.html` | Inicio de sesión — obligatorio antes de completar una compra |
| `index.html` | Catálogo con carrito de compras (localStorage), selector de idioma y chatbot |
| `registro.html` | Registro de cliente (clasificación de datos Ley 1581) + creación de la cuenta de acceso (correo/contraseña) |
| `admin-clientes.html` | Lista los clientes registrados, leyendo `GET /api/clientes` |
| `reportes.html` | Panel con métricas de atención (KPIs de ejemplo + Chart.js) |

## Autenticación

- El registro de cliente (`registro.html`) crea, en el mismo formulario, una cuenta de acceso (correo + contraseña) y hace login automático.
- El botón "Continuar con el registro" en el carrito exige sesión activa: si no la hay, redirige a `login.html` y, tras iniciar sesión, vuelve automáticamente a donde el cliente iba.
- La sesión se guarda como un JWT en `localStorage`, válido por 2 horas.
- Las contraseñas se guardan con hash `bcrypt` — nunca en texto plano.

## Notas de seguridad

- Regenera la contraseña de la base de datos de Clever Cloud si la compartiste en algún momento por captura de pantalla o chat.
- Cambia `JWT_SECRET` y `CRYPTO_KEY` en tu `.env` por valores propios — nunca dejes los de ejemplo.
- El archivo `.env` del backend nunca debe subirse a un repositorio público.
- Los campos privados y sensibles se cifran con AES-256-GCM antes de guardarse (ver `backend/src/crypto.js`).

## Verificación institucional de compradores (2026-10-13)

Registrarse ya no habilita a comprar. El registro (`registro.html`) pide el tipo de institución y solo los datos de ese tipo; la cuenta queda en **borrador** hasta que el titular verifica su correo (código MFA), adjunta la evidencia en `mi-verificacion.html` y un revisor con permiso la aprueba en `admin-verificaciones.html`. Solo las cuentas aprobadas ven precios y compran, y únicamente los productos de su institución; los restringidos exigen además una autorización específica y revisión legal aprobada. Todas las decisiones se toman en el servidor (`backend/src/autorizacion.js`) leyendo MySQL en cada petición.

Documentación: [docs/ARQUITECTURA_OBJETIVO.md](docs/ARQUITECTURA_OBJETIVO.md), [docs/AUDITORIA_TECNICA.md](docs/AUDITORIA_TECNICA.md), [docs/MODELO_DATOS.md](docs/MODELO_DATOS.md), [docs/MODELO_AMENAZAS.md](docs/MODELO_AMENAZAS.md), [docs/PLAN_PRUEBAS.md](docs/PLAN_PRUEBAS.md), [docs/RESULTADOS_PRUEBAS.md](docs/RESULTADOS_PRUEBAS.md), [docs/GUIA_INSTALACION_Y_DESPLIEGUE.md](docs/GUIA_INSTALACION_Y_DESPLIEGUE.md), [docs/MATRIZ_NORMATIVA_COLOMBIA.md](docs/MATRIZ_NORMATIVA_COLOMBIA.md), [docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md](docs/MATRIZ_ELEGIBILIDAD_PRODUCTOS.md).
