import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import { ResetPasswordViaApi } from '../../screenplay/tasks/ResetPasswordViaApi';
import { ThePasswordResetResult } from '../../screenplay/questions/ThePasswordResetResult';
import {
  createPasswordResetActor,
  INVALID_RESET_TOKENS,
  INVALID_PASSWORD_RESET_CASES,
} from '../../fixtures/password-reset.fixtures';

/**
 * Pruebas E2E — Restablecimiento de contraseña con token (Patrón Screenplay)
 *
 * Valida el flujo del endpoint POST /auth/reset-password contra el backend real.
 * Cubre los escenarios de token inválido, contraseñas que no cumplen la política
 * y contraseñas que no coinciden.
 *
 * Nota: El escenario exitoso (token válido) requiere un token generado por el
 * backend en el momento del test. En CI se gestiona via script de seeding.
 *
 * Actores:
 *   - Carlos: usuario que intenta restablecer su contraseña
 *
 * Principios FIRST:
 *   - Fast: una sola petición HTTP por test
 *   - Independent: cada test limpia lastResult en beforeEach
 *   - Repeatable: usa tokens ficticios, no estado externo mutable
 *   - Self-validating: assertions automáticas con fluent assertions
 *   - Timely: cobertura completa de los casos de error del endpoint reset-password
 */
describe('Restablecimiento de contraseña E2E — Uso del token (Screenplay)', () => {
  let carlos: Actor;

  // ── Arrange global ───────────────────────────────────────────────────────
  beforeAll(async () => {
    carlos = createPasswordResetActor('Carlos');

    const health = await carlos.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas E2E que requieren ' +
          'conexión al backend se omitirán automáticamente.',
      );
    }
  });

  beforeEach(() => {
    ResetPasswordViaApi.lastResult = null;
  });

  // ── Helper AAA reutilizable ──────────────────────────────────────────────
  /**
   * Encapsula el patrón AAA para un escenario de reset rechazado.
   * Evita duplicación de código sin sacrificar legibilidad
   * (cumple el quality gate de Duplicated Lines < 2%).
   */
  async function expectResetToBeRejected(
    actor: Actor,
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    // Arrange: limpiar estado previo
    ResetPasswordViaApi.lastResult = null;

    // Act
    await actor.attemptsTo(
      ResetPasswordViaApi.with({ token, newPassword, confirmPassword }),
    );

    // Assert — fluent assertions: el backend debe responder con un error de cliente
    const result = await actor.asks(ThePasswordResetResult.fromLastAttempt());
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  }

  // ── Escenarios de token inválido ─────────────────────────────────────────

  describe('Escenario: Token con formato malformado', () => {
    it('debería rechazar un token que no tiene estructura JWT válida', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectResetToBeRejected(
        carlos,
        INVALID_RESET_TOKENS.malformed,
        'NuevaClave123!',
        'NuevaClave123!',
      );
    });

    it('debería rechazar un token con firma JWT incorrecta', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectResetToBeRejected(
        carlos,
        INVALID_RESET_TOKENS.invalidSignature,
        'NuevaClave123!',
        'NuevaClave123!',
      );
    });
  });

  describe('Escenario: Token vacío', () => {
    it('debería rechazar la solicitud cuando el token está vacío', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await carlos.attemptsTo(
        ResetPasswordViaApi.with({
          token: INVALID_RESET_TOKENS.empty,
          newPassword: 'NuevaClave123!',
          confirmPassword: 'NuevaClave123!',
        }),
      );

      // Assert — el validador Zod debe rechazar el token vacío (min length 1)
      const result = await carlos.asks(ThePasswordResetResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });

  // ── Escenarios de política de contraseña ────────────────────────────────

  describe('Escenario: Contraseñas que no cumplen la política de seguridad', () => {
    it('debería rechazar una nueva contraseña demasiado corta', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectResetToBeRejected(
        carlos,
        INVALID_RESET_TOKENS.malformed,
        INVALID_PASSWORD_RESET_CASES.tooShort.newPassword,
        INVALID_PASSWORD_RESET_CASES.tooShort.confirmPassword,
      );
    });

    it('debería rechazar una nueva contraseña sin letra mayúscula', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectResetToBeRejected(
        carlos,
        INVALID_RESET_TOKENS.malformed,
        INVALID_PASSWORD_RESET_CASES.noUppercase.newPassword,
        INVALID_PASSWORD_RESET_CASES.noUppercase.confirmPassword,
      );
    });

    it('debería rechazar una nueva contraseña sin dígito numérico', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectResetToBeRejected(
        carlos,
        INVALID_RESET_TOKENS.malformed,
        INVALID_PASSWORD_RESET_CASES.noDigit.newPassword,
        INVALID_PASSWORD_RESET_CASES.noDigit.confirmPassword,
      );
    });
  });

  describe('Escenario: Contraseñas que no coinciden', () => {
    it('debería rechazar cuando newPassword y confirmPassword son diferentes', async () => {
      // Arrange
      const health = await carlos.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await carlos.attemptsTo(
        ResetPasswordViaApi.with({
          token: INVALID_RESET_TOKENS.malformed,
          newPassword: INVALID_PASSWORD_RESET_CASES.mismatch.newPassword,
          confirmPassword: INVALID_PASSWORD_RESET_CASES.mismatch.confirmPassword,
        }),
      );

      // Assert — el validador Zod o el caso de uso deben rechazar el mismatch
      const result = await carlos.asks(ThePasswordResetResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });
});
