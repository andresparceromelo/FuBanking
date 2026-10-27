describe('Regresión: Ciclo de vida de Créditos y Administración', () => {
  const clientEmail = 'bedoyacanoandres2@gmail.com';
  const clientPass = 'Miabuela585*';
  const adminEmail = 'bedoyacanoandres@gmail.com';
  const adminPass = 'FuBanking123*';

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('permite al cliente simular un préstamo con cálculo en tiempo real', () => {
    // Iniciar sesión programáticamente con credenciales de Gabriel
    cy.loginByApi(clientEmail);

    // Navegar al módulo de créditos
    cy.visit('/loans');
    cy.contains('h1', 'Créditos y Préstamos').should('be.visible');

    // Interceptar la llamada de simulación al backend Express
    cy.intercept('POST', '**/api/v1/loans/simulate').as('simulateReq');

    // Completar el simulador
    cy.get('[data-cy=loan-amount]').should('be.visible').clear().type('5000000');
    cy.get('[data-cy=loan-installments]').should('be.visible').clear().type('12');
    cy.get('[data-cy=loan-annual-rate]').should('be.visible').clear().type('18');

    // Ejecutar simulación
    cy.get('[data-cy=btn-simulate]').click();

    // Esperar respuesta de la API real y validar datos en pantalla
    cy.wait('@simulateReq').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      expect(interception.response?.body.data.monthlyPayment).to.be.greaterThan(0);
    });

    cy.get('[data-cy=result-box]').should('be.visible');
    cy.get('[data-cy=monthly-payment]').should('be.visible').and('not.be.empty');
    cy.get('[data-cy=total-to-pay]').should('be.visible').and('not.be.empty');
    cy.get('[data-cy=total-interest]').should('be.visible').and('not.be.empty');

    // Verificar checklist de requisitos
    cy.get('[data-cy=requirement-document]').should('be.visible');
    cy.get('[data-cy=requirement-age]').should('be.visible');
    cy.get('[data-cy=requirement-income]').should('be.visible');
    cy.get('[data-cy=requirement-creditHistory]').should('be.visible');
  });

  it('permite al administrador revisar y auditar las solicitudes de créditos', () => {
    // Iniciar sesión programáticamente como Andresito (Admin)
    cy.loginByApi(adminEmail);

    // Ir a la bandeja de gestión de créditos
    cy.visit('/admin/loans');
    cy.get('[data-cy=admin-loans-title]').should('be.visible');

    // Esperar que termine la carga inicial antes de interactuar
    cy.get('[data-cy=btn-refresh-loans]').should('be.visible').and('not.be.disabled');

    // Probar los filtros de auditoría
    cy.get('[data-cy=filter-pending]').click();
    cy.get('[data-cy=filter-approved]').click();
    cy.get('[data-cy=filter-all]').click();

    // Refrescar listado
    cy.get('[data-cy=btn-refresh-loans]').should('not.be.disabled').click();
  });
});
