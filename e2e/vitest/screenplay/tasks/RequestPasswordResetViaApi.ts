import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';

/** Respuesta exitosa del endpoint /auth/forgot-password. */
export interface ForgotPasswordSuccessResponse {
  message: string;
  data: null;
}

/** Respuesta de error del endpoint /auth/forgot-password. */
export interface ForgotPasswordErrorResponse {
  error: { code: string; message: string };
}

/** Resultado almacenado tras solicitar el restablecimiento de contraseña vía API. */
export interface PasswordResetRequestResult {
  status: number;
  data: ForgotPasswordSuccessResponse | ForgotPasswordErrorResponse | Record<string, unknown>;
}

/**
 * Tarea: Solicitar el restablecimiento de contraseña vía la API del backend.
 *
 * El actor usa su habilidad `CallApi` para enviar un POST a
 * `/auth/forgot-password` con el email del usuario.
 * El resultado se almacena estáticamente para ser consultado
 * por preguntas (Questions) en las aserciones.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   RequestPasswordResetViaApi.forEmail('usuario@fubanking.test'),
 * );
 * ```
 */
export class RequestPasswordResetViaApi implements Task {
  /** Almacena el último resultado de la solicitud para consultas posteriores. */
  static lastResult: PasswordResetRequestResult | null = null;

  private constructor(private readonly email: string) {}

  /** Crea la tarea con el email del usuario que solicita el restablecimiento. */
  static forEmail(email: string): RequestPasswordResetViaApi {
    return new RequestPasswordResetViaApi(email);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const response = await api.post<
      ForgotPasswordSuccessResponse | ForgotPasswordErrorResponse
    >('/auth/forgot-password', { email: this.email });

    RequestPasswordResetViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };
  }
}
