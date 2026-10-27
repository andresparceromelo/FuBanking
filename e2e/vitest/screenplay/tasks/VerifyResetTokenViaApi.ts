import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';

/** Respuesta exitosa del endpoint GET /auth/verify-reset-token. */
export interface VerifyTokenSuccessResponse {
  message: string;
  data: null;
}

/** Respuesta de error del endpoint GET /auth/verify-reset-token. */
export interface VerifyTokenErrorResponse {
  error: { code: string; message: string };
}

/** Resultado almacenado tras verificar un token de restablecimiento vía API. */
export interface TokenVerificationResult {
  status: number;
  data: VerifyTokenSuccessResponse | VerifyTokenErrorResponse | Record<string, unknown>;
}

/**
 * Tarea: Verificar la validez de un token de restablecimiento de contraseña.
 *
 * El actor usa su habilidad `CallApi` para enviar un GET a
 * `/auth/verify-reset-token?token=<token>`.
 * El resultado se almacena estáticamente para ser consultado
 * por preguntas (Questions) en las aserciones.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   VerifyResetTokenViaApi.forToken('jwt-reset-token'),
 * );
 * ```
 */
export class VerifyResetTokenViaApi implements Task {
  /** Almacena el último resultado de la verificación para consultas posteriores. */
  static lastResult: TokenVerificationResult | null = null;

  private constructor(private readonly token: string) {}

  /** Crea la tarea con el token a verificar. */
  static forToken(token: string): VerifyResetTokenViaApi {
    return new VerifyResetTokenViaApi(token);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const encodedToken = encodeURIComponent(this.token);
    const response = await api.get<VerifyTokenSuccessResponse | VerifyTokenErrorResponse>(
      `/auth/verify-reset-token?token=${encodedToken}`,
    );

    VerifyResetTokenViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };
  }
}
