import { endsWith } from '@serenity-js/assertions';
import { Duration, Task, Wait } from '@serenity-js/core';
import { Click, Enter, Navigate, Page } from '@serenity-js/web';

import { clientNotes } from '../../support/ClientNotes';
import { Credentials } from '../../support/Credentials';
import { LoginForm } from '../../ui/LoginForm';

/**
 * Inicia sesión por el formulario con las credenciales que el actor anotó al
 * registrarse. No marca "Recordarme" (lo que hace un usuario por defecto): así
 * cada escenario web vigila el defecto E2E-01 (token en sessionStorage que la
 * API no enviaba), corregido en `api.client.ts`.
 */
export const SignIn = {
  withOwnCredentials: () =>
    Task.where('#actor inicia sesión en FuBanking',
      Navigate.to('/login'),
      Enter.theValue(clientNotes().get('email')).into(LoginForm.email()),
      Enter.theValue(Credentials.password()).into(LoginForm.password()),
      Click.on(LoginForm.submit()),
      Wait.upTo(Duration.ofSeconds(30)).until(Page.current().url().pathname, endsWith('/profile')),
    ),
};
