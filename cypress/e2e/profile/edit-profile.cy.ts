describe('Funcionalidad 4: Editar perfil (Suite 12 - Perfil)', () => {
  const userEmail = 'pruebaskatalon@gmail.com';
  const userPassword = 'Katalon123.';

  const loginAndGoToProfile = () => {
    cy.cleanSession();
    cy.intercept('POST', '**/api/v1/auth/login').as('loginReq');
    cy.visit('/login');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
    cy.get('#email').should('be.visible').clear().type(userEmail);
    cy.get('#password').should('be.visible').clear().type(userPassword);
    cy.get('button[type="submit"]').should('not.be.disabled').click();
    cy.wait('@loginReq', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.contains('button', 'Editar datos', { timeout: 15000 }).should('be.visible');
  };

  it('CP01: Editar nombre y apellido exitosamente', () => {
    loginAndGoToProfile();
    cy.contains('button', 'Editar datos').click();

    cy.get('#firstName').should('be.visible').clear().type('Carlos');
    cy.get('#lastName').should('be.visible').clear().type('Gomez');
    cy.contains('button', 'Guardar cambios').click();

    cy.contains('button', 'Editar datos', { timeout: 10000 }).should('be.visible');
  });

  it('CP02: Editar teléfono e ingresos mensuales exitosamente', () => {
    loginAndGoToProfile();
    cy.contains('button', 'Editar datos').click();

    cy.get('#phone').should('be.visible').clear().type('+57 300 123 4567');
    cy.get('#monthlyIncome').should('be.visible').clear().type('3500000');
    cy.contains('button', 'Guardar cambios').click();

    cy.contains('button', 'Editar datos', { timeout: 10000 }).should('be.visible');
  });

  it('CP03: Validación con primer nombre menor a 2 caracteres', () => {
    loginAndGoToProfile();
    cy.contains('button', 'Editar datos').click();

    cy.get('#firstName').should('be.visible').clear().type('A');
    cy.contains('button', 'Guardar cambios').click();

    cy.contains('El primer nombre debe tener al menos 2 caracteres', { timeout: 5000 }).should('be.visible');
    cy.contains('Editar mis datos').should('be.visible');
  });

  it('CP04: Validación con primer apellido menor a 2 caracteres', () => {
    loginAndGoToProfile();
    cy.contains('button', 'Editar datos').click();

    cy.get('#lastName').should('be.visible').clear().type('G');
    cy.contains('button', 'Guardar cambios').click();

    cy.contains('El primer apellido debe tener al menos 2 caracteres', { timeout: 5000 }).should('be.visible');
    cy.contains('Editar mis datos').should('be.visible');
  });

  it('CP05: Cancelar edición retorna a la vista principal del perfil', () => {
    loginAndGoToProfile();
    cy.contains('button', 'Editar datos').click();

    cy.contains('Editar mis datos', { timeout: 5000 }).should('be.visible');
    cy.contains('button', 'Cancelar').click();

    cy.contains('button', 'Editar datos', { timeout: 5000 }).should('be.visible');
  });
});
