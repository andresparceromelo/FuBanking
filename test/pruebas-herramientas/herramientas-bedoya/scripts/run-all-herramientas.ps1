# ===============================================================
# Orquestador General: 3 Herramientas de Testing Avanzado
# Autor: Andres Bedoya Cano - FuBanking
# ===============================================================

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO EJECUCIÓN CONJUNTA DE LAS 3 HERRAMIENTAS - BEDOYA" -ForegroundColor Cyan
Write-Host "===============================================================`n" -ForegroundColor Cyan

# 1. Herramienta 1: Microsoft Playwright MCP Server
Write-Host ">>> [1/3] Ejecutando Herramienta 1: Microsoft Playwright MCP Server..." -ForegroundColor Yellow
npx tsx test/pruebas-herramientas/herramientas-bedoya/01-mcp-playwright/runner/loans-mcp.test.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Herramienta 1 (Playwright MCP) finalizada exitosamente.`n" -ForegroundColor Green
} else {
    Write-Host "⚠️ Herramienta 1 reportó advertencias o errores.`n" -ForegroundColor Red
}

# 2. Herramienta 2: Cypress Cloud + Studio AI + cy.prompt()
Write-Host ">>> [2/3] Ejecutando Herramienta 2: Cypress Cloud + AI..." -ForegroundColor Yellow
npx cypress run --config-file test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/cypress.cloud.config.ts --record --key ac573719-2fc7-4b3f-b0d7-af3d816c659c
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Herramienta 2 (Cypress Cloud + cy.prompt) sincronizada con éxito en https://cloud.cypress.io/projects/ypgf2b.`n" -ForegroundColor Green
} else {
    Write-Host "⚠️ Herramienta 2 reportó advertencias o errores.`n" -ForegroundColor Red
}

# 3. Herramienta 3: Reportes Independientes en ReportPortal (Cypress y Playwright)
Write-Host ">>> [3/3] Ejecutando Herramienta 3: ReportPortal (Reportes Separados)..." -ForegroundColor Yellow

Write-Host "  --> [3.A] Ejecutando Suite Cypress para ReportPortal..." -ForegroundColor Gray
node test/pruebas-herramientas/herramientas-bedoya/03-reportportal/cypress-agent/run-cypress-rp.mjs

Write-Host "  --> [3.B] Ejecutando Suite Playwright para ReportPortal..." -ForegroundColor Gray
node test/pruebas-herramientas/herramientas-bedoya/03-reportportal/playwright-agent/run-playwright-rp.mjs

Write-Host "`n===============================================================" -ForegroundColor Cyan
Write-Host "🎉 EJECUCIÓN DE LAS 3 HERRAMIENTAS COMPLETADA" -ForegroundColor Cyan
Write-Host "📖 Consulta la memoria técnica de defensa en: SUSTENTACION.md" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
