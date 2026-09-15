/**
 * ============================================================================
 *  Pruebas unitarias — UpdatePocket (caso de uso "Actualizar bolsillo")
 * ----------------------------------------------------------------------------
 *  Es el caso de uso de mayor complejidad del módulo (candidato a refactor).
 *  Patrón AAA + principios FIRST (ver detalle en CreatePocket.test.ts).
 *  Dobles demostrados aquí: FAKE y STUB.
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UpdatePocket } from '../../../application/use-cases/pocket/UpdatePocket';
import { AccountStatus } from '../../../domain/entities/Account';
import {
  FakeAccountRepository,
  FakePocketRepository,
  FakeNotificationRepository,
  StubAccountRepository,
  makeAccount,
  makePocket,
} from './test-doubles';

describe('UpdatePocket.execute', () => {
  let accountRepo: FakeAccountRepository;
  let pocketRepo: FakePocketRepository;
  let notifRepo: FakeNotificationRepository;
  let useCase: UpdatePocket;

  beforeEach(() => {
    // Arrange base: cuenta con saldo 1.000.000 y un bolsillo "p1" de 100.000.
    accountRepo = new FakeAccountRepository([makeAccount({ balance: 1_000_000 })]);
    pocketRepo = new FakePocketRepository([
      makePocket({ id: 'p1', accountId: 'acc-1', name: 'Ahorros viaje', amount: 100_000 }),
    ]);
    notifRepo = new FakeNotificationRepository();
    useCase = new UpdatePocket(accountRepo, pocketRepo, notifRepo);
  });

  // ── Camino feliz ────────────────────────────────────────────────────────────
  describe('Camino feliz', () => {
    it('actualiza solo el nombre sin tocar el saldo (STUB de cuenta)', async () => {
      // Arrange — la cuenta la provee un STUB con respuesta enlatada.
      const stubAccountRepo = new StubAccountRepository(makeAccount({ balance: 1_000_000 }));
      const sut = new UpdatePocket(stubAccountRepo, pocketRepo, notifRepo);
      const dto = { userId: 'user-1', pocketId: 'p1', name: 'Vacaciones' };

      // Act
      const result = await sut.execute(dto);

      // Assert
      expect(result.name).toBe('Vacaciones');
      expect(result.amount).toBe(100_000);
    });

    it('aumenta el monto y descuenta la diferencia del saldo', async () => {
      // Arrange
      const dto = { userId: 'user-1', pocketId: 'p1', amount: 300_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.amount).toBe(300_000);
      const account = await accountRepo.findById('acc-1');
      expect(account?.balance).toBe(800_000); // 1.000.000 − (300.000 − 100.000)
    });

    it('reduce el monto y devuelve la diferencia al saldo', async () => {
      // Arrange
      const dto = { userId: 'user-1', pocketId: 'p1', amount: 40_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.amount).toBe(40_000);
      const account = await accountRepo.findById('acc-1');
      expect(account?.balance).toBe(1_060_000); // 1.000.000 + (100.000 − 40.000)
    });

    it('actualiza nombre y monto a la vez', async () => {
      // Arrange
      const dto = { userId: 'user-1', pocketId: 'p1', name: 'Mixto', amount: 150_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.name).toBe('Mixto');
      expect(result.amount).toBe(150_000);
    });

    it('no cambia el saldo cuando el monto enviado es igual al actual', async () => {
      // Arrange
      const dto = { userId: 'user-1', pocketId: 'p1', amount: 100_000 };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.amount).toBe(100_000);
      const account = await accountRepo.findById('acc-1');
      expect(account?.balance).toBe(1_000_000); // sin cambios
    });

    it('no renombra cuando el nombre enviado es igual al actual', async () => {
      // Arrange
      const dto = { userId: 'user-1', pocketId: 'p1', name: 'Ahorros viaje' };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.name).toBe('Ahorros viaje');
    });

    it('funciona sin repositorio de notificaciones', async () => {
      // Arrange
      const sut = new UpdatePocket(accountRepo, pocketRepo); // sin notificaciones

      // Act
      const result = await sut.execute({ userId: 'user-1', pocketId: 'p1', name: 'Solo' });

      // Assert
      expect(result.name).toBe('Solo');
    });
  });

  // ── Caminos de error ─────────────────────────────────────────────────────────
  describe('Validaciones y errores', () => {
    it('rechaza un nombre vacío o de solo espacios', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pocketId: 'p1', name: '   ' }),
      ).rejects.toMatchObject({ code: 'INVALID_POCKET_NAME', statusCode: 400 });
    });

    it('rechaza un monto negativo', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pocketId: 'p1', amount: -10 }),
      ).rejects.toMatchObject({ code: 'INVALID_POCKET_AMOUNT', statusCode: 400 });
    });

    it('lanza POCKET_NOT_FOUND cuando el bolsillo no existe', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pocketId: 'nope', name: 'X' }),
      ).rejects.toMatchObject({ code: 'POCKET_NOT_FOUND', statusCode: 404 });
    });

    it('lanza ACCOUNT_NOT_FOUND cuando la cuenta del bolsillo no existe', async () => {
      // Arrange — bolsillo huérfano que apunta a una cuenta inexistente.
      pocketRepo = new FakePocketRepository([
        makePocket({ id: 'p1', accountId: 'acc-fantasma', amount: 100_000 }),
      ]);
      const sut = new UpdatePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', pocketId: 'p1', name: 'X' }),
      ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
    });

    it('lanza FORBIDDEN cuando la cuenta es de otro usuario', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([makeAccount({ userId: 'dueño' })]);
      const sut = new UpdatePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'intruso', pocketId: 'p1', name: 'X' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    });

    it('lanza ACCOUNT_NOT_OPERATIONAL cuando la cuenta está bloqueada', async () => {
      // Arrange
      accountRepo = new FakeAccountRepository([
        makeAccount({ status: AccountStatus.BLOQUEADA }),
      ]);
      const sut = new UpdatePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', pocketId: 'p1', name: 'X' }),
      ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_OPERATIONAL', statusCode: 400 });
    });

    it('lanza INSUFFICIENT_AVAILABLE_BALANCE cuando el nuevo monto excede el disponible', async () => {
      // Arrange — saldo 100.000; el bolsillo p1 vale 100.000; se pide subirlo a 500.000.
      accountRepo = new FakeAccountRepository([makeAccount({ balance: 100_000 })]);
      const sut = new UpdatePocket(accountRepo, pocketRepo, notifRepo);

      await expect(
        sut.execute({ userId: 'user-1', pocketId: 'p1', amount: 500_000 }),
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_AVAILABLE_BALANCE', statusCode: 400 });
    });

    it('lanza NO_CHANGES_PROVIDED cuando no se envía ni nombre ni monto', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pocketId: 'p1' }),
      ).rejects.toMatchObject({ code: 'NO_CHANGES_PROVIDED', statusCode: 400 });
    });
  });
});
