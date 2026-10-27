describe('Seguridad: cabeceras, control de acceso y rechazo de credenciales', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001/api/v1';

  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('verifica que los endpoints expongan cabeceras de seguridad HTTP', () => {
    cy.request({
      url: `${apiUrl}/../health`,
      failOnStatusCode: false,
    }).then(({ headers }) => {
      // Helmet añade protecciones estándar de cabeceras
      expect(headers).to.have.property('x-content-type-options', 'nosniff');
    });
  });

  it('rechaza credenciales inválidas y muestra alerta semántica accesible (role=alert)', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Correo o contraseña incorrectos',
        },
      },
    }).as('loginAttempt');

    cy.visit('/login');
    cy.get('form[data-hydrated="true"]').should('be.visible');
    cy.get('[data-cy=email]').should('be.visible').type('usuario_inexistente@fubanking.com');
    cy.get('[data-cy=password]').should('be.visible').type('ClaveIncorrecta123*', { log: false });
    cy.get('[data-cy=login-btn]').click();

    cy.wait('@loginAttempt').its('response.statusCode').should('eq', 401);
    cy.get('[data-cy=login-error]').should('be.visible').and('have.attr', 'role', 'alert');
    cy.url().should('include', '/login');
  });

  it('redirige a /login cuando un usuario no autenticado intenta visitar /loans', () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.visit('/loans');
    cy.url().should('include', '/login');
  });

  it('redirige a /login cuando un usuario no autenticado intenta visitar /admin/loans', () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.visit('/admin/loans');
    cy.url().should('include', '/login');
  });

  it('rechaza solicitudes con tokens JWT alterados o inválidos (HTTP 401)', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/loans/me`,
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenFalsoYManipulado.abc' },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status).to.eq(401);
    });
  });
});
