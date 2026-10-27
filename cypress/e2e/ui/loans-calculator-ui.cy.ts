describe('UI y Formularios: Simulador y Validaciones de Interfaz', () => {
  beforeEach(() => {
    // Iniciar sesión programáticamente para enfocar los tests en la interfaz del simulador
    cy.loginByApi('bedoyacanoandres2@gmail.com');
    cy.visit('/loans');
  });

  it('carga los valores iniciales por defecto en el simulador', () => {
    cy.get('[data-cy=loan-amount]').should('have.value', '5000000');
    cy.get('[data-cy=loan-installments]').should('have.value', '12');
    cy.get('[data-cy=loan-annual-rate]').should('have.value', '18');
    cy.get('[data-cy=btn-simulate]').should('be.visible').and('not.be.disabled');
  });

  it('permite limpiar y digitar nuevos valores numéricos con el teclado', () => {
    cy.get('[data-cy=loan-amount]')
      .clear()
      .type('8500000')
      .should('have.value', '8500000');

    cy.get('[data-cy=loan-installments]')
      .clear()
      .type('24')
      .should('have.value', '24');

    cy.get('[data-cy=loan-annual-rate]')
      .clear()
      .type('16')
      .should('have.value', '16');
  });

  it('muestra la caja de resultados formateada al simular con éxito', () => {
    cy.intercept('POST', '**/api/v1/loans/simulate', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          amount: 5000000,
          installments: 12,
          annualRate: 18,
          monthlyRate: 0.01388,
          monthlyPayment: 456200,
          totalToPay: 5474400,
          totalInterest: 474400,
        },
      },
    }).as('mockSimulate');

    cy.get('[data-cy=btn-simulate]').click();
    cy.wait('@mockSimulate');

    cy.get('[data-cy=result-box]').should('be.visible');
    cy.get('[data-cy=monthly-payment]').should('contain', '$');
    cy.get('[data-cy=total-to-pay]').should('contain', '$');
    cy.get('[data-cy=total-interest]').should('contain', '$');
  });

  it('renderiza adecuadamente en resoluciones móviles y de escritorio', () => {
    // Vista móvil
    cy.viewport(375, 667);
    cy.get('[data-cy=loan-amount]').should('be.visible');
    cy.get('[data-cy=btn-simulate]').should('be.visible');

    // Vista escritorio
    cy.viewport(1280, 720);
    cy.get('[data-cy=loan-amount]').should('be.visible');
    cy.get('[data-cy=btn-simulate]').should('be.visible');
  });
});
