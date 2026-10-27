import { Given, Then } from '@cucumber/cucumber';
import { containAtLeastOneItemThat, Ensure, equals } from '@serenity-js/assertions';
import { Actor, actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';

import { ApiQuestions } from '../../test/questions/ApiQuestions';
import { ScreenQuestions } from '../../test/questions/ScreenQuestions';
import { BecomeClient } from '../../test/tasks/api/BecomeClient';
import { ConsultAccount } from '../../test/tasks/api/ConsultAccount';
import { AccountsScreen } from '../../test/tasks/web/AccountsScreen';
import { PocketsScreen } from '../../test/tasks/web/PocketsScreen';
import { SignIn } from '../../test/tasks/web/SignIn';

// ─── Preparación del cliente ─────────────────────────────────────────────────

Given('{actor} es cliente/clienta con una cuenta de ahorros con saldo de {int}', async (actor: Actor, balance: number) => {
  await actor.attemptsTo(BecomeClient.withSavingsBalance(actor.name, balance));
});

Given('{pronoun} inició sesión en FuBanking', async (actor: Actor) => {
  await actor.attemptsTo(SignIn.withOwnCredentials());
});

Given('{pronoun} está en la pantalla de bolsillos', async (actor: Actor) => {
  await actor.attemptsTo(SignIn.withOwnCredentials(), PocketsScreen.open());
});

Given('{pronoun} está en la pantalla de cuentas', async (actor: Actor) => {
  await actor.attemptsTo(SignIn.withOwnCredentials(), AccountsScreen.open());
});

// ─── Verificaciones comunes ──────────────────────────────────────────────────

Then('la respuesta HTTP tiene estado {int}', async (status: number) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(LastResponse.status(), equals(status)),
  );
});

Then('el código de error es {string}', async (code: string) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(ApiQuestions.errorCode(), equals(code)),
  );
});

/** Verifica el estado real en el backend, también en escenarios web. */
Then('el saldo de su cuenta es {int}', async (balance: number) => {
  await actorInTheSpotlight().attemptsTo(
    ConsultAccount.own(),
    Ensure.that(ApiQuestions.accountBalance(), equals(balance)),
  );
});

Then('el saldo de la cuenta de {word} es {int}', async (owner: string, balance: number) => {
  await actorCalled(owner).attemptsTo(
    ConsultAccount.own(),
    Ensure.that(ApiQuestions.accountBalance(), equals(balance)),
  );
});

Then('{pronoun} ve la notificación {string}', async (actor: Actor, title: string) => {
  await actor.attemptsTo(
    Ensure.eventually(ScreenQuestions.notifications(), containAtLeastOneItemThat(equals(title))),
  );
});
