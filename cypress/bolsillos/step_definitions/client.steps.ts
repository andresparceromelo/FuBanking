import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

import { accountBalanceOf, becomeClient } from '../support/api';
import { Actor, Cast } from '../support/cast';
import { AccountsScreen, LoginScreen, Notifications, PocketsScreen } from '../support/screens';

// ─── Preparación del cliente ─────────────────────────────────────────────────

Given('{actor} es cliente/clienta con una cuenta de ahorros con saldo de {int}', (actor: Actor, balance: number) => {
  becomeClient(actor, balance);
});

Given('{pronoun} inició sesión en FuBanking', (actor: Actor) => {
  LoginScreen.signIn(actor);
});

Given('{pronoun} está en la pantalla de bolsillos', (actor: Actor) => {
  LoginScreen.signIn(actor);
  PocketsScreen.open();
});

Given('{pronoun} está en la pantalla de cuentas', (actor: Actor) => {
  LoginScreen.signIn(actor);
  AccountsScreen.open();
});

// ─── Verificaciones comunes ──────────────────────────────────────────────────

Then('la respuesta HTTP tiene estado {int}', (status: number) => {
  cy.then(() => {
    expect(Cast.lastResponse().status, 'estado HTTP').to.eq(status);
  });
});

Then('el código de error es {string}', (code: string) => {
  cy.then(() => {
    expect(Cast.lastResponse().body?.error?.code, 'código de error').to.eq(code);
  });
});

/** Verifica el estado real en el backend, también en escenarios web. */
Then('el saldo de su cuenta es {int}', (balance: number) => {
  accountBalanceOf(Cast.inSpotlight()).should('eq', balance);
});

Then('el saldo de la cuenta de {word} es {int}', (owner: string, balance: number) => {
  accountBalanceOf(Cast.called(owner)).should('eq', balance);
});

Then('{pronoun} ve la notificación {string}', (_actor: Actor, title: string) => {
  Notifications.titles().should(titles => {
    expect([...titles].map(t => t.textContent?.trim())).to.include(title);
  });
});
