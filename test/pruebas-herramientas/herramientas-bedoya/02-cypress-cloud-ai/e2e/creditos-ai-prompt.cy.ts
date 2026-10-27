/// <reference types="cypress" />

/**
 * Suite E2E de Créditos con Natural Language AI Authoring: cy.prompt()
 * Conectado a Cypress Cloud (Project: ypgf2b)
 * Autor: Andres Bedoya Cano
 */

describe('Herramienta 2 - Cypress Cloud & AI: cy.prompt() en Simulación de Créditos', () => {
  beforeEach(() => {
    cy.loginByApi('bedoyacanoandres2@gmail.com');
  });

  it('ejecuta el flujo completo de simulación mediante prompts en lenguaje natural', () => {
    cy.prompt([
      'Navegar a la pantalla del simulador de créditos (/loans)',
      'Digitar un monto de préstamo de 5000000 de pesos colombianos',
      'Configurar el plazo de amortización en 12 meses',
      'Asegurar una tasa de interés del 18% anual',
      'Hacer clic en el botón Simular Crédito para calcular la tabla',
      'Verificar que la cuota mensual calculada se muestre en pantalla'
    ]);

    // Verificaciones adicionales de aserción
    cy.get('[data-cy="loan-amount"]').should('have.value', '5000000');
    cy.get('[data-cy="loan-installments"]').should('have.value', '12');
    cy.get('[data-cy="monthly-payment"]').should('be.visible').and('contain', '$');
  });

  it('valida escenario alternativo de microcrédito mediante cy.prompt()', () => {
    cy.prompt([
      'Ingresar al módulo /loans',
      'Digitar un monto de microcrédito de 1500000 pesos',
      'Seleccionar un plazo corto de 6 cuotas',
      'Hacer clic en el botón Simular Crédito',
      'Verificar el resultado de la cuota mensual'
    ]);

    cy.get('[data-cy="loan-amount"]').should('have.value', '1500000');
    cy.get('[data-cy="loan-installments"]').should('have.value', '6');
    cy.get('[data-cy="monthly-payment"]').should('be.visible');
  });
});
