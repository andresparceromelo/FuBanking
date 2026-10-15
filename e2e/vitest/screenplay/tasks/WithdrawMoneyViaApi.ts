import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';

/** Respuesta exitosa del endpoint POST /accounts/:id/withdraw. */
export interface WithdrawalSuccessResponse {
  message: string;
  data: Record<string, unknown>; // Detalle de la cuenta actualizada
}

/** Respuesta de error del endpoint POST /accounts/:id/withdraw. */
export interface WithdrawalErrorResponse {
  error: { code: string; message: string };
}

/** Payload enviado al endpoint de retiro. */
export interface WithdrawalPayload {
  accountId: string;
  amount: number;
  description?: string;
}

/** Resultado almacenado tras intentar realizar un retiro vía API. */
export interface WithdrawalResult {
  status: number;
  data: WithdrawalSuccessResponse | WithdrawalErrorResponse | Record<string, unknown>;
}

/**
 * Tarea: Retirar dinero de una cuenta bancaria vía la API del backend.
 *
 * El actor usa su habilidad `CallApi` para enviar un POST a
 * `/accounts/:id/withdraw` con el monto y descripción.
 * El resultado se almacena estáticamente para ser consultado
 * por preguntas (Questions) en las aserciones.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   WithdrawMoneyViaApi.withData({
 *     accountId: 'cuenta-id',
 *     amount: 50000,
 *     description: 'Retiro en cajero',
 *   }),
 * );
 * ```
 */
export class WithdrawMoneyViaApi implements Task {
  /** Almacena el último resultado de retiro para consultas posteriores. */
  static lastResult: WithdrawalResult | null = null;

  private constructor(private readonly payload: WithdrawalPayload) {}

  /** Crea la tarea con los datos de retiro proporcionados. */
  static withData(payload: WithdrawalPayload): WithdrawMoneyViaApi {
    return new WithdrawMoneyViaApi(payload);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const { accountId, ...bodyData } = this.payload;

    const response = await api.post<WithdrawalSuccessResponse | WithdrawalErrorResponse>(
      `/accounts/${accountId}/withdraw`,
      bodyData as Record<string, unknown>,
    );

    WithdrawMoneyViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };
  }
}
