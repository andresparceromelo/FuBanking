import { When } from '@cucumber/cucumber';
import { Actor, actorCalled } from '@serenity-js/core';
import { RegisterViaApi } from '../../test/tasks/api/RegisterViaApi';
import { clientNotes } from '../../test/support/ClientNotes';

/**
 * Steps para el módulo de Registro.
 *
 * Los steps Then de estado HTTP y token de sesión se reutilizan
 * desde cliente.steps.ts y login.steps.ts.
 */

When('un nuevo usuario se registra con datos válidos', async () => {
  await actorCalled('Nuevo Usuario').attemptsTo(
    RegisterViaApi.withValidData(),
  );
});

When('alguien intenta registrarse con el email de {actor}', async (actor: Actor) => {
  const email = await actor.answer(clientNotes().get('email'));
  await actorCalled('Intruso').attemptsTo(
    RegisterViaApi.withEmail(email),
  );
});

When('un nuevo usuario se registra con la contraseña {string}', async (password: string) => {
  await actorCalled('Nuevo Usuario').attemptsTo(
    RegisterViaApi.withPassword(password),
  );
});

When('un nuevo usuario se registra con el email {string}', async (email: string) => {
  await actorCalled('Nuevo Usuario').attemptsTo(
    RegisterViaApi.withEmail(email),
  );
});
