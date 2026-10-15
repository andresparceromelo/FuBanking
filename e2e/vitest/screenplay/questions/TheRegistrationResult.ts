import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { RegisterViaApi, RegistrationResult } from '../tasks/RegisterViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado del último intento de registro?
 *
 * Consulta el resultado almacenado por la tarea `RegisterViaApi`
 * para permitir aserciones fluidas sobre el estado HTTP y los datos
 * de respuesta sin acoplar los tests a la implementación HTTP.
 *
 * @example
 * ```ts
 * // AAA — Assert
 * const result = await actor.asks(TheRegistrationResult.fromLastAttempt());
 * expect(result.status).toBe(201);
 * ```
 */
export class TheRegistrationResult implements Question<RegistrationResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado del último registro. */
  static fromLastAttempt(): TheRegistrationResult {
    return new TheRegistrationResult();
  }

  async answeredBy(_actor: Actor): Promise<RegistrationResult> {
    const result = RegisterViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de registro disponible. ' +
          'Asegúrate de ejecutar RegisterViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
