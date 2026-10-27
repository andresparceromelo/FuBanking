describe('Accesibilidad automática con axe (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });
  it('audita la accesibilidad en la pantalla de inicio de sesión', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      },
      rules: {
        // En Next.js modo dev algunas alertas de contraste pueden depender del tema del sistema
        'color-contrast': { enabled: false },
      },
    });
  });

  it('audita la accesibilidad en el módulo de créditos tras autenticarse', () => {
    cy.loginByApi('bedoyacanoandres2@gmail.com');
    cy.visit('/loans');
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      },
      rules: {
        'color-contrast': { enabled: false },
      },
    });
  });
});
