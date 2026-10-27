import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Actor } from '../../screenplay/actors/Actor';
import { TheBackendHealth } from '../../screenplay/questions/TheBackendHealth';
import { WithdrawMoneyViaApi } from '../../screenplay/tasks/WithdrawMoneyViaApi';
import { TheWithdrawalResult } from '../../screenplay/questions/TheWithdrawalResult';
import {
  createWithdrawalActor,
  INVALID_WITHDRAWAL_CASES,
  buildWithdrawalPayload,
} from '../../fixtures/withdrawal.fixtures';
import { LoginViaApi } from '../../screenplay/tasks/LoginViaApi';
import { TEST_CREDENTIALS } from '../../fixtures/login.fixtures';

/**
 * Pruebas E2E — Retiro de dinero (Patrón Screenplay)
 *
 * Valida el flujo del endpoint POST /accounts/:id/withdraw contra el backend real.
 * Cubre los escenarios de validación de monto y existencia de la cuenta.
 *
 * Actores:
 *   - Felipe: usuario autenticado que intenta retirar dinero
 *
 * Principios FIRST:
 *   - Fast: una sola petición HTTP por test de validación
 *   - Independent: cada test limpia lastResult en beforeEach
 *   - Repeatable: usa fixtures consistentes
 *   - Self-validating: assertions automáticas con fluent assertions
 *   - Timely: cobertura completa de los casos de error
 */
describe('Retiro de dinero E2E — API Backend (Screenplay)', () => {
  let felipe: Actor;

  // ── Arrange global ───────────────────────────────────────────────────────
  beforeAll(async () => {
    felipe = createWithdrawalActor('Felipe');

    const health = await felipe.asks(TheBackendHealth.check());

    if (!health.isHealthy) {
      console.warn(
        '⚠ Backend no disponible. Las pruebas E2E que requieren ' +
          'conexión al backend se omitirán automáticamente.',
      );
      return;
    }

    // Iniciar sesión para obtener un token JWT válido (es un endpoint autenticado)
    await felipe.attemptsTo(
      LoginViaApi.withCredentials(
        TEST_CREDENTIALS.validUser.email,
        TEST_CREDENTIALS.validUser.password,
      ),
    );
  });

  beforeEach(() => {
    WithdrawMoneyViaApi.lastResult = null;
  });

  // ── Helper AAA reutilizable ──────────────────────────────────────────────
  /**
   * Encapsula el patrón AAA para un escenario de retiro rechazado.
   * Evita duplicación de código sin sacrificar legibilidad
   * (cumple el quality gate de Duplicated Lines < 2%).
   */
  async function expectWithdrawalToBeRejected(
    actor: Actor,
    payload: ReturnType<typeof buildWithdrawalPayload>,
  ): Promise<void> {
    // Arrange: limpiar estado previo
    WithdrawMoneyViaApi.lastResult = null;

    // Act
    await actor.attemptsTo(WithdrawMoneyViaApi.withData(payload));

    // Assert — fluent assertions: el backend debe responder con un error de cliente (4xx)
    const result = await actor.asks(TheWithdrawalResult.fromLastAttempt());
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  }

  // ── Escenarios de Validación ─────────────────────────────────────────────

  describe('Escenario: Monto inválido', () => {
    it('debería rechazar un retiro por monto cero', async () => {
      // Arrange
      const health = await felipe.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      const payload = buildWithdrawalPayload(INVALID_WITHDRAWAL_CASES.zeroAmount);

      // Act + Assert
      await expectWithdrawalToBeRejected(felipe, payload);
    });

    it('debería rechazar un retiro por monto negativo', async () => {
      // Arrange
      const health = await felipe.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      const payload = buildWithdrawalPayload(INVALID_WITHDRAWAL_CASES.negativeAmount);

      // Act + Assert
      await expectWithdrawalToBeRejected(felipe, payload);
    });
  });

  describe('Escenario: Cuenta no encontrada', () => {
    it('debería responder con error si la cuenta no existe o no pertenece al usuario', async () => {
      // Arrange
      const health = await felipe.asks(TheBackendHealth.check());
      if (!health.isHealthy) { console.warn('SKIP'); return; }

      const payload = buildWithdrawalPayload(INVALID_WITHDRAWAL_CASES.nonExistentAccount);

      // Act + Assert
      await expectWithdrawalToBeRejected(felipe, payload);
    });
  });
});
