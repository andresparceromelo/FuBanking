import { Actor } from '../actors/Actor';
import { Question } from './Question';
import { CallApi } from '../abilities/CallApi';

/** Resultado del health check del backend. */
export interface HealthCheckResult {
  isHealthy: boolean;
  status: number;
}

/**
 * Pregunta: ¿El backend está disponible y saludable?
 *
 * Consulta el endpoint `/health` del backend para verificar
 * que el servicio esté levantado antes de ejecutar las pruebas.
 *
 * @example
 * ```ts
 * const health = await actor.asks(TheBackendHealth.check());
 * expect(health.isHealthy).toBe(true);
 * ```
 */
export class TheBackendHealth implements Question<HealthCheckResult> {
  private constructor() {}

  /** Crea la pregunta de health check. */
  static check(): TheBackendHealth {
    return new TheBackendHealth();
  }

  async answeredBy(actor: Actor): Promise<HealthCheckResult> {
    const api = CallApi.as(actor);

    try {
      // Obtenemos la URL base (http://localhost:3001) a partir de la URL de la API
      const baseUrl = new URL(process.env['E2E_API_URL'] || 'http://localhost:3001/api/v1').origin;
      const response = await fetch(`${baseUrl}/health`);

      return {
        isHealthy: response.status === 200,
        status: response.status,
      };
    } catch {
      return {
        isHealthy: false,
        status: 0,
      };
    }
  }
}
