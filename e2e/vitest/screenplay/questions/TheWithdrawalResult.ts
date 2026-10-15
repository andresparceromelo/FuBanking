import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { WithdrawMoneyViaApi, WithdrawalResult } from '../tasks/WithdrawMoneyViaApi';

/**
 * Pregunta: ¿Cuál fue el resultado del último intento de retiro?
 *
 * Consulta el resultado almacenado por la tarea `WithdrawMoneyViaApi`
 * para permitir aserciones fluidas sobre el estado HTTP y los datos de respuesta
 * sin acoplar los tests a la implementación HTTP.
 *
 * @example
 * ```ts
 * // AAA — Assert
 * const result = await actor.asks(TheWithdrawalResult.fromLastAttempt());
 * expect(result.status).toBe(200);
 * ```
 */
export class TheWithdrawalResult implements Question<WithdrawalResult> {
  private constructor() {}

  /** Crea la pregunta sobre el resultado del último retiro. */
  static fromLastAttempt(): TheWithdrawalResult {
    return new TheWithdrawalResult();
  }

  async answeredBy(_actor: Actor): Promise<WithdrawalResult> {
    const result = WithdrawMoneyViaApi.lastResult;

    if (!result) {
      throw new Error(
        'No hay resultado de retiro de dinero disponible. ' +
          'Asegúrate de ejecutar WithdrawMoneyViaApi antes de preguntar por el resultado.',
      );
    }

    return result;
  }
}
