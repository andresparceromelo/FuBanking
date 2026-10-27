describe('Funcionalidad 3: Registro de usuarios (Suite 08 - Registro)', () => {
  beforeEach(() => {
    cy.cleanSession();
    cy.visit('/register');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
  });

  it('CP01: Registro Exitoso con datos válidos y únicos', () => {
    const timestamp = Date.now().toString().slice(-6);
    const uniqueEmail = `user_${timestamp}@gmail.com`;
    const uniqueDoc = `10${Date.now().toString().slice(-7)}`;

    cy.get('#firstName').should('be.visible').type('Juan');
    cy.get('#lastName').should('be.visible').type('Perez');
    cy.get('#birthDate').should('be.visible').type('1995-05-15');
    cy.get('#email').should('be.visible').type(uniqueEmail);
    cy.get('#document').should('be.visible').type(uniqueDoc);
    cy.get('#monthlyIncome').should('be.visible').type('2500000');
    cy.get('#password').should('be.visible').type('Katalon123.');
    cy.get('#confirmPassword').should('be.visible').type('Katalon123.');
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 12000 }).should('not.include', '/register');
  });

  it('CP02: Registro con correo duplicado muestra mensaje de error', () => {
    const uniqueDoc = `99${Date.now().toString().slice(-7)}`;

    cy.get('#firstName').should('be.visible').type('Ana');
    cy.get('#lastName').should('be.visible').type('Gomez');
    cy.get('#birthDate').should('be.visible').type('1995-03-10');
    cy.get('#email').should('be.visible').type('Pruebaskatalon@gmail.com');
    cy.get('#document').should('be.visible').type(uniqueDoc);
    cy.get('#monthlyIncome').should('be.visible').type('2500000');
    cy.get('#password').should('be.visible').type('Katalon123.');
    cy.get('#confirmPassword').should('be.visible').type('Katalon123.');
    cy.get('button[type="submit"]').click();

    cy.contains('Ya existe una cuenta con este correo electrónico', { timeout: 8000 }).should('be.visible');
    cy.url().should('include', '/register');
  });

  it('CP03: Registro con contraseña débil muestra advertencia y bloquea envío', () => {
    const timestamp = Date.now().toString().slice(-6);
    const uniqueEmail = `carlos_${timestamp}@gmail.com`;
    const uniqueDoc = `88${Date.now().toString().slice(-7)}`;

    cy.get('#firstName').should('be.visible').type('Carlos');
    cy.get('#lastName').should('be.visible').type('Ruiz');
    cy.get('#birthDate').should('be.visible').type('1990-01-01');
    cy.get('#email').should('be.visible').type(uniqueEmail);
    cy.get('#document').should('be.visible').type(uniqueDoc);
    cy.get('#monthlyIncome').should('be.visible').type('2000000');
    cy.get('#password').should('be.visible').type('1234');
    cy.get('#confirmPassword').should('be.visible').type('1234');

    cy.contains(/la contraseña es demasiado débil|al menos 8 caracteres/i, { timeout: 5000 }).should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.url().should('include', '/register');
  });

  it('CP04: Registro con campos obligatorios vacíos muestra errores de validación', () => {
    cy.get('button[type="submit"]').click();

    cy.contains('El primer nombre debe tener al menos 2 caracteres', { timeout: 5000 }).should('be.visible');
    cy.contains('El primer apellido debe tener al menos 2 caracteres').should('be.visible');
    cy.contains('Correo electrónico inválido').should('be.visible');
    cy.contains('Documento inválido').should('be.visible');
    cy.url().should('include', '/register');
  });
});
