# n8n — cómo llevarlo a otro computador

Los workflows de esta carpeta (`workflows/*.json`) están en git, pero lo que n8n tiene **guardado** no: el usuario de acceso, las credenciales (SMTP, etc.), qué flujos están activos y la clave que las cifra. Todo eso vive en el volumen de Docker `n8n_n8n_data` y en `n8n/.env`. Por eso el traslado se hace con un paquete.

## 1. En el computador original

Desde la raíz del repositorio:

```powershell
powershell -ExecutionPolicy Bypass -File n8n\respaldar-n8n.ps1
```

Crea `Documentos\traslado-n8n-AAAAMMDD\` con:

| Archivo | Qué es |
|---|---|
| `n8n_data.tar.gz` | Volumen de n8n: workflows, credenciales, usuario, flujos activos |
| `n8n.env` | `n8n/.env`, con `N8N_ENCRYPTION_KEY` |
| `backend.env` | `backend/.env`: base de datos, claves y secretos compartidos con n8n |

**El paquete tiene contraseñas y claves.** Llévalo en una USB o en una carpeta privada; no lo subas a GitHub ni lo mandes por chat.

## 2. En el computador nuevo

1. Instala **Docker Desktop** y ábrelo. Instala también **Git** y **Node.js 18+**.
2. Clona el repositorio y cámbiate a la rama de trabajo:
   ```powershell
   git clone https://github.com/DanielEduardoPadillaCerpa/Empresa-de-suministros-Institucionales.git
   cd Empresa-de-suministros-Institucionales
   git checkout feature/verificacion-seguridad
   ```
3. Copia la carpeta del paquete al computador y restaura:
   ```powershell
   powershell -ExecutionPolicy Bypass -File n8n\restaurar-n8n.ps1 -Paquete C:\ruta\traslado-n8n-AAAAMMDD
   ```
   El script copia los `.env` a `n8n/.env` y `backend/.env` (si ya existen, los deja), restaura el volumen, levanta n8n y Mailpit, y muestra los workflows.
4. Abre **http://localhost:5678** y entra con el **mismo correo y contraseña** del computador original.
5. Arranca el backend para que n8n tenga a quién llamar:
   ```powershell
   cd backend
   npm install
   npm start
   ```

| Servicio | Dirección |
|---|---|
| n8n | http://localhost:5678 |
| Mailpit (correos de prueba) | http://localhost:8025 |
| Backend y páginas | http://localhost:8081 |

## Si algo falla

| Síntoma | Causa y solución |
|---|---|
| "Mismatching encryption keys" en `docker logs empresa-n8n` | `n8n/.env` no es el del paquete. Copia `n8n.env` del paquete encima de `n8n/.env` y ejecuta `docker compose -p n8n -f n8n/docker-compose.yml up -d`. |
| n8n pide crear un usuario nuevo | El volumen quedó vacío. Vuelve a ejecutar `restaurar-n8n.ps1 ... -Forzar`. |
| "El volumen n8n_n8n_data ya tiene datos" | Ya habías abierto n8n en este computador. `-Forzar` lo reemplaza por el del paquete (lo que tuviera se pierde). |
| Puerto 5678, 8025 o 1025 ocupado | Otro programa o contenedor lo usa. Ciérralo, o cambia el puerto de la izquierda en `docker-compose.yml`. |
| Los flujos responden error al llamar al backend | El backend no está corriendo en el puerto 8081, o `backend/.env` no es el del paquete (los secretos `N8N_W*` deben coincidir en ambos `.env`). |

## Sin paquete (solo con git)

Si el computador original ya no está disponible, n8n arranca vacío: crea `n8n/.env` desde `.env.example` con los mismos secretos que `backend/.env`, levanta con `docker compose -p n8n -f n8n/docker-compose.yml up -d`, crea un usuario en http://localhost:5678, importa los flujos con `docker exec empresa-n8n n8n import:workflow --separate --input=/workflows`, vuelve a crear las credenciales SMTP y activa los flujos a mano.
