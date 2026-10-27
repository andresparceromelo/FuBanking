import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals } from '@serenity-js/assertions';
import { Actor } from '@serenity-js/core';

import { ScreenQuestions } from '../../test/questions/ScreenQuestions';
import { noteOf } from '../../test/support/ClientNotes';
import { DepositMoney } from '../../test/tasks/api/DepositMoney';
import { AccountsScreen } from '../../test/tasks/web/AccountsScreen';

// ─── Por API ─────────────────────────────────────────────────────────────────

When('{pronoun} deposita por API {int} en su cuenta', async (actor: Actor, amount: number) => {
  await actor.attemptsTo(DepositMoney.intoOwnAccount(amount));
});

When('{pronoun} deposita por API {int} en su cuenta con la descripción {string}', async (actor: Actor, amount: number, description: string) => {
  await actor.attemptsTo(DepositMoney.intoOwnAccount(amount, description));
});

/** El valor viaja tal cual en el JSON: `true`, `null`, `"abc"`, `[1000]`… */
When('{pronoun} deposita por API el valor JSON {} en su cuenta', async (actor: Actor, rawJson: string) => {
  await actor.attemptsTo(DepositMoney.intoOwnAccount(JSON.parse(rawJson)));
});

When('{actor} deposita por API {int} en la cuenta de {word}', async (actor: Actor, amount: number, owner: string) => {
  const accountId = await noteOf(owner, 'accountId', actor.name);
  await actor.attemptsTo(DepositMoney.intoAccount(accountId, amount));
});

// ─── En pantalla ─────────────────────────────────────────────────────────────

When('{pronoun} abona {int} a su cuenta', async (actor: Actor, amount: number) => {
  await actor.attemptsTo(AccountsScreen.deposit(amount));
});

Then('{pronoun} ve el saldo de su cuenta en {int}', async (actor: Actor, balance: number) => {
  await actor.attemptsTo(
    Ensure.eventually(ScreenQuestions.accountBalance(), equals(balance)),
  );
});

Then('{pronoun} ve el error del formulario {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(
    Ensure.eventually(ScreenQuestions.depositFormError(), equals(message)),
  );
});
