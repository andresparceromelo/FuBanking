import { q, Question, Task } from '@serenity-js/core';
import { GetRequest, PostRequest, Send } from '@serenity-js/rest';

import { clientNotes } from '../../support/ClientNotes';

/**
 * PasswordResetViaApi: flujo completo de restablecimiento de contraseña.
 *
 * Todas las interacciones usan `Send.a(...)` para que Serenity/JS registre
 * la petición HTTP completa (cabeceras, payload, código de respuesta) en el
 * reporte HTML.
 */
export const PasswordResetViaApi = {
  /**
   * Solicita el restablecimiento con el email del actor que ya inició sesión.
   * El email se lee dinámicamente desde las notas del actor.
   */
  requestWithOwnEmail: () =>
    Task.where('#actor solicita restablecer la contraseña con su email',
      Send.a(PostRequest.to('auth/forgot-password').with(
        Question.fromObject({ email: clientNotes().get('email') }),
      )),
    ),

  /**
   * Solicita el restablecimiento con un email arbitrario (puede no existir).
   */
  requestWithEmail: (email: string) =>
    Task.where(`#actor solicita restablecer la contraseña del email ${ email }`,
      Send.a(PostRequest.to('auth/forgot-password').with({ email })),
    ),

  /**
   * Verifica si un token de restablecimiento es válido.
   * GET auth/verify-reset-token?token=<token>
   */
  verifyToken: (token: string) =>
    Task.where(`#actor verifica el token de restablecimiento "${ token }"`,
      Send.a(GetRequest.to(q`auth/verify-reset-token?token=${ token }`)),
    ),

  /**
   * Intenta establecer una nueva contraseña usando un token de restablecimiento.
   * POST auth/reset-password { token, newPassword, confirmPassword }
   */
  resetWithToken: (token: string, newPassword: string, confirmPassword?: string) =>
    Task.where(`#actor restablece la contraseña con token "${ token }"`,
      Send.a(PostRequest.to('auth/reset-password').with({
        token,
        newPassword,
        confirmPassword: confirmPassword ?? newPassword,
      })),
    ),
};
