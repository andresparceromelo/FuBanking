import { Task } from '@serenity-js/core';
import { PatchRequest, Send } from '@serenity-js/rest';

/**
 * UpdateProfileViaApi: actualiza los datos del perfil del actor autenticado.
 *
 * Todas las interacciones usan `Send.a(PatchRequest)` para que Serenity/JS
 * registre la petición HTTP completa (cabeceras, payload, código de respuesta)
 * en el reporte HTML.
 *
 * Para el escenario sin autenticación, se usa un actor distinto ('Anónimo')
 * que nace sin cabecera Authorization: no es necesario trucrar cabeceras
 * manualmente.
 */
export const UpdateProfileViaApi = {
  /**
   * Actualiza el nombre y apellido del actor autenticado.
   */
  withName: (firstName: string, lastName: string) =>
    Task.where(`#actor actualiza su perfil con nombre "${ firstName } ${ lastName }"`,
      Send.a(PatchRequest.to('profile').with({ firstName, lastName })),
    ),

  /**
   * Intenta actualizar el perfil con campos vacíos para validar reglas de negocio.
   */
  withEmptyName: (firstName: string, lastName: string) =>
    Task.where(`#actor intenta actualizar su perfil con campos "${ firstName }" "${ lastName }"`,
      Send.a(PatchRequest.to('profile').with({ firstName, lastName })),
    ),

  /**
   * Intenta actualizar el perfil sin token de sesión.
   * Usar este método desde un actor que no ha iniciado sesión ('Anónimo')
   * para asegurar que no haya cabecera Authorization.
   */
  withoutAuth: () =>
    Task.where('#actor intenta actualizar el perfil sin autenticación',
      Send.a(PatchRequest.to('profile').with({ firstName: 'Sin', lastName: 'Auth' })),
    ),
};
