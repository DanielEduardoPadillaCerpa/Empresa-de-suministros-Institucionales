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
# Empresa-de-suministros-Institucionales
# Monitoreo-Puentes-cr-ticos

## Registro verificado, aprobación y MFA (2026-10-15)

Solo personas del padrón institucional pueden tener cuenta. El registro pide nombre completo, NIT de la entidad, institución, correo, contraseña y un captcha. La terna NIT + nombre + institución se compara contra el padrón cifrado, la solicitud queda **pendiente** y un administrador la aprueba o rechaza en **Solicitudes** (`admin-solicitudes.html`). El inicio de sesión exige contraseña, captcha y un código por correo (MFA).

```bash
cd backend
npm run claves:generar   # ENC_KEY y HMAC_KEY en .env (solo las que falten)
npm start                # aplica la migración 003 y copia cifrado el padrón
npm test                 # Jest + node:test
npm run medir            # tiempos de registro, login y aprobación contra la base real
```

Guía completa (flujo, claves, n8n, tiempos medidos, cómo probar y pendientes): [docs/REGISTRO_VERIFICADO.md](docs/REGISTRO_VERIFICADO.md).

## Documentación empresarial del proyecto (2026-10-16)

Estructura documental completa, generada a partir de una auditoría del código (el código no se movió ni se modificó):

| Carpeta | Contenido |
|---|---|
| [00_GESTION_DEL_PROYECTO](00_GESTION_DEL_PROYECTO/00_INDICE_DOCUMENTAL.md) | Índice documental, ficha, riesgos, decisiones, cambios e [informe final de auditoría](00_GESTION_DEL_PROYECTO/11_INFORME_FINAL_DE_AUDITORIA_DOCUMENTAL.md) |
| [01_INGENIERIA_DE_REQUERIMIENTOS](01_INGENIERIA_DE_REQUERIMIENTOS/04_ESPECIFICACION_DE_REQUERIMIENTOS_SRS.md) | SRS, requerimientos, reglas de negocio y matriz de trazabilidad |
| [02_ANALISIS](02_ANALISIS/01_DOCUMENTO_DE_ANALISIS_DEL_SISTEMA.md) | Procesos, actores, casos de uso, flujos y modelo conceptual |
| [03_DISENO](03_DISENO/01_DOCUMENTO_DE_DISENO_DEL_SOFTWARE.md) | Arquitectura, componentes, base de datos, API, seguridad y ADR |
| [04_DESARROLLO](04_DESARROLLO/README.md) | Guía técnica, inventario, endpoints, variables, scripts e integraciones |
| [05_PRUEBAS](05_PRUEBAS/01_PLAN_DE_PRUEBAS.md) | Plan, casos de prueba, defectos, resultados y cobertura |
| [06_IMPLEMENTACION](06_IMPLEMENTACION/01_PLAN_DE_IMPLEMENTACION.md) | Instalación, configuración, despliegue, respaldo, rollback y manuales |
| [07_MANTENIMIENTO_Y_SOPORTE](07_MANTENIMIENTO_Y_SOPORTE/01_PLAN_DE_MANTENIMIENTO.md) | Mantenimiento, incidentes, diagnóstico y continuidad |

Todos los documentos están en estado BORRADOR, pendientes de validación y aprobación.
