import { When } from '@cucumber/cucumber';
import { Actor, actorCalled } from '@serenity-js/core';
import { WithdrawMoney } from '../../test/tasks/api/WithdrawMoney';

/**
 * Steps para la funcionalidad de Retiro de Dinero.
 *
 * Los steps Given (preparación del actor) y Then (verificaciones de estado HTTP,
 * código de error y saldo) se reutilizan desde cliente.steps.ts.
 */

When('{pronoun} retira por API {int} de su cuenta', async (actor: Actor, amount: number) => {
  await actor.attemptsTo(
    WithdrawMoney.fromOwnAccount(amount),
  );
});

When('alguien intenta retirar por API {int} sin autenticación', async (amount: number) => {
  await actorCalled('Anónimo').attemptsTo(
    WithdrawMoney.fromAccount('00000000-0000-0000-0000-000000000000', amount),
  );
});

When('{pronoun} intenta retirar por API {int} de una cuenta inexistente', async (actor: Actor, amount: number) => {
  await actor.attemptsTo(
    WithdrawMoney.fromAccount('00000000-0000-0000-0000-000000000000', amount),
  );
});
