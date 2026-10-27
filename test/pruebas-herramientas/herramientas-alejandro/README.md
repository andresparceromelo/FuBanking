# FuBanking — 3 Herramientas de IA para Testing
**Autor:** Alejandro Bustamante
**Módulo evaluado:** Bolsillos (crear, consultar, editar, eliminar, transferir) + Depositar dinero
**Stack de pruebas:** Playwright Test Agents (Claude), Postman + Postbot (Newman), Keploy

---

## 📌 Resumen de las 3 herramientas

| # | Herramienta | Directorio | Comando rápido | Qué hace la IA |
|---|---|---|---|---|
| **1** | **Playwright Test Agents** | [`01-playwright-test-agents/`](./01-playwright-test-agents/) | `npm run test:pw-agents:bolsillos` | Tres agentes (planner, generator, healer) **planifican**, **generan** y **reparan** los tests E2E explorando la app real a través del servidor MCP de pruebas de Playwright. |
| **2** | **Postman + Postbot** | [`02-postman-postbot/`](./02-postman-postbot/) | `npm run test:postman:bolsillos` | Postbot genera y corrige aserciones y documentación de la colección de API; Newman la ejecuta en CI con reportes. |
| **3** | **Keploy** | [`03-keploy/`](./03-keploy/) | `npm run test:keploy:bolsillos` | Graba el tráfico real de la API y lo convierte en casos de prueba y **mocks** de Supabase; detecta ruido (ids, fechas, tokens) y reproduce sin base de datos. |

Las tres trabajan sobre el **backend y el frontend reales** (sin `cy.intercept` ni datos inventados) y usan el
mismo oráculo que el resto de suites: el saldo y los bolsillos que devuelve la API.

---

## 🧭 Relación con las otras suites de Bolsillos

| Suite | Dónde | Comando |
|---|---|---|
| Gherkin + Screenplay (Serenity/JS) | `e2e/serenity/features/{bolsillos,deposito}` | `npm run test:e2e:serenity` |
| Gherkin + Cypress (mismos `.feature`) | `cypress.bolsillos.config.ts`, `cypress/bolsillos/` | `npm run test:cypress:bolsillos` |
| Stagehand + Claude (`act`/`observe`/`extract`) | `e2e/stagehand/src/bolsillos/` | `npm run test:stagehand:bolsillos` |
| Herramientas de IA (esta carpeta) | `test/pruebas-herramientas/herramientas-alejandro/` | `npm run test:herramientas:alejandro` |

---

## 🚀 Guía rápida

```bash
# 0. Sistema bajo prueba (dos terminales)
npm --prefix backend run dev
npm --prefix frontend run dev

# 1. Tests generados por los Playwright Test Agents
npm run test:pw-agents:bolsillos

# 2. Colección de Postman con Newman (reporte HTML en 02-postman-postbot/evidence)
npm run test:postman:bolsillos

# 3. Keploy: grabar una vez y luego reproducir
powershell -File test/pruebas-herramientas/herramientas-alejandro/03-keploy/keploy.ps1 record
npm run test:keploy:bolsillos

# Las tres seguidas
npm run test:herramientas:alejandro
```

---

## 📚 Detalle de cada herramienta

Configuración, resultados, aportes y limitaciones en el README de cada carpeta:
[`01-playwright-test-agents/`](./01-playwright-test-agents/README.md) ·
[`02-postman-postbot/`](./02-postman-postbot/README.md) ·
[`03-keploy/`](./03-keploy/README.md)
