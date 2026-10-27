import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import { defineConfig } from 'cypress';

/**
 * Cypress + Cucumber para Bolsillos (5 funcionalidades) y Depositar.
 *
 * Ejecuta los MISMOS .feature que la suite de Serenity/JS
 * (`e2e/serenity/features/{bolsillos,deposito,recorrido}`): una sola especificación en
 * Gherkin, dos motores de automatización. Va contra el backend (:3001) y el
 * frontend (:3000) reales, sin cy.intercept.
 *
 * Archivo aparte de `cypress.config.ts` (Créditos) para no cambiar esa suite.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.E2E_WEB_URL ?? 'http://localhost:3000',
    // + accesibilidad, que es propia de Cypress (axe-core) y no está en Serenity.
    specPattern: [
      'e2e/serenity/features/{bolsillos,deposito,recorrido}/**/*.feature',
      'cypress/bolsillos/features/**/*.feature',
    ],
    supportFile: 'cypress/bolsillos/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    // El primer acceso a cada ruta de Next en modo dev compila la página.
    pageLoadTimeout: 90_000,
    defaultCommandTimeout: 15_000,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/reports/bolsillos/screenshots',
    downloadsFolder: 'cypress/reports/bolsillos/downloads',
    // Cypress 15: los valores públicos van en `expose` (Cypress.expose en el
    // navegador); `env` queda para secretos y aquí no hay ninguno.
    allowCypressEnv: false,
    expose: {
      apiUrl: process.env.E2E_API_URL ?? 'http://localhost:3001/api/v1',
      stepDefinitions: 'cypress/bolsillos/step_definitions/**/*.ts',
      htmlEnabled: true,
      htmlOutput: 'cypress/reports/bolsillos/cucumber-report.html',
      jsonEnabled: true,
      jsonOutput: 'cypress/reports/bolsillos/cucumber-report.json',
      messagesEnabled: true,
      messagesOutput: 'cypress/reports/bolsillos/cucumber-messages.ndjson',
      // Con --expose tags=@api (o @web, @seguridad) solo corren esos escenarios.
      filterSpecs: true,
      omitFiltered: true,
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }));
      on('task', {
        a11yViolations(violations: unknown[]) {
          console.table(violations);
          return null;
        },
      });
      return config;
    },
  },
});
