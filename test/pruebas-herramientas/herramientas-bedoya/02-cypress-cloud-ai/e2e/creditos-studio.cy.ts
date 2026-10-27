/// <reference types="cypress" />

/**
 * Suite E2E de Créditos compatible con Cypress Studio AI
 * Conectado a Cypress Cloud (Project: ypgf2b)
 * Permite grabar nuevas interacciones haciendo clic en el icono de varita mágica/Studio en la UI.
 * Autor: Andres Bedoya Cano
 */

describe('Herramienta 2 - Cypress Studio AI: Grabación y Modificación Visual de Tests', () => {
  beforeEach(() => {
    cy.loginByApi('bedoyacanoandres2@gmail.com');
    cy.visit('/loans');
  });

  /* ==== Test Created with Cypress Studio ==== */
  it('permite registrar interacciones interactivas en el simulador mediante Studio', () => {
    /* ==== Generated with Cypress Studio ==== */
    cy.get('[data-cy="loan-amount"]').clear().type('7500000');
    cy.get('[data-cy="loan-installments"]').clear().type('24');
    cy.get('[data-cy="btn-simulate"]').click();
    cy.get('[data-cy="result-box"]', { timeout: 8000 }).should('be.visible');
    cy.get('[data-cy="monthly-payment"]').should('be.visible');
    cy.get('[data-cy="total-to-pay"]').should('be.visible');
    /* ==== End Cypress Studio ==== */
  });

  /* ==== Test Placeholder para que el evaluador / docente grabe en vivo ==== */
  it('escenario interactivo listo para extender con Cypress Studio (Abrir en cypress open)', () => {
    // Al abrir con "npm run test:cypress:studio", pasa el mouse sobre este test
    // y haz clic en el icono de varita ("Add Commands to Test") para grabar acciones interactivas.
    cy.get('[data-cy="loan-amount"]').should('be.visible');
    cy.get('[data-cy="loan-installments"]').should('be.visible');
    cy.get('[data-cy="btn-simulate"]').should('be.visible');
  });
});
