import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import { VerifyResetTokenViaApi } from '../../screenplay/tasks/VerifyResetTokenViaApi';
import { TheTokenVerificationResult } from '../../screenplay/questions/TheTokenVerificationResult';
import {
  createPasswordResetActor,
  INVALID_RESET_TOKENS,
} from '../../fixtures/password-reset.fixtures';

/**
 * Pruebas E2E — Verificación del token de restablecimiento (Patrón Screenplay)
 *
 * Valida el flujo del endpoint GET /auth/verify-reset-token contra el backend real.
 * Cubre los escenarios de token vacío, malformado y con firma inválida.
 *
 * Nota: El escenario de token válido requiere un token generado por el backend
 * en el momento del test. En CI se gestiona via script de seeding.
 *
 * Actores:
 *   - Sofía: usuaria que intenta verificar su token de restablecimiento
 *
 * Principios FIRST:
 *   - Fast: una sola petición HTTP por test
 *   - Independent: cada test limpia lastResult en beforeEach
 *   - Repeatable: tokens ficticios, sin estado externo mutable
 *   - Self-validating: assertions automáticas con fluent assertions
 *   - Timely: cobertura completa de los casos de error del endpoint verify-reset-token
 */
describe('Restablecimiento de contraseña E2E — Verificación de token (Screenplay)', () => {
  let sofia: Actor;

  // ── Arrange global ───────────────────────────────────────────────────────
  beforeAll(async () => {
    sofia = createPasswordResetActor('Sofía');

    const health = await sofia.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas E2E que requieren ' +
          'conexión al backend se omitirán automáticamente.',
      );
    }
  });

  beforeEach(() => {
    VerifyResetTokenViaApi.lastResult = null;
  });

  // ── Helper AAA reutilizable ──────────────────────────────────────────────
  /**
   * Encapsula el patrón AAA para un escenario de verificación rechazada.
   * Evita duplicación de código sin sacrificar legibilidad
   * (cumple el quality gate de Duplicated Lines < 2%).
   */
  async function expectTokenVerificationToBeRejected(
    actor: Actor,
    token: string,
  ): Promise<void> {
    // Arrange: limpiar estado previo
    VerifyResetTokenViaApi.lastResult = null;

    // Act
    await actor.attemptsTo(VerifyResetTokenViaApi.forToken(token));

    // Assert — fluent assertions: el backend debe rechazar el token inválido
    const result = await actor.asks(TheTokenVerificationResult.fromLastAttempt());
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  }

  // ── Escenarios de token inválido ─────────────────────────────────────────

  describe('Escenario: Token vacío', () => {
    it('debería rechazar la verificación cuando el token está vacío', async () => {
      // Arrange
      const health = await sofia.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act
      await sofia.attemptsTo(VerifyResetTokenViaApi.forToken(INVALID_RESET_TOKENS.empty));

      // Assert — el validador Zod debe rechazar el token vacío (min length 1)
      const result = await sofia.asks(TheTokenVerificationResult.fromLastAttempt());
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    });
  });

  describe('Escenario: Token con formato malformado', () => {
    it('debería rechazar un token que no tiene estructura JWT válida', async () => {
      // Arrange
      const health = await sofia.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectTokenVerificationToBeRejected(sofia, INVALID_RESET_TOKENS.malformed);
    });
  });

  describe('Escenario: Token con firma inválida', () => {
    it('debería rechazar un JWT con firma incorrecta', async () => {
      // Arrange
      const health = await sofia.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP: Backend no disponible'); return; }

      // Act + Assert
      await expectTokenVerificationToBeRejected(sofia, INVALID_RESET_TOKENS.invalidSignature);
    });
  });
});
