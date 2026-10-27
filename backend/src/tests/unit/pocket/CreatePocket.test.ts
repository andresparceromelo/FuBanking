/**
 * ============================================================================
 *  Pruebas unitarias — CreatePocket (caso de uso "Crear bolsillo")
 * ----------------------------------------------------------------------------
 *  Patrón AAA:   cada prueba está dividida en Arrange / Act / Assert.
 *  Principios FIRST:
 *   - Fast:        solo memoria (fakes/mocks), sin BD ni red.
 *   - Independent: cada test arma sus propios dobles en `beforeEach`/local.
 *   - Repeatable:  fechas y datos fijos → mismo resultado siempre.
 *   - Self-validating: termina en expect(); pasa o falla sin inspección manual.
 *   - Timely:      acompaña al código de producción de Bolsillos.
 *
 *  Aserciones fluidas: estilo Chai BDD que Vitest trae integrado
 *  (expect(x).to.have.property(...).that...). Cada aserción se lee como una
 *  frase y encadena varias condiciones sobre el mismo objeto.
 *
 *  Dobles demostrados aquí: FAKE, MOCK, SPY y DUMMY.
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePocket } from '../../../application/use-cases/pocket/CreatePocket';
import { AccountStatus } from '../../../domain/entities/Account';
import {
  FakeAccountRepository,
  FakePocketRepository,
  FakeNotificationRepository,
  SpyNotificationRepository,
  DummyNotificationRepository,
  makeMockAccountRepository,
  makeMockPocketRepository,
  makeAccount,
  makePocket,
} from './test-doubles';

describe('CreatePocket.execute', () => {
  let accountRepo: FakeAccountRepository;
  let pocketRepo: FakePocketRepository;
  let notifRepo: FakeNotificationRepository;
  let useCase: CreatePocket;

  beforeEach(() => {
    // Arrange base: cuenta ACTIVA con saldo 1.000.000 y sin bolsillos previos.
    accountRepo = new FakeAccountRepository([makeAccount({ balance: 1_000_000 })]);
    pocketRepo = new FakePocketRepository();
    notifRepo = new FakeNotificationRepository();
    useCase = new CreatePocket(accountRepo, pocketRepo, notifRepo);
  });

  // ── Camino feliz (FAKE) ────────────────────────────────────────────────────
  describe('Camino feliz', () => {
    it('crea el bolsillo y descuenta el monto del saldo de la cuenta', async () => {
      // Arrange
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'Viaje', amount: 200_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).to.include({ name: 'Viaje', amount: 200_000 });
      const account = await accountRepo.findById('acc-1');
      expect(account).to.have.property('balance', 800_000); // 1.000.000 − 200.000
    });

    it('recorta los espacios del nombre al crear el bolsillo', async () => {
      // Arrange
      const dto = { userId: 'user-1', accountId: 'acc-1', name: '   Casa   ', amount: 50_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).to.have.property('name', 'Casa');
    });
  });

  // ── Verificación de comportamiento (MOCK) ──────────────────────────────────
  describe('Interacción con los repositorios (MOCK)', () => {
    it('llama a updateBalance con el saldo correcto y guarda el bolsillo una vez', async () => {
      // Arrange — repositorios MOCK con vi.fn(); se PROGRAMAN las respuestas.
      const mockAccountRepo = makeMockAccountRepository();
      const mockPocketRepo = makeMockPocketRepository();
      const account = makeAccount({ balance: 500_000 });
      mockAccountRepo.findById.mockResolvedValue(account);
      mockAccountRepo.updateBalance.mockResolvedValue(account);
      mockPocketRepo.getTotalAmountByAccountId.mockResolvedValue(0);
      mockPocketRepo.save.mockImplementation((p) => Promise.resolve(p));

      const sut = new CreatePocket(mockAccountRepo as any, mockPocketRepo as any);
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'Meta', amount: 120_000 };

      // Act
      await sut.execute(dto);

      // Assert — se VERIFICAN las expectativas sobre las llamadas.
      expect(mockAccountRepo.findById).to.have.been.calledWith('acc-1');
      expect(mockAccountRepo.updateBalance).to.have.been.calledWith('acc-1', 380_000);
      expect(mockPocketRepo.save).to.have.been.calledOnce;
    });
  });

  // ── Registro de interacciones (SPY) ────────────────────────────────────────
  describe('Notificación al usuario (SPY)', () => {
    it('emite exactamente una notificación de "Bolsillo creado"', async () => {
      // Arrange — el repositorio de notificaciones es un SPY que registra llamadas.
      const spyNotif = new SpyNotificationRepository();
      const sut = new CreatePocket(accountRepo, pocketRepo, spyNotif);
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'Regalo', amount: 10_000 };

      // Act
      await sut.execute(dto);

      // Assert — se inspecciona el registro del spy.
      expect(spyNotif.saveCallCount).to.equal(1);
      expect(spyNotif.savedNotifications[0])
        .to.include({ title: 'Bolsillo creado' })
        .and.to.have.property('message').that.includes('Regalo');
    });

    it('no falla cuando no se inyecta repositorio de notificaciones', async () => {
      // Arrange
      const sut = new CreatePocket(accountRepo, pocketRepo); // sin notificaciones
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'Sin notif', amount: 1_000 };

      // Act
      const result = await sut.execute(dto);

      // Assert
      expect(result).to.have.property('name', 'Sin notif');
    });
  });

  // ── Caminos de error ───────────────────────────────────────────────────────
  describe('Validaciones y errores', () => {
    it('rechaza montos negativos y NO emite notificación (DUMMY)', async () => {
      // Arrange — DUMMY: si el caso de uso intentara notificar, la prueba fallaría.
      const dummyNotif = new DummyNotificationRepository();
      const sut = new CreatePocket(accountRepo, pocketRepo, dummyNotif);
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'Malo', amount: -5 };

      // Act + Assert
      await expect(sut.execute(dto)).rejects.to.include({
        code: 'INVALID_POCKET_AMOUNT',
        statusCode: 400,
      });
    });

    it.each([
      ['vacío', ''],
      ['de solo espacios', '   '],
    ])('rechaza un nombre %s sin tocar el saldo ni notificar (DUMMY)', async (_label, name) => {
      // Arrange — DUMMY: si el caso de uso intentara notificar, la prueba fallaría.
      const sut = new CreatePocket(accountRepo, pocketRepo, new DummyNotificationRepository());
      const dto = { userId: 'user-1', accountId: 'acc-1', name, amount: 100_000 };

      // Act + Assert
      await expect(sut.execute(dto)).rejects.to.include({
        code: 'INVALID_POCKET_NAME',
        statusCode: 400,
      });
      expect(await accountRepo.findById('acc-1')).to.have.property('balance', 1_000_000);
      expect(await pocketRepo.findByAccountId('acc-1')).to.be.empty;
    });

    it('lanza ACCOUNT_NOT_FOUND cuando la cuenta no existe', async () => {
      // Arrange
      const dto = { userId: 'user-1', accountId: 'inexistente', name: 'X', amount: 1_000 };

      // Act + Assert
      await expect(useCase.execute(dto)).rejects.to.include({
        code: 'ACCOUNT_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('lanza FORBIDDEN cuando la cuenta pertenece a otro usuario', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([makeAccount({ userId: 'dueño' })]);
      const sut = new CreatePocket(accountRepo, pocketRepo, notifRepo);
      const dto = { userId: 'intruso', accountId: 'acc-1', name: 'X', amount: 1_000 };

      // Act + Assert
      await expect(sut.execute(dto)).rejects.to.include({
        code: 'FORBIDDEN',
        statusCode: 403,
      });
    });

    it('lanza ACCOUNT_NOT_OPERATIONAL cuando la cuenta está bloqueada', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([
        makeAccount({ status: AccountStatus.BLOQUEADA }),
      ]);
      const sut = new CreatePocket(accountRepo, pocketRepo, notifRepo);
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'X', amount: 1_000 };

      // Act + Assert
      await expect(sut.execute(dto)).rejects.to.include({
        code: 'ACCOUNT_NOT_OPERATIONAL',
        statusCode: 400,
      });
    });

    it('lanza INSUFFICIENT_AVAILABLE_BALANCE cuando no hay saldo disponible', async () => {
      // Arrange — saldo 100.000, ya hay 100.000 reservados en otro bolsillo.
      accountRepo = new FakeAccountRepository([makeAccount({ balance: 100_000 })]);
      pocketRepo = new FakePocketRepository([makePocket({ id: 'p0', amount: 100_000 })]);
      const sut = new CreatePocket(accountRepo, pocketRepo, notifRepo);
      const dto = { userId: 'user-1', accountId: 'acc-1', name: 'X', amount: 50_000 };

      // Act + Assert
      await expect(sut.execute(dto)).rejects.to.include({
        code: 'INSUFFICIENT_AVAILABLE_BALANCE',
        statusCode: 400,
      });
    });
  });
});
