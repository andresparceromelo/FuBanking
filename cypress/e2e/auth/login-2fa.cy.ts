describe('Funcionalidad 2: Inicio de sesión con 2FA activo (Suite 10 - Login 2FA)', () => {
  const userEmail = 'katalonfa@gmail.com';
  const userPassword = 'Katalon123.';

  beforeEach(() => {
    cy.cleanSession();
  });

  /** Helper: visita /login, espera hidratación y hace login con las credenciales dadas */
  function doLogin(email: string, password: string) {
    cy.visit('/login');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
    cy.get('#email').should('be.visible').clear().type(email);
    cy.get('#password').should('be.visible').clear().type(password);
    cy.get('button[type="submit"]').should('not.be.disabled').click();
  }

  it('CP01: Login 2FA Exitoso con código capturado del backend', () => {
    doLogin(userEmail, userPassword);

    cy.contains('Verificación de seguridad', { timeout: 12000 }).should('be.visible');

    cy.getLatest2FACode(userEmail).then((codeFromBackend) => {
      cy.window().then((win) => {
        const code = codeFromBackend || win.sessionStorage.getItem('2fa_dev_code') || '123456';
        cy.fillOTP(code);
      });
    });

    cy.get('button[type="submit"]').then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
      }
    });

    cy.url({ timeout: 12000 }).should('match', /\/(profile|dashboard)/);
  });

  it('CP02: Login 2FA con código incorrecto muestra mensaje de error', () => {
    doLogin(userEmail, userPassword);

    cy.contains('Verificación de seguridad', { timeout: 12000 }).should('be.visible');

    cy.fillOTP('000000');

    cy.get('button[type="submit"]').then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
      }
    });

    cy.contains(/código incorrecto/i, { timeout: 8000 }).should('be.visible');
    cy.url().should('include', '/verify-two-factor');
  });

  it('CP03: Reenvío de código 2FA e inicio de sesión con el nuevo código', () => {
    doLogin(userEmail, userPassword);

    cy.contains('Verificación de seguridad', { timeout: 12000 }).should('be.visible');

    cy.contains('button', 'No recibí el código').click();
    cy.contains('¡Código reenviado exitosamente!', { timeout: 8000 }).should('be.visible');

    cy.getLatest2FACode(userEmail).then((newCodeFromBackend) => {
      cy.window().then((win) => {
        const code = newCodeFromBackend || win.sessionStorage.getItem('2fa_dev_code') || '123456';
        cy.fillOTP(code);
      });
    });

    cy.get('button[type="submit"]').then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
      }
    });

    cy.url({ timeout: 12000 }).should('match', /\/(profile|dashboard)/);
  });

  it('CP04: Acceso directo a /verify-two-factor sin sesión redirige a /login', () => {
    cy.visit('/verify-two-factor');
    cy.url({ timeout: 8000 }).should('include', '/login');
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');
  });

  it('CP05: Login con 2FA pero contraseña errónea bloquea acceso antes del 2FA', () => {
    doLogin(userEmail, 'ClaveErronea123.');

    cy.contains(/correo o contraseña incorrectos/i, { timeout: 8000 }).should('be.visible');
    cy.url().should('include', '/login');
  });
});
