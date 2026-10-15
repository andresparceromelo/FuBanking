import { Interaction, Task } from '@serenity-js/core';
import { CallAnApi, PostRequest, Send } from '@serenity-js/rest';

import { ApiSuccess, SessionDto } from '../../support/apiTypes';
import { clientNotes } from '../../support/ClientNotes';
import { Credentials } from '../../support/Credentials';
import { uniqueClient } from '../../support/testData';

/**
 * RegisterViaApi: registra un nuevo cliente con datos aleatorios únicos.
 *
 * `withValidData` usa `CallAnApi.as(actor).request()` intencionalmente para que
 * la contraseña y el token no aparezcan en el reporte de Serenity.
 * Los otros métodos usan `Send.a(...)` para registrar la interacción completa.
 */
export const RegisterViaApi = {
  /**
   * Registra un actor con datos válidos generados dinámicamente.
   * Extrae y guarda el token para peticiones autenticadas posteriores.
   * Usa la API interna para evitar exponer la contraseña en el reporte.
   */
  withValidData: () =>
    Task.where('#actor se registra con datos válidos',
      Interaction.where('#actor envía POST auth/register con datos válidos', async actor => {
        const api = CallAnApi.as(actor);
        const data = uniqueClient(actor.name);
        const response = await api.request({ method: 'POST', url: 'auth/register', data });
        if (response.status === 201) {
          const { token } = (response.data as ApiSuccess<SessionDto>).data;
          Credentials.keep(actor, { password: data.password, token });
          api.modifyConfig(config => {
            config.headers.common.Authorization = `Bearer ${ token }`;
          });
        }
        clientNotes().set('email', data.email);
      }),
    ),

  /**
   * Intenta registrarse con un email específico (ej. email duplicado).
   * El resto de los datos son generados dinámicamente.
   * Registra la petición completa en el reporte de Serenity.
   */
  withEmail: (email: string) =>
    Task.where(`#actor intenta registrarse con el email ${ email }`,
      Send.a(PostRequest.to('auth/register').with({
        ...uniqueClient('Intruso'),
        email,
      })),
    ),

  /**
   * Intenta registrarse con una contraseña débil específica.
   * El email y otros datos son generados dinámicamente.
   * Registra la petición completa en el reporte de Serenity.
   */
  withPassword: (password: string) =>
    Task.where(`#actor intenta registrarse con contraseña débil`,
      Send.a(PostRequest.to('auth/register').with({
        ...uniqueClient('Débil'),
        password,
        confirmPassword: password,
      })),
    ),

  /**
   * Intenta registrarse con un email con formato inválido.
   * Registra la petición completa en el reporte de Serenity.
   */
  withInvalidEmail: (email: string) =>
    Task.where(`#actor intenta registrarse con email inválido ${ email }`,
      Send.a(PostRequest.to('auth/register').with({
        ...uniqueClient('Inválido'),
        email,
      })),
    ),
};
