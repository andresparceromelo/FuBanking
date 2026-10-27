# Playwright Test Agents — Bolsillos y Depositar

Playwright (≥ 1.56) trae tres **agentes de IA** que trabajan en cadena sobre la aplicación real:

| Agente | Entrada | Salida | Archivo |
|---|---|---|---|
| 🎭 **planner** | Una petición ("planea pruebas de Crear bolsillo") + el seed | Plan en Markdown con escenarios, pasos y resultados esperados | `specs/*.md` |
| 🎭 **generator** | Un plan de `specs/` | Test de Playwright verificado en vivo (localizadores y aserciones reales) | `tests/*.spec.ts` |
| 🎭 **healer** | Un test que falla | El test reparado, o marcado `test.fixme` si el fallo es del producto | `tests/*.spec.ts` |

Los agentes no tienen modelo propio: corren dentro de un **bucle agéntico** (aquí, Claude Code con
`--loop=claude`) y controlan el navegador con el servidor MCP de pruebas de Playwright
(`playwright run-test-mcp-server`).

## Configuración en este repo

| Archivo | Para qué |
|---|---|
| `.claude/agents/playwright-test-{planner,generator,healer}.md` | Definición de los 3 agentes (generada con `npx playwright init-agents --loop=claude`). |
| `.mcp.json` (raíz) | Servidor MCP `playwright-test` apuntando a `playwright.config.ts` de esta carpeta. |
| `playwright.config.ts` | Proyecto Chromium, reporte HTML/JSON en `evidence/`, capturas siempre. |
| `tests/fixtures.ts` | Cada test arranca con una clienta **nueva** (saldo 500.000) creada por la API real y con sesión abierta en `/pockets`. Expone `client.api` como oráculo (saldo y bolsillos). |
| `tests/seed.spec.ts` | Seed: el punto de partida del planner y del generator. |

Para regenerar los agentes (por ejemplo, al actualizar Playwright):

```bash
npx playwright init-agents --loop=claude -c test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/playwright.config.ts
```

## Cómo se ejecutan los agentes

1. Levantar backend (:3001) y frontend (:3000).
2. Abrir **una sesión nueva** de Claude Code en la raíz del repo: los servidores MCP y los agentes se cargan
   al iniciar la sesión. Aprobar el servidor `playwright-test` cuando lo pida.
3. Pedir, en orden:
   - *"Usa el agente playwright-test-planner para planear las pruebas de Crear, Consultar, Editar, Eliminar
     y Transferir bolsillos y de Depositar (pantalla /accounts). Guarda un plan por funcionalidad en
     `test/pruebas-herramientas/herramientas-alejandro/01-playwright-test-agents/specs/`."*
   - *"Usa el agente playwright-test-generator para generar los tests de cada plan."*
   - *"Usa el agente playwright-test-healer para reparar los tests que fallen."*
4. Correr la suite generada (sin IA, determinista; sirve también como regresión):

```bash
npm run test:pw-agents:bolsillos
```

## Evidencias

- `specs/*.md`: planes del planner (objetivo, pasos, resultado esperado).
- `tests/*.spec.ts`: tests del generator (cada uno referencia su plan y el seed).
- `evidence/html-report/`, `evidence/results.json`: resultado de la corrida.
- Capturas de la sesión de Claude Code con las llamadas de cada agente (planner → generator → healer).

## Resultado (2026-10-27)

| Agente | Qué hizo | Salida |
|---|---|---|
| 🎭 planner | 12 escenarios (2 por funcionalidad: exitoso y de error) con pasos, toasts, montos y oráculo de backend | `specs/bolsillos-depositar.md` |
| 🎭 generator | 3 sesiones (Crear + Consultar, Editar + Eliminar, Transferir + Depositar); ejecutó cada paso en vivo antes de escribirlo | 6 archivos en `tests/` |
| 🎭 healer | No hubo tests fallidos que reparar | — |

**Corrida de la suite generada:** `npm run test:pw-agents:bolsillos` → **13/13** (12 escenarios + seed) en 2,2 min.
Evidencia: `evidence/html-report/` y `evidence/results.json`.

| Archivo | Escenarios |
|---|---|
| `crear-bolsillo.spec.ts` | CRE-01 crear con saldo, CRE-02 nombre vacío y monto > saldo |
| `consultar-bolsillos.spec.ts` | CON-01 lista y selects, CON-02 lista vacía y fallo de la API (`page.route`) |
| `editar-bolsillo.spec.ts` | EDI-01 renombrar y aumentar, EDI-02 nombre vacío y monto > disponible |
| `eliminar-bolsillo.spec.ts` | ELI-01 eliminar con confirmación, ELI-02 cancelar y bolsillo ya borrado |
| `transferir-entre-bolsillos.spec.ts` | TRA-01 transferir, TRA-02 sin datos, saldo insuficiente y mismo bolsillo |
| `depositar.spec.ts` | DEP-01 abonar 150.000, DEP-02 monto 0 y negativo |

### Aportes y limitaciones observados

- **Aportes:** el generator ajustó el plan a la UI real. Las tarjetas y los selects salen en otro orden, así que los tests buscan por nombre. Los toasts se apilan, así que cierra el anterior antes de repetir uno. Además, `/accounts` formatea con espacio no separable y agregó cabeceras CORS al simular un 500. Cada test termina verificando saldo y bolsillos en el backend.
- **Limitaciones:** la primera vez el planner no pudo abrir el navegador. El servidor MCP pedía `chromium-1248` y había que correr `npx playwright install chromium`, así que el plan salió del código fuente y de los selectores de Serenity. El generator no tiene shell: escribe los tests pero no los corre con `npx playwright test`; eso se hizo aparte. La latencia de las herramientas MCP (más de 4 s) a veces no alcanzaba a leer un toast en vivo.
- **Hallazgos de producto que dejó a la vista:**
  - En DEP-02 el error en línea no se limpia al cambiar el monto.
  - Tras un borrado fallido (ELI-02) la tarjeta vieja sigue en pantalla.
  - Confirmaron por tercera vía el defecto D-05: la doble resta al crear varios bolsillos.
