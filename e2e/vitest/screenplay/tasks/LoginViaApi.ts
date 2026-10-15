import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';

/** Respuesta esperada del endpoint /auth/login cuando no requiere 2FA. */
interface LoginDirectResponse {
  requiresTwoFactor: false;
  user: { id: string; email: string };
  token: string;
}

/** Respuesta esperada del endpoint /auth/login cuando requiere 2FA. */
interface LoginTwoFactorResponse {
  requiresTwoFactor: true;
  temporaryToken: string;
  maskedEmail: string;
}

type LoginApiResponse = LoginDirectResponse | LoginTwoFactorResponse;

/** Resultado almacenado tras intentar el login vía API. */
export interface LoginResult {
  status: number;
  data: LoginApiResponse | { code: string; message: string };
}

/**
 * Tarea: Iniciar sesión con credenciales vía la API del backend.
 *
 * El actor usa su habilidad `CallApi` para enviar un POST a
 * `/auth/login` con el email y la contraseña proporcionados.
 * El resultado se almacena para ser consultado por preguntas.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   LoginViaApi.withCredentials('ana@example.com', 'Segura123!'),
 * );
 * ```
 */
export class LoginViaApi implements Task {
  /** Almacena el último resultado del login para consultas posteriores. */
  static lastResult: LoginResult | null = null;

  private constructor(
    private readonly email: string,
    private readonly password: string,
  ) {}

  /** Crea la tarea con las credenciales dadas. */
  static withCredentials(email: string, password: string): LoginViaApi {
    return new LoginViaApi(email, password);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const response = await api.post<LoginApiResponse | { code: string; message: string }>(
      '/auth/login',
      { email: this.email, password: this.password },
    );

    LoginViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };

    if (response.status === 200 && 'token' in response.data) {
      api.setToken(response.data.token);
    }
  }
}
