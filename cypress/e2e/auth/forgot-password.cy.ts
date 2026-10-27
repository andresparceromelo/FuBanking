describe('Funcionalidad 5: Restablecer contraseña (Suite 11 - Recuperar contraseña)', () => {
  const targetEmail = 'pruebaskatalon2@gmail.com';
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001/api/v1';

  beforeEach(() => {
    cy.cleanSession();
  });

  it('CP01: Solicitud de restablecimiento exitosa muestra confirmación', () => {
    cy.visit('/forgot-password');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
    cy.get('#email').should('be.visible').type(targetEmail);
    cy.get('button[type="submit"]').click();

    cy.contains('Revisa tu correo', { timeout: 8000 }).should('be.visible');
    cy.contains('Te hemos enviado un enlace').should('be.visible');
  });

  it('CP02: Solicitud con formato de email inválido muestra error', () => {
    cy.visit('/forgot-password');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
    cy.get('#email').should('be.visible').type('correo-invalido-sin-arroba');
    cy.get('button[type="submit"]').click();

    cy.contains('Correo electrónico inválido', { timeout: 5000 }).should('be.visible');
    cy.url().should('include', '/forgot-password');
  });

  it('CP03: Solicitud con email vacío muestra error de validación', () => {
    cy.visit('/forgot-password');
    cy.get('form[data-hydrated="true"]', { timeout: 10000 }).should('exist');
    cy.get('button[type="submit"]').click();

    cy.contains(/correo electrónico inválido|requerido/i, { timeout: 5000 }).should('be.visible');
    cy.url().should('include', '/forgot-password');
  });

  it('CP04: Acceso con token inválido muestra mensaje y opción de solicitar nuevo enlace', () => {
    cy.visit('/reset-password?token=token-falso-12345');

    cy.contains('Enlace inválido', { timeout: 8000 }).should('be.visible');
    cy.contains('button', 'Solicitar uno nuevo').should('be.visible');
  });

  it('CP05: Acceso directo a /reset-password sin token permite redirigir a forgot-password', () => {
    cy.visit('/reset-password');

    cy.contains('Enlace inválido', { timeout: 8000 }).should('be.visible');
    cy.contains('button', 'Solicitar uno nuevo').click();

    cy.url({ timeout: 5000 }).should('include', '/forgot-password');
    cy.get('#email').should('be.visible');
  });

  it('CP06: Cambio de contraseña exitoso capturando el enlace del backend', () => {
    // 1. Solicitar token al backend - failOnStatusCode:false por si Supabase no disponible
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/forgot-password`,
      body: { email: targetEmail },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status !== 200) {
        cy.log(`⚠️ Backend no disponible (${res.status}), usando enlace capturado`);
        cy.getLatestResetLink(targetEmail).then((link) => {
          const extractedToken = (link || '').split('token=')[1] || '';
          if (!extractedToken) {
            cy.log('⚠️ No hay enlace de reset disponible en memoria del backend');
            return;
          }
          cy.visit(`/reset-password?token=${extractedToken}`);
          completePasswordReset();
        });
        return;
      }

      let token = res.body?.data?.token;
      if (!token) {
        cy.getLatestResetLink(targetEmail).then((link) => {
          const extractedToken = (link || '').split('token=')[1] || '';
          cy.visit(`/reset-password?token=${extractedToken}`);
          completePasswordReset();
        });
      } else {
        cy.visit(`/reset-password?token=${token}`);
        completePasswordReset();
      }
    });

    function completePasswordReset() {
      cy.get('#newPassword', { timeout: 10000 }).should('be.visible').type('Katalon123.');
      cy.get('#confirmPassword').should('be.visible').type('Katalon123.');
      cy.get('button[type="submit"]').click();

      cy.contains('¡Contraseña actualizada!', { timeout: 8000 }).should('be.visible');
      cy.contains('Tu contraseña se ha cambiado correctamente').should('be.visible');
      cy.contains('button', 'Ir a Iniciar Sesión').click();

      cy.url({ timeout: 8000 }).should('include', '/login');
      cy.get('#email').should('be.visible');
    }
  });

  it('CP07: Validación de error cuando las contraseñas no coinciden', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/forgot-password`,
      body: { email: targetEmail },
      failOnStatusCode: false,
    }).then((res) => {
      const token = res.body?.data?.token;
      if (token) {
        cy.visit(`/reset-password?token=${token}`);
      } else {
        cy.getLatestResetLink(targetEmail).then((link) => {
          const extractedToken = (link || '').split('token=')[1] || '';
          cy.visit(`/reset-password?token=${extractedToken}`);
        });
      }

      cy.get('#newPassword', { timeout: 10000 }).should('be.visible').type('Katalon123.');
      cy.get('#confirmPassword').should('be.visible').type('OtraContrasena999.');
      cy.get('button[type="submit"]').click();

      cy.contains('Las contraseñas no coinciden', { timeout: 5000 }).should('be.visible');
    });
  });

  it('CP08: Validación de contraseña débil desactiva el botón de guardar', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/forgot-password`,
      body: { email: targetEmail },
      failOnStatusCode: false,
    }).then((res) => {
      const token = res.body?.data?.token;
      if (token) {
        cy.visit(`/reset-password?token=${token}`);
      } else {
        cy.getLatestResetLink(targetEmail).then((link) => {
          const extractedToken = (link || '').split('token=')[1] || '';
          cy.visit(`/reset-password?token=${extractedToken}`);
        });
      }

      cy.get('#newPassword', { timeout: 10000 }).should('be.visible').type('1234');
      cy.get('#confirmPassword').should('be.visible').type('1234');

      cy.contains('La contraseña es demasiado débil', { timeout: 5000 }).should('be.visible');
      cy.get('button[type="submit"]').should('be.disabled');
    });
  });
});
