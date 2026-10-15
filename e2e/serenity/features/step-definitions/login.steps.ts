import { Then, When } from '@cucumber/cucumber';
import { isPresent, Ensure } from '@serenity-js/assertions';
import { Actor, actorCalled, actorInTheSpotlight } from '@serenity-js/core';
import { ApiQuestions } from '../../test/questions/ApiQuestions';
import { LoginViaApi } from '../../test/tasks/api/LoginViaApi';

/**
 * Steps para el módulo de Login.
 *
 * Los steps Given (preparación del actor con cuenta) se reutilizan
 * desde cliente.steps.ts. Los steps Then de estado HTTP también.
 */

When('{pronoun} inicia sesión con sus credenciales correctas', async (actor: Actor) => {
  await actor.attemptsTo(LoginViaApi.withOwnCredentials());
});

When('{pronoun} intenta iniciar sesión con la contraseña {string}', async (actor: Actor, password: string) => {
  await actor.attemptsTo(LoginViaApi.withPassword(password));
});

When('alguien intenta iniciar sesión con el email {string} y contraseña {string}',
  async (email: string, password: string) => {
    await actorCalled('Visitante').attemptsTo(
      LoginViaApi.withCredentials(email, password),
    );
  });

Then('la respuesta contiene un token de sesión', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(ApiQuestions.sessionToken(), isPresent()),
  );
});
