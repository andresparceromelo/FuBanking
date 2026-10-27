import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';

/** Payload de registro enviado al endpoint /auth/register. */
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  document: string;
  birthDate: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  monthlyIncome: number;
  middleName?: string;
  secondLastName?: string;
}

/** Datos del usuario devueltos tras un registro exitoso. */
export interface RegisteredUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Respuesta exitosa del endpoint /auth/register. */
export interface RegisterSuccessResponse {
  user: RegisteredUserData;
  token: string;
}

/** Respuesta de error del endpoint /auth/register. */
export interface RegisterErrorResponse {
  code: string;
  message: string;
}

/** Resultado almacenado tras intentar registrar un usuario vía API. */
export interface RegistrationResult {
  status: number;
  data:
    | { data: RegisterSuccessResponse; message: string }
    | { error: RegisterErrorResponse };
}

/**
 * Tarea: Registrar un nuevo usuario vía la API del backend.
 *
 * El actor usa su habilidad `CallApi` para enviar un POST a
 * `/auth/register` con los datos del nuevo usuario.
 * El resultado se almacena estáticamente para ser consultado
 * por preguntas (Questions) en las aserciones.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   RegisterViaApi.withData({
 *     firstName: 'María',
 *     lastName: 'García',
 *     document: '12345678',
 *     birthDate: '1995-06-15',
 *     email: 'maria@example.com',
 *     password: 'Segura123!',
 *     confirmPassword: 'Segura123!',
 *     monthlyIncome: 3000000,
 *   }),
 * );
 * ```
 */
export class RegisterViaApi implements Task {
  /** Almacena el último resultado de registro para consultas posteriores. */
  static lastResult: RegistrationResult | null = null;

  private constructor(private readonly payload: RegisterPayload) {}

  /** Crea la tarea con los datos de registro proporcionados. */
  static withData(payload: RegisterPayload): RegisterViaApi {
    return new RegisterViaApi(payload);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const response = await api.post<
      | { data: RegisterSuccessResponse; message: string }
      | { error: RegisterErrorResponse }
    >('/auth/register', this.payload as unknown as Record<string, unknown>);

    RegisterViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };

    if (response.status === 201 && 'data' in response.data && response.data.data.token) {
      api.setToken(response.data.data.token);
    }
  }
}
