// cypress/support/e2e.ts
/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import './commands';
import 'cypress-axe';

// Evitar que excepciones benignas de hidratación en Next.js aborten los tests de Cypress
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('NEXT_REDIRECT') ||
    err.message.includes('Hydration') ||
    err.message.includes('ResizeObserver') ||
    err.message.includes('Script error')
  ) {
    return false;
  }
  return true;
});
