# Keploy sobre la API de Bolsillos y Depositar, dentro de Docker.
#
#   .\keploy.ps1 record   graba: el backend corre bajo Keploy (puerto 3101) y la
#                         colección de Postman (Newman) le genera el tráfico.
#                         Cada llamada queda como caso de prueba y cada llamada a
#                         Supabase como mock (keploy/test-set-*/).
#   .\keploy.ps1 test     reproduce los casos con los mocks (sin tocar Supabase).
#
# Por qué Docker: el binario de Keploy para Windows lo bloquea Windows Defender
# ("software potencialmente no deseado"). La imagen fubank-keploy (Dockerfile de
# esta carpeta) junta el backend compilado con el binario Linux de la imagen
# oficial ghcr.io/keploy/keploy, que usa eBPF y por eso corre con --privileged.
#
# Requisitos: Docker Desktop encendido y backend/.env con las credenciales de Supabase.
param([Parameter(Mandatory = $true)][ValidateSet('record', 'test')][string]$Mode)

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$repo = (Resolve-Path (Join-Path $here '..\..\..\..')).Path
$image = 'fubank-keploy:latest'
$container = "keploy-$Mode"

docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop no está encendido.' }

docker build -f (Join-Path $here 'Dockerfile') -t $image $repo
if ($LASTEXITCODE -ne 0) { throw 'Falló la imagen del backend con Keploy.' }

$keployArgs = if ($Mode -eq 'record') { 'record -c "node /app/dist/server.js"' } else { 'test -c "node /app/dist/server.js" --delay 10' }
$dockerArgs = @(
  'run', '--name', $container, '--privileged',
  '--env-file', (Join-Path $repo 'backend\.env'), '-e', 'PORT=3001',
  '-v', '/sys/fs/cgroup:/sys/fs/cgroup', '-v', '/sys/fs/bpf:/sys/fs/bpf',
  '-v', "${here}:/keploy-data"
)
if ($Mode -eq 'record') { $dockerArgs += @('-d', '-p', '3101:3001') } else { $dockerArgs += '--rm' }
$dockerArgs += @($image, 'sh', '-c', "mount -t debugfs debugfs /sys/kernel/debug 2>/dev/null; keploy $keployArgs")

docker rm -f $container *> $null
if ($Mode -eq 'test') {
  docker @dockerArgs
  exit $LASTEXITCODE
}

docker @dockerArgs | Out-Null
for ($i = 0; $i -lt 60; $i++) {
  try { Invoke-WebRequest http://localhost:3101/health -UseBasicParsing -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep 2 }
}
$env:API_URL = 'http://localhost:3101/api/v1'
node (Join-Path $repo 'test\pruebas-herramientas\herramientas-alejandro\02-postman-postbot\run-newman.mjs')
docker stop -t 30 $container | Out-Null
docker logs $container *> (Join-Path $here 'keploy-logs.txt')
docker rm $container | Out-Null
Write-Host "Casos y mocks en $here\keploy (no se versionan: llevan la service_role de Supabase)."
