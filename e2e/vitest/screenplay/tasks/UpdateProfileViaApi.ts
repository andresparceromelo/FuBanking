import { Actor } from '../actors/Actor';
import { Task } from './Task';
import { CallApi } from '../abilities/CallApi';
import type { UpdateProfileInput } from '../../../../backend/src/presentation/validators/profile.validators';

/** Resultado almacenado tras intentar actualizar el perfil vía API. */
export interface ProfileUpdateResult {
  status: number;
  data: any;
}

/**
 * Tarea: Actualizar el perfil del usuario autenticado vía la API del backend.
 *
 * El actor usa su habilidad `CallApi` para enviar un PATCH a
 * `/profile` con los datos a actualizar.
 * El resultado se almacena estáticamente para ser consultado
 * por preguntas (Questions) en las aserciones.
 *
 * @example
 * ```ts
 * await actor.attemptsTo(
 *   UpdateProfileViaApi.withData({
 *     firstName: 'Carlos',
 *     monthlyIncome: 4500000,
 *   }),
 * );
 * ```
 */
export class UpdateProfileViaApi implements Task {
  /** Almacena el último resultado de actualización para consultas posteriores. */
  static lastResult: ProfileUpdateResult | null = null;

  private constructor(private readonly payload: UpdateProfileInput) {}

  /** Crea la tarea con los datos de perfil proporcionados. */
  static withData(payload: UpdateProfileInput): UpdateProfileViaApi {
    return new UpdateProfileViaApi(payload);
  }

  async performAs(actor: Actor): Promise<void> {
    const api = CallApi.as(actor);

    const response = await api.patch<any>(
      '/profile',
      this.payload as unknown as Record<string, unknown>
    );

    UpdateProfileViaApi.lastResult = {
      status: response.status,
      data: response.data,
    };
  }
}
