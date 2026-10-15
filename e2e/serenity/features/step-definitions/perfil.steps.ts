import { When } from '@cucumber/cucumber';
import { Actor, actorCalled } from '@serenity-js/core';
import { UpdateProfileViaApi } from '../../test/tasks/api/UpdateProfileViaApi';

/**
 * Steps para el módulo de Edición de Perfil.
 *
 * Los steps Given (preparación del actor) y Then (estado HTTP) se reutilizan.
 */

When('{pronoun} actualiza su perfil con nombre {string} y apellido {string}',
  async (actor: Actor, firstName: string, lastName: string) => {
    await actor.attemptsTo(UpdateProfileViaApi.withName(firstName, lastName));
  });

When('alguien intenta actualizar un perfil sin token de sesión', async () => {
  await actorCalled('Anónimo').attemptsTo(
    UpdateProfileViaApi.withoutAuth(),
  );
});
