import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { UpdateProfileViaApi, ProfileUpdateResult } from '../tasks/UpdateProfileViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado del último intento de actualizar perfil?
 *
 * Consulta el resultado almacenado por la tarea `UpdateProfileViaApi`
 * para permitir aserciones fluidas.
 *
 * @example
 * ```ts
 * // AAA — Assert
 * const result = await actor.asks(TheProfileUpdateResult.fromLastAttempt());
 * expect(result.status).toBe(200);
 * ```
 */
export class TheProfileUpdateResult implements Question<ProfileUpdateResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado de la última actualización. */
  static fromLastAttempt(): TheProfileUpdateResult {
    return new TheProfileUpdateResult();
  }

  async answeredBy(_actor: Actor): Promise<ProfileUpdateResult> {
    const result = UpdateProfileViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de actualización de perfil disponible. ' +
          'Asegúrate de ejecutar UpdateProfileViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
