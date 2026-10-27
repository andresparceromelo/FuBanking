#!/usr/bin/env bash
set -e

echo "==============================================================="
echo "🚀 INICIANDO EJECUCIÓN CONJUNTA DE LAS 3 HERRAMIENTAS - BEDOYA"
echo "==============================================================="

echo ">>> [1/3] Ejecutando Herramienta 1: Microsoft Playwright MCP Server..."
npx tsx test/pruebas-herramientas/herramientas-bedoya/01-mcp-playwright/runner/loans-mcp.test.ts

echo ">>> [2/3] Ejecutando Herramienta 2: Cypress Cloud + AI..."
npx cypress run --config-file test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/cypress.cloud.config.ts --record --key ac573719-2fc7-4b3f-b0d7-af3d816c659c

echo ">>> [3/3] Ejecutando Herramienta 3: Reportes Separados en ReportPortal..."
node test/pruebas-herramientas/herramientas-bedoya/03-reportportal/cypress-agent/run-cypress-rp.mjs || true
node test/pruebas-herramientas/herramientas-bedoya/03-reportportal/playwright-agent/run-playwright-rp.mjs || true

echo "==============================================================="
echo "🎉 EJECUCIÓN DE LAS 3 HERRAMIENTAS COMPLETADA"
echo "==============================================================="
