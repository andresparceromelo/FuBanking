# FuBanking — Suite de 3 Herramientas de Testing Avanzado
**Autor:** Andres Bedoya Cano  
**Módulo Evaluado:** Créditos y Préstamos (`/loans`) en FuBanking  
**Stack de Pruebas:** Microsoft Playwright MCP, Cypress Cloud + AI, ReportPortal Docker Compose

---

## 📌 Resumen de las 3 Tecnologías Implementadas

| # | Tecnología | Directorio | Comando Rápido | Propósito Principal |
|---|---|---|---|---|
| **1** | **Microsoft Playwright MCP Server** | [`01-mcp-playwright/`](./01-mcp-playwright/) | `npm run test:mcp:playwright` | Automatización E2E semántica desacoplada vía Model Context Protocol (`@playwright/mcp`). |
| **2** | **Cypress Cloud + Studio AI + `cy.prompt()`** | [`02-cypress-cloud-ai/`](./02-cypress-cloud-ai/) | `npm run test:cypress:cloud` | Authoring con lenguaje natural (`cy.prompt`), Studio interactivo y telemetría Cloud. |
| **3** | **ReportPortal (Docker Compose)** | [`03-reportportal/`](./03-reportportal/) | `npm run test:rp:cypress`<br/>`npm run test:rp:playwright` | Dashboard unificado con **reportes separados e independientes** para Cypress y Playwright. |

---

## 🚀 Guía Rápida de Comandos

```bash
# 1. Ejecutar prueba E2E con el Servidor MCP de Playwright
npm run test:mcp:playwright

# 2. Ejecutar y sincronizar suite de Cypress en Cypress Cloud
npm run test:cypress:cloud

# 3. Abrir Cypress en modo interactivo con Cypress Studio AI
npm run test:cypress:studio

# 4. Levantar ReportPortal con Docker Compose (Puerto :8088)
docker compose -f test/pruebas-herramientas/herramientas-bedoya/03-reportportal/docker-compose.yml up -d

# 5. Enviar reporte independiente de Cypress a ReportPortal
npm run test:rp:cypress

# 6. Enviar reporte independiente de Playwright a ReportPortal
npm run test:rp:playwright

# 7. Ejecución consolidada de toda la suite
npm run test:herramientas:all
```

---

## 📚 Documento de Sustentación para Evaluación
Para consultar la justificación teórica, arquitectura comparativa, retorno de inversión y el banco de preguntas típicas de examen/sustentación, lee:

👉 [**SUSTENTACION.md**](./SUSTENTACION.md)
