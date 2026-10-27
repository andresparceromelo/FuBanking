/**
 * ============================================================================
 *  CAJA BLANCA — Depositar dinero (`DepositMoney.execute`, módulo Cuentas)
 * ----------------------------------------------------------------------------
 *  Un caso por cada camino básico (McCabe) del grafo de flujo del caso de uso.
 *  Complementa a `DepositMoney.test.ts` (AAA + dobles): aquí cada prueba
 *  DEMUESTRA qué nodos se recorrieron, instrumentando el repositorio de cuentas
 *  y el de notificaciones; no basta con que la excepción sea la esperada.
 *
 *  Correspondencia nodo ↔ sentencia de `DepositMoney.ts`:
 *    1  → decisión  !dto.amount || dto.amount <= 0
 *    2  → proceso   throw AppError INVALID_AMOUNT (400)
 *    3  → proceso   account = await accountRepository.findById(dto.accountId)
 *    4  → decisión  !account
 *    5  → proceso   throw AppError ACCOUNT_NOT_FOUND (404)
 *    6  → proceso   account.assertBelongsTo(dto.userId)   (lanza FORBIDDEN 403)
 *    7  → decisión  !account.isOperational()
 *    8  → proceso   throw AppError ACCOUNT_INACTIVE (400)
 *    9  → proceso   newBalance = balance + amount; accountRepository.updateBalance(...)
 *    10 → decisión  this.notificationRepository (¿está presente?)
 *    11 → proceso   notificationRepository.save(new Notification(...))
 *    12 → proceso   return updatedAccount
 *
 *  V(G) = decisiones (4) + 1 = 5 caminos independientes (convención del
 *  proyecto: una decisión por cada `if`, a nivel de predicado).
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { DepositMoney } from '../../../application/use-cases/account/DepositMoney';
import { Account, AccountStatus } from '../../../domain/entities/Account';
import { NotificationType } from '../../../domain/entities/Notification';
import { FakeAccountRepository, SpyNotificationRepository, makeAccount } from '../pocket/test-doubles';

/** Cuenta real en memoria que además registra qué nodos de acceso a datos se recorrieron. */
class TraceAccountRepository extends FakeAccountRepository {
  public findByIdCalls: string[] = [];
  public updateBalanceCalls: Array<{ id: string; balance: number }> = [];

  override async findById(id: string): Promise<Account | null> {
    this.findByIdCalls.push(id);
    return super.findById(id);
  }

  override async updateBalance(id: string, balance: number): Promise<Account> {
    this.updateBalanceCalls.push({ id, balance });
    return super.updateBalance(id, balance);
  }
}

const OWNER = 'user-1';
const SALDO = 1_000_000;

function escenario(overrides: Parameters<typeof makeAccount>[0] = {}) {
  const repo = new TraceAccountRepository([makeAccount({ balance: SALDO, ...overrides })]);
  const spy = new SpyNotificationRepository();
  return { repo, spy };
}

describe('Caja blanca · DepositMoney.execute', () => {
  // ── Camino 1: 1 → 2 → Fin ────────────────────────────────────────────────
  it('BE-DE-C1 · 1 → 2 → Fin · monto 0 (primera cláusula: !dto.amount) → INVALID_AMOUNT', async () => {
    const { repo, spy } = escenario();
    const sut = new DepositMoney(repo, spy);

    await expect(sut.execute({ userId: OWNER, accountId: 'acc-1', amount: 0 })).rejects.toMatchObject({
      code: 'INVALID_AMOUNT',
      statusCode: 400,
      message: 'El monto a depositar debe ser mayor a cero',
    });

    expect(repo.findByIdCalls).toHaveLength(0); // nodo 3 no recorrido
    expect(repo.updateBalanceCalls).toHaveLength(0); // nodo 9 no recorrido
    expect(spy.saveCallCount).toBe(0); // nodo 11 no recorrido
    expect((await repo.findById('acc-1'))?.balance).toBe(SALDO);
  });

  it('BE-DE-C1b · 1 → 2 → Fin · monto -1 (segunda cláusula: amount <= 0) → INVALID_AMOUNT', async () => {
    const { repo, spy } = escenario();
    const sut = new DepositMoney(repo, spy);

    await expect(sut.execute({ userId: OWNER, accountId: 'acc-1', amount: -1 })).rejects.toMatchObject({
      code: 'INVALID_AMOUNT',
      statusCode: 400,
    });

    expect(repo.findByIdCalls).toHaveLength(0);
    expect(repo.updateBalanceCalls).toHaveLength(0);
    expect(spy.saveCallCount).toBe(0);
  });

  // ── Camino 2: 1 → 3 → 4 → 5 → Fin ────────────────────────────────────────
  it('BE-DE-C2 · 1 → 3 → 4 → 5 → Fin · la cuenta no existe → ACCOUNT_NOT_FOUND', async () => {
    const { repo, spy } = escenario();
    const sut = new DepositMoney(repo, spy);

    await expect(sut.execute({ userId: OWNER, accountId: 'inexistente', amount: 100 })).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
      statusCode: 404,
      message: 'La cuenta no existe',
    });

    expect(repo.findByIdCalls).toEqual(['inexistente']); // nodo 3 recorrido una vez
    expect(repo.updateBalanceCalls).toHaveLength(0);
    expect(spy.saveCallCount).toBe(0);
  });

  // ── Camino 2b (no tabulado): 1 → 3 → 4 → 6 → Fin (excepción) ──────────────
  it('BE-DE-C2b · 1 → 3 → 4 → 6 → Fin (excepción) · cuenta de otro usuario → FORBIDDEN', async () => {
    const { repo, spy } = escenario({ userId: 'dueño' });
    const sut = new DepositMoney(repo, spy);

    await expect(sut.execute({ userId: 'intruso', accountId: 'acc-1', amount: 100 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
      message: 'No tienes permiso para acceder a esta cuenta',
    });

    expect(repo.findByIdCalls).toEqual(['acc-1']);
    expect(repo.updateBalanceCalls).toHaveLength(0); // nodo 9 no recorrido
    expect(spy.saveCallCount).toBe(0);
    expect((await repo.findById('acc-1'))?.balance).toBe(SALDO);
  });

  // ── Camino 3: 1 → 3 → 4 → 6 → 7 → 8 → Fin ────────────────────────────────
  it('BE-DE-C3 · 1 → 3 → 4 → 6 → 7 → 8 → Fin · cuenta BLOQUEADA → ACCOUNT_INACTIVE', async () => {
    const { repo, spy } = escenario({ status: AccountStatus.BLOQUEADA });
    const sut = new DepositMoney(repo, spy);

    await expect(sut.execute({ userId: OWNER, accountId: 'acc-1', amount: 100 })).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
      statusCode: 400,
      message: 'La cuenta no está activa',
    });

    expect(repo.findByIdCalls).toEqual(['acc-1']);
    expect(repo.updateBalanceCalls).toHaveLength(0);
    expect(spy.saveCallCount).toBe(0);
    expect((await repo.findById('acc-1'))?.balance).toBe(SALDO);
  });

  // ── Camino 4: 1 → 3 → 4 → 6 → 7 → 9 → 10 → 11 → 12 → Fin ──────────────────
  it('BE-DE-C4 · 1 → 3 → 4 → 6 → 7 → 9 → 10 → 11 → 12 → Fin · depósito con notificación', async () => {
    const { repo, spy } = escenario();
    const sut = new DepositMoney(repo, spy);

    const result = await sut.execute({ userId: OWNER, accountId: 'acc-1', amount: 250_000 });

    expect(result.balance).toBe(1_250_000);
    expect(repo.updateBalanceCalls).toEqual([{ id: 'acc-1', balance: 1_250_000 }]);
    expect(spy.saveCallCount).toBe(1);
    expect(spy.savedNotifications[0]).toMatchObject({
      userId: OWNER,
      title: 'Depósito realizado',
      type: NotificationType.SISTEMA,
      read: false,
    });
    expect(spy.savedNotifications[0].message).toBe(
      `Depósito de $${(250_000).toLocaleString('es-CO')} en tu cuenta ****0001`,
    );
  });

  it('BE-DE-C4b · camino 4 con valor límite · monto 1 (el mínimo válido)', async () => {
    const { repo, spy } = escenario();
    const sut = new DepositMoney(repo, spy);

    const result = await sut.execute({ userId: OWNER, accountId: 'acc-1', amount: 1 });

    expect(result.balance).toBe(SALDO + 1);
    expect(repo.updateBalanceCalls).toEqual([{ id: 'acc-1', balance: SALDO + 1 }]);
    expect(spy.saveCallCount).toBe(1);
  });

  // ── Camino 5: 1 → 3 → 4 → 6 → 7 → 9 → 10 → 12 → Fin ──────────────────────
  it('BE-DE-C5 · 1 → 3 → 4 → 6 → 7 → 9 → 10 → 12 → Fin · depósito sin repositorio de notificaciones', async () => {
    const { repo, spy } = escenario();
    const sut = new DepositMoney(repo); // parámetro opcional omitido → nodo 10 = FALSO

    const result = await sut.execute({ userId: OWNER, accountId: 'acc-1', amount: 5_000 });

    expect(result.balance).toBe(SALDO + 5_000);
    expect(repo.updateBalanceCalls).toEqual([{ id: 'acc-1', balance: SALDO + 5_000 }]);
    expect(spy.saveCallCount).toBe(0); // el spy no está inyectado: nodo 11 no recorrido
  });
});
