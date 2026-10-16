# Crea un paquete para llevar n8n a otro computador:
#   n8n_data.tar.gz  -> volumen n8n_n8n_data (workflows, credenciales, usuario)
#   n8n.env          -> copia de n8n/.env (incluye N8N_ENCRYPTION_KEY)
#   backend.env      -> copia de backend/.env (secretos compartidos con n8n)
#
# El paquete contiene secretos: no lo subas a git ni lo envies por chat.
# Uso (desde la raiz del repositorio):
#   powershell -ExecutionPolicy Bypass -File n8n\respaldar-n8n.ps1
param([string]$Destino = "$HOME\Documents\traslado-n8n-$(Get-Date -Format yyyyMMdd)")

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

docker volume inspect n8n_n8n_data *> $null
if ($LASTEXITCODE -ne 0) { throw 'No existe el volumen n8n_n8n_data en este computador.' }

New-Item -ItemType Directory -Force $Destino | Out-Null

# Se detiene n8n durante la copia para que la base SQLite quede consistente.
$corriendo = (docker ps -q -f name=^empresa-n8n$)
if ($corriendo) { docker stop empresa-n8n | Out-Null }
try {
  docker run --rm -v n8n_n8n_data:/datos:ro -v "${Destino}:/respaldo" alpine:3.20 tar czf /respaldo/n8n_data.tar.gz -C /datos .
  if ($LASTEXITCODE -ne 0) { throw 'Fallo la copia del volumen.' }
} finally {
  if ($corriendo) { docker start empresa-n8n | Out-Null }
}

foreach ($par in @(@("$repo\n8n\.env", 'n8n.env'), @("$repo\backend\.env", 'backend.env'))) {
  if (Test-Path $par[0]) { Copy-Item $par[0] (Join-Path $Destino $par[1]) -Force }
  else { Write-Warning "No se encontro $($par[0])" }
}

Write-Host "Paquete listo en $Destino"
Get-ChildItem $Destino | Format-Table Name, Length -AutoSize
