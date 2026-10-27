import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

import { send } from '../support/api';
import { Actor, Cast } from '../support/cast';
import { AccountsScreen, amountIn } from '../support/screens';

// ─── Por API: POST /accounts/:id/deposit ─────────────────────────────────────

When('{pronoun} deposita por API {int} en su cuenta', (actor: Actor, amount: number) => {
  cy.then(() => send(actor, 'POST', `accounts/${actor.accountId}/deposit`, { amount }));
});

When('{pronoun} deposita por API {int} en su cuenta con la descripción {string}', (actor: Actor, amount: number, description: string) => {
  cy.then(() => send(actor, 'POST', `accounts/${actor.accountId}/deposit`, { amount, description }));
});

/** El valor viaja tal cual en el JSON: `true`, `null`, `"abc"`, `[1000]`… (sin type juggling en el back). */
When('{pronoun} deposita por API el valor JSON {} en su cuenta', (actor: Actor, rawJson: string) => {
  cy.then(() => send(actor, 'POST', `accounts/${actor.accountId}/deposit`, { amount: JSON.parse(rawJson) }));
});

When('{actor} deposita por API {int} en la cuenta de {word}', (actor: Actor, amount: number, owner: string) => {
  cy.then(() => send(actor, 'POST', `accounts/${Cast.noteOf(owner, 'accountId')}/deposit`, { amount }));
});

// ─── En pantalla ─────────────────────────────────────────────────────────────

When('{pronoun} abona {int} a su cuenta', (_actor: Actor, amount: number) => {
  AccountsScreen.deposit(amount);
});

Then('{pronoun} ve el saldo de su cuenta en {int}', (_actor: Actor, balance: number) => {
  AccountsScreen.balance().should($balance => {
    expect(amountIn($balance.text()), 'saldo de la cuenta en pantalla').to.eq(balance);
  });
});

Then('{pronoun} ve el error del formulario {string}', (_actor: Actor, message: string) => {
  AccountsScreen.formError().should('have.text', message);
});
