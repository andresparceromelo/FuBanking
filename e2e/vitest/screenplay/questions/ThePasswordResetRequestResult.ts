import { Actor } from '../actors/Actor';
import { Question } from './Question';
import {
  RequestPasswordResetViaApi,
  PasswordResetRequestResult,
} from '../tasks/RequestPasswordResetViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado de la última solicitud de restablecimiento de contraseña?
 *
 * Consulta el resultado almacenado por la tarea `RequestPasswordResetViaApi`
 * para permitir aserciones fluidas sobre el estado HTTP y los datos de respuesta
 * sin acoplar los tests a la implementación HTTP.
 *
 * @example
 * ```ts
 * // AAA — Assert
 * const result = await actor.asks(ThePasswordResetRequestResult.fromLastAttempt());
 * expect(result.status).toBe(200);
 * ```
 */
export class ThePasswordResetRequestResult implements Question<PasswordResetRequestResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado de la última solicitud de reset. */
  static fromLastAttempt(): ThePasswordResetRequestResult {
    return new ThePasswordResetRequestResult();
  }

  async answeredBy(_actor: Actor): Promise<PasswordResetRequestResult> {
    const result = RequestPasswordResetViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de solicitud de restablecimiento disponible. ' +
          'Asegúrate de ejecutar RequestPasswordResetViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
