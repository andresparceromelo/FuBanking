/**
 * ============================================================================
 *  Pruebas unitarias — TransferPocketBalance ("Transferir entre bolsillos")
 * ----------------------------------------------------------------------------
 *  Patrón AAA + principios FIRST (ver detalle en CreatePocket.test.ts).
 *  Dobles demostrados aquí: FAKE.
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TransferPocketBalance } from '../../../application/use-cases/pocket/TransferPocketBalance';
import { AccountStatus } from '../../../domain/entities/Account';
import {
  FakeAccountRepository,
  FakePocketRepository,
  FakeNotificationRepository,
  makeAccount,
  makePocket,
} from './test-doubles';

describe('TransferPocketBalance.execute', () => {
  let accountRepo: FakeAccountRepository;
  let pocketRepo: FakePocketRepository;
  let notifRepo: FakeNotificationRepository;
  let useCase: TransferPocketBalance;

  beforeEach(() => {
    // Arrange base: dos bolsillos de la misma cuenta — p1=200.000, p2=50.000.
    accountRepo = new FakeAccountRepository([makeAccount()]);
    pocketRepo = new FakePocketRepository([
      makePocket({ id: 'p1', accountId: 'acc-1', name: 'Origen', amount: 200_000 }),
      makePocket({ id: 'p2', accountId: 'acc-1', name: 'Destino', amount: 50_000 }),
    ]);
    notifRepo = new FakeNotificationRepository();
    useCase = new TransferPocketBalance(accountRepo, pocketRepo, notifRepo);
  });

  describe('Camino feliz', () => {
    it('mueve el monto del bolsillo origen al destino', async () => {
      // Arrange
      const dto = { userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p2', amount: 100_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.fromPocket.amount).toBe(100_000); // 200.000 − 100.000
      expect(result.toPocket.amount).toBe(150_000); // 50.000 + 100.000
    });

    it('funciona sin repositorio de notificaciones', async () => {
      // Arrange
      const sut = new TransferPocketBalance(accountRepo, pocketRepo); // sin notificaciones

      // Act
      const result = await sut.execute({
        userId: 'user-1',
        fromPocketId: 'p1',
        toPocketId: 'p2',
        amount: 25_000,
      });

      // Assert
      expect(result.fromPocket.amount).toBe(175_000);
      expect(result.toPocket.amount).toBe(75_000);
    });
  });

  describe('Validaciones y errores', () => {
    it('rechaza montos menores o iguales a cero', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p2', amount: 0 }),
      ).rejects.toMatchObject({ code: 'INVALID_TRANSFER_AMOUNT', statusCode: 400 });
    });

    it('rechaza transferir un bolsillo hacia sí mismo', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p1', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'INVALID_TRANSFER_TARGET', statusCode: 400 });
    });

    it('lanza SOURCE_POCKET_NOT_FOUND cuando el origen no existe', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', fromPocketId: 'nope', toPocketId: 'p2', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'SOURCE_POCKET_NOT_FOUND', statusCode: 404 });
    });

    it('lanza TARGET_POCKET_NOT_FOUND cuando el destino no existe', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'nope', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'TARGET_POCKET_NOT_FOUND', statusCode: 404 });
    });

    it('lanza POCKETS_DIFFERENT_ACCOUNT cuando los bolsillos son de cuentas distintas', async () => {
      // Arrange — p2 pertenece a otra cuenta.
      pocketRepo = new FakePocketRepository([
        makePocket({ id: 'p1', accountId: 'acc-1', amount: 200_000 }),
        makePocket({ id: 'p2', accountId: 'acc-2', amount: 50_000 }),
      ]);
      const sut = new TransferPocketBalance(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p2', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'POCKETS_DIFFERENT_ACCOUNT', statusCode: 400 });
    });

    it('lanza ACCOUNT_NOT_FOUND cuando la cuenta de los bolsillos no existe', async () => {
      // Arrange — ambos bolsillos apuntan a una cuenta ausente del repositorio.
      accountRepo = new FakeAccountRepository([]); // sin cuentas
      pocketRepo = new FakePocketRepository([
        makePocket({ id: 'p1', accountId: 'acc-x', amount: 200_000 }),
        makePocket({ id: 'p2', accountId: 'acc-x', amount: 50_000 }),
      ]);
      const sut = new TransferPocketBalance(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p2', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
    });

    it('lanza FORBIDDEN cuando la cuenta es de otro usuario', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([makeAccount({ userId: 'dueño' })]);
      const sut = new TransferPocketBalance(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'intruso', fromPocketId: 'p1', toPocketId: 'p2', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    });

    it('lanza ACCOUNT_NOT_OPERATIONAL cuando la cuenta está bloqueada', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([makeAccount({ status: AccountStatus.BLOQUEADA })]);
      const sut = new TransferPocketBalance(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p2', amount: 10_000 }),
      ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_OPERATIONAL', statusCode: 400 });
    });

    it('lanza INSUFFICIENT_POCKET_BALANCE cuando el origen no tiene saldo suficiente', async () => {
      // Arrange — p1 solo tiene 200.000; se intenta mover 500.000.
      await expect(
        useCase.execute({ userId: 'user-1', fromPocketId: 'p1', toPocketId: 'p2', amount: 500_000 }),
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_POCKET_BALANCE', statusCode: 400 });
    });
  });
});
