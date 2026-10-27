import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';

/** Respuesta exitosa del endpoint /auth/reset-password. */
export interface ResetPasswordSuccessResponse {
  message: string;
  data: null;
}

/** Respuesta de error del endpoint /auth/reset-password. */
export interface ResetPasswordErrorResponse {
  error: { code: string; message: string };
}

/** Payload enviado al endpoint de restablecimiento de contraseña. */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** Resultado almacenado tras intentar restablecer la contraseña vía API. */
export interface PasswordResetResult {
  status: number;
  data: ResetPasswordSuccessResponse | ResetPasswordErrorResponse | Record<string, unknown>;
}

/**
 * Tarea: Restablecer la contraseña usando un token de reset vía la API del backend.
 *
 * El actor usa su habilidad `CallApi` para enviar un POST a
 * `/auth/reset-password` con el token y la nueva contraseña.
 * El resultado se almacena estáticamente para ser consultado
 * por preguntas (Questions) en las aserciones.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   ResetPasswordViaApi.with({
 *     token: 'jwt-reset-token',
 *     newPassword: 'NuevaClave123!',
 *     confirmPassword: 'NuevaClave123!',
 *   }),
 * );
 * ```
 */
export class ResetPasswordViaApi implements Task {
  /** Almacena el último resultado del restablecimiento para consultas posteriores. */
  static lastResult: PasswordResetResult | null = null;

  private constructor(private readonly payload: ResetPasswordPayload) {}

  /** Crea la tarea con el token y la nueva contraseña. */
  static with(payload: ResetPasswordPayload): ResetPasswordViaApi {
    return new ResetPasswordViaApi(payload);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const response = await api.post<ResetPasswordSuccessResponse | ResetPasswordErrorResponse>(
      '/auth/reset-password',
      this.payload as unknown as Record<string, unknown>,
    );

    ResetPasswordViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };
  }
}
