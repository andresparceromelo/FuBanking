import { Interaction, Task } from '@serenity-js/core';
import { CallAnApi, GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

import { ApiSuccess, SessionDto } from '../../support/apiTypes';
import { clientNotes } from '../../support/ClientNotes';
import { Credentials } from '../../support/Credentials';

/**
 * LoginViaApi: autentica al actor con sus propias credenciales guardadas en Credentials.
 *
 * `withOwnCredentials` usa `CallAnApi.as(actor).request()` intencionalmente para que
 * el token JWT extraído de la respuesta quede guardado sin imprimirse en el reporte.
 * Los otros métodos usan `Send.a(...)` para que Serenity/JS registre
 * la interacción HTTP completa (cabeceras, payload, código de respuesta) en el reporte.
 */
export const LoginViaApi = {
  /**
   * Inicia sesión con las credenciales que el actor guardó al registrarse.
   * Extrae el token y lo inyecta en la cabecera `Authorization` para las
   * siguientes peticiones. Usa la API interna para que las credenciales no
   * aparezcan en el reporte de Serenity.
   */
  withOwnCredentials: () =>
    Task.where('#actor inicia sesión con sus credenciales correctas',
      Interaction.where('#actor envía sus credenciales a POST auth/login', async actor => {
        const api = CallAnApi.as(actor);
        const email = await actor.answer(clientNotes().get('email'));
        const password = await actor.answer(Credentials.password());
        const response = await api.request({ method: 'POST', url: 'auth/login', data: { email, password } });
        if (response.status === 200) {
          const { token } = (response.data as ApiSuccess<SessionDto>).data;
          api.modifyConfig(config => {
            config.headers.common.Authorization = `Bearer ${ token }`;
          });
        }
      }),
    ),

  /**
   * Intenta iniciar sesión con una contraseña arbitraria (ej. caso de error).
   * Se espera que el actor ya tenga email anotado en `clientNotes`.
   */
  withPassword: (password: string) =>
    Task.where(`#actor intenta iniciar sesión con contraseña incorrecta`,
      Interaction.where('#actor envía credenciales a POST auth/login', async actor => {
        const api = CallAnApi.as(actor);
        const email = await actor.answer(clientNotes().get('email'));
        await api.request({ method: 'POST', url: 'auth/login', data: { email, password } });
      }),
    ),

  /**
   * Intenta iniciar sesión con credenciales arbitrarias.
   * Registra la petición completa en el reporte de Serenity.
   */
  withCredentials: (email: string, password: string) =>
    Task.where(`#actor intenta iniciar sesión como ${ email }`,
      Send.a(PostRequest.to('auth/login').with({ email, password })),
    ),

  /**
   * Consulta el perfil del actor autenticado.
   * Registrado en el reporte de Serenity como interacción HTTP completa.
   */
  getProfile: () =>
    Task.where('#actor consulta su perfil',
      Send.a(GetRequest.to('profile')),
    ),

  /**
   * Intenta consultar el perfil sin cabecera Authorization.
   * El actor 'Anónimo' nace sin token, por lo que solo hay que hacer la petición.
   */
  getProfileWithoutAuth: () =>
    Task.where('#actor consulta el perfil sin autenticación',
      Send.a(GetRequest.to('profile')),
    ),
};
