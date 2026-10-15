import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { VerifyResetTokenViaApi, TokenVerificationResult } from '../tasks/VerifyResetTokenViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado de la última verificación de token de reset?
 *
 * Consulta el resultado almacenado por la tarea `VerifyResetTokenViaApi`
 * para permitir aserciones fluidas sobre el estado HTTP y los datos de respuesta
 * sin acoplar los tests a la implementación HTTP.
 *
 * @example
 * ```ts
 * // AAA — Assert
 * const result = await actor.asks(TheTokenVerificationResult.fromLastAttempt());
 * expect(result.status).toBe(200);
 * ```
 */
export class TheTokenVerificationResult implements Question<TokenVerificationResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado de la última verificación de token. */
  static fromLastAttempt(): TheTokenVerificationResult {
    return new TheTokenVerificationResult();
  }

  async answeredBy(_actor: Actor): Promise<TokenVerificationResult> {
    const result = VerifyResetTokenViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de verificación de token disponible. ' +
          'Asegúrate de ejecutar VerifyResetTokenViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
