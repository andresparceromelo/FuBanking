/**
 * ============================================================================
 *  Pruebas unitarias — DeletePocket (caso de uso "Eliminar bolsillo")
 * ----------------------------------------------------------------------------
 *  Patrón AAA + principios FIRST (ver detalle en CreatePocket.test.ts).
 *  Dobles demostrados aquí: FAKE y SPY.
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeletePocket } from '../../../application/use-cases/pocket/DeletePocket';
import { AccountStatus } from '../../../domain/entities/Account';
import {
  FakeAccountRepository,
  FakePocketRepository,
  FakeNotificationRepository,
  SpyNotificationRepository,
  makeAccount,
  makePocket,
} from './test-doubles';

describe('DeletePocket.execute', () => {
  let accountRepo: FakeAccountRepository;
  let pocketRepo: FakePocketRepository;
  let notifRepo: FakeNotificationRepository;
  let useCase: DeletePocket;

  beforeEach(() => {
    // Arrange base: saldo 900.000 + bolsillo "p1" de 100.000 (total 1.000.000).
    accountRepo = new FakeAccountRepository([makeAccount({ balance: 900_000 })]);
    pocketRepo = new FakePocketRepository([makePocket({ id: 'p1', amount: 100_000 })]);
    notifRepo = new FakeNotificationRepository();
    useCase = new DeletePocket(accountRepo, pocketRepo, notifRepo);
  });

  describe('Camino feliz', () => {
    it('elimina el bolsillo y devuelve su monto al saldo de la cuenta', async () => {
      // Arrange
      const dto = { userId: 'user-1', pocketId: 'p1' };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.id).toBe('p1');
      expect(await pocketRepo.findById('p1')).toBeNull();
      const account = await accountRepo.findById('acc-1');
      expect(account?.balance).toBe(1_000_000); // 900.000 + 100.000
    });

    it('emite una notificación de "Bolsillo eliminado" (SPY)', async () => {
      // Arrange
      const spyNotif = new SpyNotificationRepository();
      const sut = new DeletePocket(accountRepo, pocketRepo, spyNotif);

      // Act
      await sut.execute({ userId: 'user-1', pocketId: 'p1' });

      // Assert
      expect(spyNotif.saveCallCount).toBe(1);
      expect(spyNotif.savedNotifications[0].title).toBe('Bolsillo eliminado');
    });

    it('funciona sin repositorio de notificaciones', async () => {
      // Arrange
      const sut = new DeletePocket(accountRepo, pocketRepo);

      // Act
      const result = await sut.execute({ userId: 'user-1', pocketId: 'p1' });

      // Assert
      expect(result.id).toBe('p1');
    });
  });

  describe('Validaciones y errores', () => {
    it('lanza POCKET_NOT_FOUND cuando el bolsillo no existe', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pocketId: 'nope' }),
      ).rejects.toMatchObject({ code: 'POCKET_NOT_FOUND', statusCode: 404 });
    });

    it('lanza ACCOUNT_NOT_FOUND cuando la cuenta del bolsillo no existe', async () => {
      // Arrange
      pocketRepo = new FakePocketRepository([
        makePocket({ id: 'p1', accountId: 'acc-fantasma', amount: 100_000 }),
      ]);
      const sut = new DeletePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', pocketId: 'p1' }),
      ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
    });

    it('lanza FORBIDDEN cuando la cuenta es de otro usuario', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([makeAccount({ userId: 'dueño' })]);
      const sut = new DeletePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'intruso', pocketId: 'p1' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    });

    it('lanza ACCOUNT_NOT_OPERATIONAL cuando la cuenta está bloqueada', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([
        makeAccount({ status: AccountStatus.BLOQUEADA }),
      ]);
      const sut = new DeletePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', pocketId: 'p1' }),
      ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_OPERATIONAL', statusCode: 400 });
    });
  });
});
