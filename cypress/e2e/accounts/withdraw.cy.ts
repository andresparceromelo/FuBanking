describe('Funcionalidad 6: Retiros de dinero (Suite 13 - Retiro)', () => {
  const userEmail = 'pruebaskatalon@gmail.com';
  const userPassword = 'Katalon123.';

  const loginAndGoToAccounts = () => {
    cy.cleanSession();
    cy.intercept('POST', '**/api/v1/auth/login').as('loginReq');
    cy.visit('/login');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
    cy.get('#email').should('be.visible').clear().type(userEmail);
    cy.get('#password').should('be.visible').clear().type(userPassword);
    cy.get('button[type="submit"]').should('not.be.disabled').click();
    cy.wait('@loginReq', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.visit('/accounts');
    cy.contains('button', 'Retirar', { timeout: 15000 }).should('be.visible');
  };

  it('CP01: Retiro de dinero con monto válido', () => {
    loginAndGoToAccounts();
    cy.contains('button', 'Retirar').first().click();

    cy.get('#dw-amount').should('be.visible').clear().type('1000');
    cy.get('#dw-description').should('be.visible').clear().type('Retiro cajero automatico');
    cy.get('button[data-testid="dw-submit"]').click();

    cy.contains('button', 'Retirar', { timeout: 10000 }).should('be.visible');
  });

  it('CP02: Retiro con saldo insuficiente muestra mensaje de error', () => {
    loginAndGoToAccounts();
    cy.contains('button', 'Retirar').first().click();

    cy.get('#dw-amount').should('be.visible').clear().type('90000000000');
    cy.get('button[data-testid="dw-submit"]').click();

    cy.contains(/saldo insuficiente|insufficient_funds/i, { timeout: 8000 }).should('be.visible');
    cy.contains('h3', 'Retirar Dinero').should('be.visible');
  });

  it('CP03: Retiro con monto inválido (cero) muestra validación', () => {
    loginAndGoToAccounts();
    cy.contains('button', 'Retirar').first().click();

    cy.get('#dw-amount').should('be.visible').clear().type('0');
    cy.get('button[data-testid="dw-submit"]').click();

    cy.contains(/monto válido mayor a cero|invalid_amount/i, { timeout: 5000 }).should('be.visible');
    cy.contains('h3', 'Retirar Dinero').should('be.visible');
  });

  it('CP04: Cancelar retiro cierra el modal y vuelve a la vista de cuentas', () => {
    loginAndGoToAccounts();
    cy.contains('button', 'Retirar').first().click();

    cy.contains('h3', 'Retirar Dinero', { timeout: 5000 }).should('be.visible');
    cy.contains('button', 'Cancelar').click();

    cy.contains('button', 'Retirar', { timeout: 5000 }).should('be.visible');
  });
});
