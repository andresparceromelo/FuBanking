import { Actor } from '../screenplay/actors/Actor';
import { CallApi } from '../screenplay/abilities/CallApi';
import { BrowseTheWeb } from '../screenplay/abilities/BrowseTheWeb';
import { getE2EConfig } from '../setup';
import type { WithdrawalPayload } from '../screenplay/tasks/WithdrawMoneyViaApi';

/**
 * Datos de prueba para los escenarios E2E de retiro de dinero.
 * En un entorno real E2E, los IDs de cuenta se generarían o recuperarían
 * dinámicamente llamando a un endpoint de creación de cuenta o
 * de consulta de cuentas. Aquí simulamos los casos de prueba de validación.
 */
export const INVALID_WITHDRAWAL_CASES = {
  /** Monto negativo o cero. */
  zeroAmount: { amount: 0 },
  negativeAmount: { amount: -50000 },
  /** Cuenta inexistente (ID inventado). */
  nonExistentAccount: { accountId: 'uuid-no-existe-1234' },
} as const;

/**
 * Crea un actor preconfigurado con las habilidades CallApi y BrowseTheWeb
 * para los escenarios de retiro.
 */
export function createWithdrawalActor(name: string): Actor {
  const config = getE2EConfig();

  return Actor.named(name)
    .whoCan(CallApi.at(config.apiUrl))
    .whoCan(BrowseTheWeb.at(config.baseUrl));
}

/**
 * Devuelve un payload de retiro base, usado comúnmente para mezclarlo
 * con overrides.
 */
export function buildWithdrawalPayload(overrides: Partial<WithdrawalPayload>): WithdrawalPayload {
  return {
    accountId: 'uuid-por-defecto',
    amount: 10000,
    ...overrides,
  };
}
