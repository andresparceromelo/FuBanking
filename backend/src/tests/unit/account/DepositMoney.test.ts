/**
 * ============================================================================
 *  Pruebas unitarias — DepositMoney ("Depositar dinero", módulo Cuentas)
 * ----------------------------------------------------------------------------
 *  Sexta funcionalidad del alcance de Bolsillos: el depósito aumenta el saldo
 *  disponible que luego se aparta en bolsillos.
 *  Patrón AAA + principios FIRST + aserciones fluidas Chai BDD
 *  (ver detalle en unit/pocket/CreatePocket.test.ts).
 *  Dobles demostrados aquí: FAKE, STUB, SPY, MOCK y DUMMY.
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DepositMoney } from '../../../application/use-cases/account/DepositMoney';
import { Account, AccountStatus } from '../../../domain/entities/Account';
import { NotificationType } from '../../../domain/entities/Notification';
import {
  FakeAccountRepository,
  FakeNotificationRepository,
  StubAccountRepository,
  SpyNotificationRepository,
  DummyNotificationRepository,
  makeMockAccountRepository,
  makeAccount,
} from '../pocket/test-doubles';

describe('DepositMoney.execute', () => {
  let accountRepo: FakeAccountRepository;
  let notifRepo: FakeNotificationRepository;
  let useCase: DepositMoney;

  beforeEach(() => {
    // Arrange base: cuenta ACTIVA "acc-1" (BA0000000001) con saldo 1.000.000.
    accountRepo = new FakeAccountRepository([makeAccount({ balance: 1_000_000 })]);
    notifRepo = new FakeNotificationRepository();
    useCase = new DepositMoney(accountRepo, notifRepo);
  });

  // ── Camino feliz (FAKE) ────────────────────────────────────────────────────
  describe('Camino feliz', () => {
    it('suma el monto al saldo de la cuenta y lo persiste', async () => {
      // Arrange
      const dto = { userId: 'user-1', accountId: 'acc-1', amount: 250_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).to.be.an.instanceOf(Account).that.has.property('balance', 1_250_000);
      expect(await accountRepo.findById('acc-1')).to.have.property('balance', 1_250_000);
    });

    it('conserva la identidad de la cuenta (id, titular, número, estado)', async () => {
      // Act
      const result = await useCase.execute({ userId: 'user-1', accountId: 'acc-1', amount: 1_000 });

      // Assert
      expect(result).to.include({
        id: 'acc-1',
        userId: 'user-1',
        accountNumber: 'BA0000000001',
        status: AccountStatus.ACTIVA,
      });
    });

    it('acepta montos con decimales', async () => {
      // Act
      const result = await useCase.execute({ userId: 'user-1', accountId: 'acc-1', amount: 1_500.5 });

      // Assert
      expect(result).to.have.property('balance', 1_001_500.5);
    });
  });

  // ── Verificación de comportamiento (MOCK) ──────────────────────────────────
  describe('Interacción con el repositorio (MOCK)', () => {
    it('llama a updateBalance una sola vez con el saldo nuevo', async () => {
      // Arrange — MOCK programado: la cuenta existe y updateBalance responde.
      const mockAccountRepo = makeMockAccountRepository();
      const account = makeAccount({ balance: 1_000_000 });
      mockAccountRepo.findById.mockResolvedValue(account);
      mockAccountRepo.updateBalance.mockResolvedValue(makeAccount({ balance: 1_100_000 }));
      const sut = new DepositMoney(mockAccountRepo as any);

      // Act
      await sut.execute({ userId: 'user-1', accountId: 'acc-1', amount: 100_000 });

      // Assert — se VERIFICAN las expectativas sobre las llamadas.
      expect(mockAccountRepo.findById).to.have.been.calledOnceWith('acc-1');
      expect(mockAccountRepo.updateBalance).to.have.been.calledOnceWith('acc-1', 1_100_000);
    });
  });

  // ── Registro de interacciones (SPY) ────────────────────────────────────────
  describe('Notificación al usuario (SPY)', () => {
    it('emite una notificación "Depósito realizado" con los últimos 4 dígitos de la cuenta', async () => {
      // Arrange
      const spyNotif = new SpyNotificationRepository();
      const sut = new DepositMoney(accountRepo, spyNotif);

      // Act
      await sut.execute({ userId: 'user-1', accountId: 'acc-1', amount: 100_000 });

      // Assert
      expect(spyNotif.saveCallCount).to.equal(1);
      expect(spyNotif.savedNotifications[0])
        .to.include({ userId: 'user-1', title: 'Depósito realizado', type: NotificationType.SISTEMA, read: false })
        .and.to.have.property('message').that.includes('****0001');
    });

    it('funciona sin repositorio de notificaciones', async () => {
      // Arrange
      const sut = new DepositMoney(accountRepo); // sin notificaciones

      // Act
      const result = await sut.execute({ userId: 'user-1', accountId: 'acc-1', amount: 5_000 });

      // Assert
      expect(result).to.have.property('balance', 1_005_000);
    });
  });

  // ── Caminos de error ───────────────────────────────────────────────────────
  describe('Validaciones y errores', () => {
    it('rechaza un monto cero sin consultar la cuenta ni notificar (MOCK + DUMMY)', async () => {
      // Arrange — DUMMY: si el caso de uso intentara notificar, la prueba fallaría.
      const mockAccountRepo = makeMockAccountRepository();
      const sut = new DepositMoney(mockAccountRepo as any, new DummyNotificationRepository());

      // Act + Assert
      await expect(sut.execute({ userId: 'user-1', accountId: 'acc-1', amount: 0 }))
        .rejects.to.include({ code: 'INVALID_AMOUNT', statusCode: 400 });
      expect(mockAccountRepo.findById).to.not.have.been.called;
      expect(mockAccountRepo.updateBalance).to.not.have.been.called;
    });

    it('rechaza un monto negativo', async () => {
      await expect(useCase.execute({ userId: 'user-1', accountId: 'acc-1', amount: -1 }))
        .rejects.to.include({ code: 'INVALID_AMOUNT', statusCode: 400 });
    });

    it('rechaza un monto NaN (lo que llega si el body no trae un número)', async () => {
      await expect(useCase.execute({ userId: 'user-1', accountId: 'acc-1', amount: Number.NaN }))
        .rejects.to.include({ code: 'INVALID_AMOUNT', statusCode: 400 });
    });

    it('lanza ACCOUNT_NOT_FOUND cuando la cuenta no existe', async () => {
      await expect(useCase.execute({ userId: 'user-1', accountId: 'inexistente', amount: 1_000 }))
        .rejects.to.include({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
    });

    it('lanza FORBIDDEN cuando la cuenta pertenece a otro usuario y no cambia el saldo', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([makeAccount({ userId: 'dueño', balance: 1_000_000 })]);
      const sut = new DepositMoney(accountRepo, notifRepo);

      // Act + Assert
      await expect(sut.execute({ userId: 'intruso', accountId: 'acc-1', amount: 1_000 }))
        .rejects.to.include({ code: 'FORBIDDEN', statusCode: 403 });
      expect(await accountRepo.findById('acc-1')).to.have.property('balance', 1_000_000);
    });

    it('lanza ACCOUNT_INACTIVE cuando la cuenta está cerrada (STUB)', async () => {
      // Arrange — STUB con respuesta enlatada: una cuenta CERRADA.
      const stubAccountRepo = new StubAccountRepository(makeAccount({ status: AccountStatus.CERRADA }));
      const sut = new DepositMoney(stubAccountRepo, notifRepo);

      // Act + Assert
      await expect(sut.execute({ userId: 'user-1', accountId: 'acc-1', amount: 1_000 }))
        .rejects.to.include({ code: 'ACCOUNT_INACTIVE', statusCode: 400 });
    });
  });
});
