import { When } from '@cucumber/cucumber';
import { Actor, actorCalled } from '@serenity-js/core';
import { PasswordResetViaApi } from '../../test/tasks/api/PasswordResetViaApi';
import { LoginViaApi } from '../../test/tasks/api/LoginViaApi';

/**
 * Steps para el módulo de Restablecimiento de Contraseña.
 *
 * Los steps Given (preparación del actor) y Then (estado HTTP, saldo, etc.)
 * se reutilizan desde cliente.steps.ts.
 */

When('{pronoun} solicita restablecer la contraseña con su email', async (actor: Actor) => {
  await actor.attemptsTo(PasswordResetViaApi.requestWithOwnEmail());
});

When('alguien solicita restablecer la contraseña del email {string}', async (email: string) => {
  await actorCalled('Visitante').attemptsTo(
    PasswordResetViaApi.requestWithEmail(email),
  );
});

When('alguien verifica el token de restablecimiento {string}', async (token: string) => {
  await actorCalled('Visitante').attemptsTo(
    PasswordResetViaApi.verifyToken(token),
  );
});

When('alguien intenta restablecer la contraseña con token {string} y nueva contraseña {string}',
  async (token: string, newPassword: string) => {
    await actorCalled('Visitante').attemptsTo(
      PasswordResetViaApi.resetWithToken(token, newPassword),
    );
  });

When('alguien intenta restablecer la contraseña con token {string}, nueva contraseña {string} y confirmación {string}',
  async (token: string, newPassword: string, confirmPassword: string) => {
    await actorCalled('Visitante').attemptsTo(
      PasswordResetViaApi.resetWithToken(token, newPassword, confirmPassword),
    );
  });

When('{pronoun} restablece su contraseña con token {string} y nueva contraseña {string}',
  async (actor: Actor, token: string, newPassword: string) => {
    await actor.attemptsTo(
      PasswordResetViaApi.resetWithToken(token, newPassword),
    );
  });

When('{pronoun} intenta iniciar sesión con su nueva contraseña {string}', async (actor: Actor, password: string) => {
  await actor.attemptsTo(LoginViaApi.withPassword(password));
});
