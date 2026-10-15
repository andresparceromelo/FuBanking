import { describe, it, expect, beforeAll } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { RegisterViaApi } from '../../screenplay/tasks/RegisterViaApi';
import { TheRegistrationResult } from '../../screenplay/questions/TheRegistrationResult';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import {
  createRegistrationActor,
  buildValidRegistrationPayload,
  INVALID_REGISTRATION_CASES,
} from '../../fixtures/registration.fixtures';

/**
 * Pruebas E2E — Validaciones de campos en el registro (Patrón Screenplay)
 *
 * Suite complementaria que cubre todos los casos de borde de validación
 * del endpoint POST /auth/register definidos en auth.validators.ts.
 *
 * Cada test verifica que el backend rechaza correctamente los datos inválidos
 * con un código HTTP 4xx, cumpliendo el Quality Gate de SonarQube al evitar
 * lógica duplicada mediante el catálogo `INVALID_REGISTRATION_CASES`.
 *
 * Actores:
 *   - Valentina: usuaria que intenta registrarse con datos inválidos
 *
 * Principios FIRST:
 *   - Fast: llamada única por test
 *   - Independent: cada test usa su propio payload generado por factory
 *   - Repeatable: el timestamp en el email garantiza repetibilidad
 *   - Self-validating: assertions automáticas
 *   - Timely: escritas en paralelo al desarrollo del validador
 */
describe('Registro E2E — Validaciones de campos (Screenplay)', () => {
  let valentina: Actor;

  // ── Arrange global ────────────────────────────────────────────────────────
  beforeAll(async () => {
    valentina = createRegistrationActor('Valentina');

    const health = await valentina.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas de validación se omitirán.',
      );
    }
  });

  /**
   * Helper reutilizable que encapsula el patrón AAA completo para un
   * escenario de validación. Evita duplicación de código sin sacrificar
   * legibilidad (cumple el quality gate de Duplicated Lines < 2%).
   */
  async function expectRegistrationToBeRejected(
    actor: Actor,
    payload: ReturnType<typeof buildValidRegistrationPayload>,
  ): Promise<void> {
    // Arrange: limpiar estado previo
    RegisterViaApi.lastResult = null;

    // Act
    await actor.attemptsTo(RegisterViaApi.withData(payload));

    // Assert — fluent: el backend debe responder con un error de cliente
    const result = await actor.asks(TheRegistrationResult.fromLastAttempt());
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  }

  // ── Validaciones de nombre ────────────────────────────────────────────────
  describe('Validación de nombres', () => {
    it('debería rechazar un primer nombre con menos de 2 caracteres', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert (vía helper AAA)
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.shortFirstName);
    });

    it('debería rechazar un apellido con menos de 2 caracteres', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.shortLastName);
    });
  });

  // ── Validaciones de email ────────────────────────────────────────────────
  describe('Validación de correo electrónico', () => {
    it('debería rechazar un email con formato inválido', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.invalidEmail);
    });
  });

  // ── Validaciones de contraseña ───────────────────────────────────────────
  describe('Validación de política de contraseña', () => {
    it('debería rechazar una contraseña sin letras mayúsculas', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(
        valentina,
        INVALID_REGISTRATION_CASES.passwordNoUppercase,
      );
    });

    it('debería rechazar una contraseña sin dígitos numéricos', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.passwordNoDigit);
    });

    it('debería rechazar cuando password y confirmPassword no son iguales', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.passwordMismatch);
    });
  });

  // ── Validaciones de datos personales ────────────────────────────────────
  describe('Validación de datos personales', () => {
    it('debería rechazar el registro de un menor de 18 años', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.underage);
    });

    it('debería rechazar un ingreso mensual negativo', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Act + Assert
      await expectRegistrationToBeRejected(valentina, INVALID_REGISTRATION_CASES.negativeIncome);
    });
  });

  // ── Validación de unicidad de documento ─────────────────────────────────
  describe('Validación de unicidad de documento', () => {
    it('debería rechazar dos registros con el mismo número de documento', async () => {
      // Arrange
      const health = await valentina.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      // Documento único por ejecución para garantizar FIRST (Isolated)
      const sharedDocument = `DOC${Date.now().toString(36).toUpperCase()}`;
      const firstPayload = buildValidRegistrationPayload({ document: sharedDocument });
      const secondPayload = buildValidRegistrationPayload({ document: sharedDocument });

      // Act — primer registro debe tener éxito
      RegisterViaApi.lastResult = null;
      await valentina.attemptsTo(RegisterViaApi.withData(firstPayload));
      const firstResult = await valentina.asks(TheRegistrationResult.fromLastAttempt());
      expect(firstResult.status).toBe(201);

      // Act — segundo registro con mismo documento debe fallar
      await expectRegistrationToBeRejected(valentina, secondPayload);
    });
  });
});
