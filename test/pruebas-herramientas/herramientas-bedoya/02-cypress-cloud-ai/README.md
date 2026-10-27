# Cypress Cloud + Studio AI + cy.prompt() — Módulo de Créditos

Este módulo implementa **Cypress Cloud**, **Cypress Studio AI** y el comando experimental en lenguaje natural **`cy.prompt()`** sobre el flujo de simulación de créditos de FuBanking.

---

## 1. Configuración de Cypress Cloud

- **Project ID en Cypress Cloud:** `ypgf2b`
- **Record Key:** `ac573719-2fc7-4b3f-b0d7-af3d816c659c`
- **Configuración:** `test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/cypress.cloud.config.ts`

### Capacidades habilitadas:
1. `experimentalStudio: true`: Habilita Cypress Studio en modo interactivo (`cypress open`) para grabar y actualizar tests visualmente desde el navegador sin escribir código a mano.
2. `cy.prompt()`: Authoring declarativo en lenguaje natural que traduce intenciones humanas a aserciones e interacciones DOM.
3. Grabación y sincronización de analítica, flakiness, videos y screenshots directamente en el dashboard web de **Cypress Cloud**.

---

## 2. Comandos de Ejecución

### Opción A: Ejecutar y Grabar en Cypress Cloud (Headless)
Envía la ejecución de la suite al panel oficial de Cypress Cloud con analítica en vivo:

```bash
npm run test:cypress:cloud
# o directamente:
npx cypress run --config-file test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/cypress.cloud.config.ts --record --key ac573719-2fc7-4b3f-b0d7-af3d816c659c
```

### Opción B: Ejecutar en Modo Interactivo con Cypress Studio AI (GUI)
Permite ver el navegador y usar el botón de varita mágica para grabar interacciones interactivas:

```bash
npm run test:cypress:studio
# o directamente:
npx cypress open --config-file test/pruebas-herramientas/herramientas-bedoya/02-cypress-cloud-ai/cypress.cloud.config.ts
```

---

## 3. Estructura de Suites E2E

- `creditos-ai-prompt.cy.ts`: Demostración del flujo guiado por `cy.prompt([ 'Navegar...', 'Digitar 5000000...', 'Simular...' ])`.
- `creditos-studio.cy.ts`: Test interactivo preparado con bloques `/* ==== Generated with Cypress Studio ==== */` para extender o demostrar en vivo ante el evaluador.
