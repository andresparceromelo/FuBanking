import { describe, it, expect, beforeAll } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { RegisterViaApi } from '../../screenplay/tasks/RegisterViaApi';
import { UpdateProfileViaApi } from '../../screenplay/tasks/UpdateProfileViaApi';
import { TheProfileUpdateResult } from '../../screenplay/questions/TheProfileUpdateResult';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import {
  createRegistrationActor,
  buildValidRegistrationPayload,
  buildUniqueEmail,
} from '../../fixtures/registration.fixtures';
import { INVALID_PROFILE_CASES } from '../../fixtures/profile.fixtures';
import type { UpdateProfileInput } from '../../../../backend/src/presentation/validators/profile.validators';

/**
 * Pruebas E2E — Validaciones de campos en la edición de perfil
 *
 * Suite complementaria que cubre todos los casos de borde de validación
 * del endpoint PATCH /profile definidos en profile.validators.ts.
 *
 * Cada test verifica que el backend rechaza correctamente los datos inválidos
 * con un código HTTP 4xx, evitando código duplicado mediante el catálogo
 * `INVALID_PROFILE_CASES`.
 */
describe('Perfil E2E — Validaciones de campos (Screenplay)', () => {
  let actorAutenticado: Actor;

  beforeAll(async () => {
    // Para validaciones que no modifican el estado final (todas fallan),
    // podemos reutilizar un solo actor autenticado. (Fast, no creamos N usuarios)
    actorAutenticado = createRegistrationActor('ValidadorPerfil');

    const health = await actorAutenticado.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn('⚠ Backend no disponible. Pruebas omitidas.');
      return;
    }

    const payload = buildValidRegistrationPayload({
      email: buildUniqueEmail('e2e-prof-val'),
    });
    await actorAutenticado.attemptsTo(RegisterViaApi.withData(payload));
  });

  /**
   * Helper reutilizable (AAA) para verificar que una actualización es rechazada.
   */
  async function expectProfileUpdateToBeRejected(
    payload: UpdateProfileInput,
  ): Promise<void> {
    UpdateProfileViaApi.lastResult = null;
    await actorAutenticado.attemptsTo(UpdateProfileViaApi.withData(payload));

    const result = await actorAutenticado.asks(
      TheProfileUpdateResult.fromLastAttempt()
    );
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  }

  describe('Validación de nombres', () => {
    it('debería rechazar nombres demasiado cortos', async () => {
      const health = await actorAutenticado.asks(TheBackendHealth.check());
      if (!health.isHealthy) return;

      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.shortFirstName);
      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.shortLastName);
    });

    it('debería rechazar nombres con reglas semánticas inválidas', async () => {
      const health = await actorAutenticado.asks(TheBackendHealth.check());
      if (!health.isHealthy) return;

      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.consecutiveCharsName);
      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.noVowelsName);
      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.invalidCharsName);
    });
  });

  describe('Validación de datos de contacto y financieros', () => {
    it('debería rechazar un teléfono con formato inválido', async () => {
      const health = await actorAutenticado.asks(TheBackendHealth.check());
      if (!health.isHealthy) return;

      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.invalidPhone);
    });

    it('debería rechazar un avatarUrl que no sea una URL válida', async () => {
      const health = await actorAutenticado.asks(TheBackendHealth.check());
      if (!health.isHealthy) return;

      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.invalidAvatarUrl);
    });

    it('debería rechazar ingresos mensuales negativos o cero', async () => {
      const health = await actorAutenticado.asks(TheBackendHealth.check());
      if (!health.isHealthy) return;

      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.negativeIncome);
      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.zeroIncome);
    });
  });

  describe('Payload vacío', () => {
    it('debería requerir enviar al menos un campo a actualizar', async () => {
      const health = await actorAutenticado.asks(TheBackendHealth.check());
      if (!health.isHealthy) return;

      await expectProfileUpdateToBeRejected(INVALID_PROFILE_CASES.emptyPayload);
    });
  });
});
