# ===============================================================
# Orquestador: 3 herramientas de IA sobre Bolsillos y Depositar
# Autor: Alejandro - FuBanking
# Requiere backend (:3001) y frontend (:3000) arriba.
# ===============================================================

$results = [ordered]@{}

function Invoke-Tool([string]$name, [scriptblock]$command) {
  Write-Host "`n>>> $name" -ForegroundColor Yellow
  & $command
  $results[$name] = if ($LASTEXITCODE -eq 0) { 'OK' } else { "FALLÓ (código $LASTEXITCODE)" }
}

Write-Host '===============================================================' -ForegroundColor Cyan
Write-Host ' 3 HERRAMIENTAS DE IA · BOLSILLOS Y DEPOSITAR · ALEJANDRO' -ForegroundColor Cyan
Write-Host '===============================================================' -ForegroundColor Cyan

# 1. Playwright Test Agents: corre los tests que generó el agente generator
#    (y reparó el healer). Los agentes se usan desde Claude Code: ver su README.
Invoke-Tool '[1/3] Playwright Test Agents' { npm run test:pw-agents:bolsillos }

# 2. Postman + Postbot: la colección (con las pruebas de Postbot) vía Newman.
Invoke-Tool '[2/3] Postman (Newman)' { npm run test:postman:bolsillos }

# 3. Keploy: reproduce los casos grabados con mocks de Supabase.
Invoke-Tool '[3/3] Keploy (replay)' { npm run test:keploy:bolsillos }

Write-Host "`n===============================================================" -ForegroundColor Cyan
foreach ($entry in $results.GetEnumerator()) {
  $color = if ($entry.Value -eq 'OK') { 'Green' } else { 'Red' }
  Write-Host (' {0,-32} {1}' -f $entry.Key, $entry.Value) -ForegroundColor $color
}
Write-Host '===============================================================' -ForegroundColor Cyan

if ($results.Values -contains 'OK' -and -not ($results.Values | Where-Object { $_ -ne 'OK' })) { exit 0 } else { exit 1 }
