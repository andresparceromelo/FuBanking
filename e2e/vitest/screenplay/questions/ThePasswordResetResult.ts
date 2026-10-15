import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { ResetPasswordViaApi, PasswordResetResult } from '../tasks/ResetPasswordViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado del último intento de restablecimiento de contraseña?
 *
 * Consulta el resultado almacenado por la tarea `ResetPasswordViaApi`
 * para permitir aserciones fluidas sobre el estado HTTP y los datos de respuesta
 * sin acoplar los tests a la implementación HTTP.
 *
 * @example
 * ```ts
 * // AAA — Assert
 * const result = await actor.asks(ThePasswordResetResult.fromLastAttempt());
 * expect(result.status).toBe(200);
 * ```
 */
export class ThePasswordResetResult implements Question<PasswordResetResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado del último intento de restablecimiento. */
  static fromLastAttempt(): ThePasswordResetResult {
    return new ThePasswordResetResult();
  }

  async answeredBy(_actor: Actor): Promise<PasswordResetResult> {
    const result = ResetPasswordViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de restablecimiento de contraseña disponible. ' +
          'Asegúrate de ejecutar ResetPasswordViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
