import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { LoginViaApi, LoginResult } from '../tasks/LoginViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado del último intento de login?
 *
 * Consulta el resultado almacenado por la tarea `LoginViaApi`
 * para permitir aserciones sobre el estado HTTP y los datos de respuesta.
 *
 * @example
 * ```ts
 * const result = await actor.asks(TheLoginResult.fromLastAttempt());
 * expect(result.status).toBe(200);
 * ```
 */
export class TheLoginResult implements Question<LoginResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado del último login. */
  static fromLastAttempt(): TheLoginResult {
    return new TheLoginResult();
  }

  async answeredBy(_actor: Actor): Promise<LoginResult> {
    const result = LoginViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de login disponible. ' +
          'Asegúrate de ejecutar LoginViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
