/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import 'cypress-axe';

// Support propio de Bolsillos y Depositar: no carga `cypress/support/commands.ts`
// (Créditos), cuyos comandos simulan el backend con cy.intercept. Aquí todo
// va contra el backend y Supabase reales.

Cypress.on('uncaught:exception', err => {
  // Avisos benignos de Next en modo dev; cualquier otro error sí rompe la prueba.
  if (['NEXT_REDIRECT', 'Hydration', 'ResizeObserver'].some(text => err.message.includes(text))) {
    return false;
  }
  return true;
});
