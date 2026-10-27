# Cypress + Gherkin — Bolsillos y Depositar

Cypress ejecuta los **mismos `.feature`** que la suite de Serenity/JS
(`e2e/serenity/features/{bolsillos,deposito,recorrido}`): una sola especificación en Gherkin y dos motores. Va contra
el backend y el frontend reales, sin `cy.intercept`. Cada escenario crea sus clientes por la API.

| Archivo | Rol |
|---|---|
| `../../cypress.bolsillos.config.ts` | Config propia (no toca `cypress.config.ts` de Créditos): preprocesador `@badeball/cypress-cucumber-preprocessor` + esbuild, reportes Cucumber en `cypress/reports/bolsillos/`. |
| `step_definitions/parameters.ts` | Tipos `{actor}` (Ana, Bruno…) y `{pronoun}` (él, ella), iguales a Serenity. |
| `step_definitions/*.steps.ts` | Pasos de cliente, bolsillos y depósito (API con `cy.request`, pantalla con `cy.get`). |
| `support/cast.ts` | Lo que cada actor sabe: credenciales, cuenta, bolsillos y la última respuesta. |
| `support/api.ts` | Registro, cuenta, depósito y consultas de oráculo contra `:3001/api/v1`. |
| `support/screens.ts` | Pantallas `/login`, `/pockets` y `/accounts`. |

## Cobertura (39 ejecuciones: 36 compartidas con Serenity + 3 de accesibilidad)

| Feature | Escenarios | Etiquetas |
|---|---|---|
| Crear bolsillo | 7 | `@api` `@web` `@smoke` |
| Consultar bolsillos | 4 | `@api` `@web` `@seguridad` |
| Editar bolsillo | 5 | `@api` `@web` |
| Eliminar bolsillo | 3 | `@api` `@web` `@seguridad` |
| Transferir entre bolsillos | 5 | `@api` `@web` |
| Depositar | 11 | `@api` `@web` `@seguridad` |
| Recorrido: abonar y ahorrar | 1 | `@web` `@smoke` |
| Accesibilidad (`features/accesibilidad.feature`, solo Cypress) | 3 | `@web` `@accesibilidad` — axe-core, WCAG 2.1 AA, falla con impacto *serious*/*critical* |

## Ejecución

```bash
npm run test:cypress:bolsillos            # todo
npm run test:cypress:bolsillos:api        # solo @api
npm run test:cypress:bolsillos:web        # solo @web (UI)
npm run test:cypress:bolsillos:seguridad  # solo @seguridad
npm run test:cypress:bolsillos:open       # modo interactivo
```

Reporte: `cypress/reports/bolsillos/cucumber-report.html`. Capturas de fallos: `cypress/reports/bolsillos/screenshots/`.
