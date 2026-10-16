# Restaura n8n en un computador nuevo a partir del paquete de respaldar-n8n.ps1.
#
# Requisitos: Docker Desktop abierto y el repositorio clonado.
# Uso (desde la raiz del repositorio):
#   powershell -ExecutionPolicy Bypass -File n8n\restaurar-n8n.ps1 -Paquete C:\ruta\traslado-n8n-20261016
#
# -Forzar reemplaza un volumen n8n_n8n_data que ya tenga datos (se pierden).
param(
  [Parameter(Mandatory = $true)][string]$Paquete,
  [switch]$Forzar
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$Paquete = (Resolve-Path $Paquete).Path

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker no responde. Abre Docker Desktop y vuelve a intentarlo.' }
if (-not (Test-Path "$Paquete\n8n_data.tar.gz")) { throw "No esta $Paquete\n8n_data.tar.gz" }

# 1. Archivos .env (no se sobrescriben si ya existen).
foreach ($par in @(@('n8n.env', "$repo\n8n\.env"), @('backend.env', "$repo\backend\.env"))) {
  $origen = Join-Path $Paquete $par[0]
  if (Test-Path $par[1]) { Write-Host "Se conserva el $($par[1]) existente." }
  elseif (Test-Path $origen) { Copy-Item $origen $par[1]; Write-Host "Copiado $($par[1])" }
  else { throw "Falta $origen y tampoco existe $($par[1])." }
}

# 2. Volumen con workflows, credenciales y usuario de n8n.
docker volume inspect n8n_n8n_data *> $null
if ($LASTEXITCODE -eq 0) {
  $contenido = docker run --rm -v n8n_n8n_data:/datos alpine:3.20 ls -A /datos
  if ($contenido -and -not $Forzar) {
    throw 'El volumen n8n_n8n_data ya tiene datos. Usa -Forzar para reemplazarlos.'
  }
  docker rm -f empresa-n8n *> $null
} else {
  docker volume create n8n_n8n_data | Out-Null
}
docker run --rm -v n8n_n8n_data:/datos -v "${Paquete}:/respaldo:ro" alpine:3.20 sh -c "rm -rf /datos/* /datos/.[!.]* ; tar xzf /respaldo/n8n_data.tar.gz -C /datos && chown -R 1000:1000 /datos"
if ($LASTEXITCODE -ne 0) { throw 'Fallo la restauracion del volumen.' }

# 3. Arrancar n8n y Mailpit.
docker compose -p n8n -f "$repo\n8n\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) { throw 'docker compose no pudo arrancar los contenedores.' }

Write-Host 'Esperando a n8n...'
$listo = $false
for ($i = 0; $i -lt 60 -and -not $listo; $i++) {
  try { $listo = (Invoke-WebRequest -UseBasicParsing http://localhost:5678/healthz -TimeoutSec 3).StatusCode -eq 200 } catch { Start-Sleep 2 }
}
if (-not $listo) { throw 'n8n no respondio en 2 minutos. Revisa: docker logs empresa-n8n' }

Write-Host ''
Write-Host 'Workflows restaurados:'
docker exec empresa-n8n n8n list:workflow 2>$null
Write-Host ''
Write-Host 'n8n:     http://localhost:5678  (mismo usuario y contrasena del otro computador)'
Write-Host 'Mailpit: http://localhost:8025'
