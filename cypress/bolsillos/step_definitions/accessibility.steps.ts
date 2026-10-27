import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import type { Result } from 'axe-core';

import { Actor } from '../support/cast';
import { PocketsScreen } from '../support/screens';

When('{pronoun} abre la confirmación para eliminar el bolsillo {string}', (_actor: Actor, name: string) => {
  PocketsScreen.card(name).find('[data-testid="delete-pocket-button"]').click();
  cy.get('[data-testid="confirm-delete-pocket-button"]').should('be.visible');
});

When('{pronoun} abre el formulario para abonar a su cuenta', () => {
  cy.get('[data-testid="account-card"]').first().find('[data-testid="deposit-button"]').click();
  cy.get('#dw-amount').should('be.visible');
});

/** Deja en el log de la terminal cada violación (regla, impacto y nodos) como evidencia. */
const logViolations = (violations: Result[]) => {
  cy.task('a11yViolations', violations.map(v => ({
    regla: v.id,
    impacto: v.impact,
    descripcion: v.help,
    nodos: v.nodes.map(node => `${node.target.join(' ')} → ${(node.any[0]?.message ?? node.failureSummary ?? '').slice(0, 160)}`),
  })));
};

const WCAG_AA = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  includedImpacts: ['critical', 'serious'],
};

Then('la pantalla no tiene violaciones de accesibilidad graves', () => {
  cy.injectAxe();
  cy.checkA11y(undefined, WCAG_AA, logViolations);
});

Then('el diálogo no tiene violaciones de accesibilidad graves', () => {
  cy.get('[role="dialog"][aria-modal="true"]').should('be.visible');
  cy.injectAxe();
  cy.checkA11y('[role="dialog"]', WCAG_AA, logViolations);
});

/** Lo que el velo deja detrás (botones de la tarjeta, etc.), sin medir el contraste atenuado a propósito. */
Then('la pantalla no tiene violaciones de accesibilidad graves fuera de los diálogos', () => {
  cy.injectAxe();
  cy.checkA11y({ exclude: [['[role="dialog"]']] }, {
    ...WCAG_AA,
    rules: { 'color-contrast': { enabled: false } },
  }, logViolations);
});
