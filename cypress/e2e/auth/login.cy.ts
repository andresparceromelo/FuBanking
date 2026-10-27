describe('Funcionalidad 1: Inicio de sesión sin 2FA (Suite 09 - Login)', () => {
  beforeEach(() => {
    cy.cleanSession();
    cy.visit('/login');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
  });

  it('CP01: Login Exitoso con credenciales válidas redirige al panel', () => {
    cy.get('#email').should('be.visible').type('Pruebaskatalon@gmail.com');
    cy.get('#password').should('be.visible').type('Katalon123.');
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('not.include', '/login');
  });

  it('CP02: Login con opción Recordarme activada', () => {
    cy.get('#email').should('be.visible').type('Pruebaskatalon@gmail.com');
    cy.get('#password').should('be.visible').type('Katalon123.');
    cy.get('input[type="checkbox"]').check({ force: true });
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('not.include', '/login');
  });

  it('CP03: Login con contraseña incorrecta muestra mensaje de error', () => {
    cy.get('#email').should('be.visible').type('Pruebaskatalon@gmail.com');
    cy.get('#password').should('be.visible').type('ClaveIncorrecta123.');
    cy.get('button[type="submit"]').click();

    cy.contains('Correo o contraseña incorrectos', { timeout: 8000 }).should('be.visible');
    cy.url().should('include', '/login');
  });

  it('CP04: Login con correo no registrado muestra error genérico', () => {
    cy.get('#email').should('be.visible').type('noexiste@fubanking.test');
    cy.get('#password').should('be.visible').type('Katalon123.');
    cy.get('button[type="submit"]').click();

    cy.contains('Correo o contraseña incorrectos', { timeout: 8000 }).should('be.visible');
    cy.url().should('include', '/login');
  });

  it('CP05: Validación de campos vacíos obligatorios', () => {
    cy.get('button[type="submit"]').click();

    cy.contains('El correo electrónico es requerido', { timeout: 5000 }).should('be.visible');
    cy.contains('La contraseña es requerida').should('be.visible');
    cy.url().should('include', '/login');
  });
});
