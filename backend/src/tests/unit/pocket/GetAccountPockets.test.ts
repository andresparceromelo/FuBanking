/**
 * ============================================================================
 *  Pruebas unitarias — GetAccountPockets ("Consultar bolsillos de la cuenta")
 * ----------------------------------------------------------------------------
 *  Patrón AAA + principios FIRST + aserciones fluidas Chai BDD
 *  (ver detalle en CreatePocket.test.ts).
 *  Dobles demostrados aquí: FAKE y STUB.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { GetAccountPockets } from '../../../application/use-cases/pocket/GetAccountPockets';
import {
  FakeAccountRepository,
  FakePocketRepository,
  StubAccountRepository,
  makeAccount,
  makePocket,
} from './test-doubles';

describe('GetAccountPockets.execute', () => {
  describe('Camino feliz', () => {
    it('devuelve la lista pública de bolsillos de la cuenta (STUB de cuenta)', async () => {
      // Arrange — la cuenta la provee un STUB; los bolsillos, un FAKE con 2 registros.
      const stubAccountRepo = new StubAccountRepository(makeAccount());
      const pocketRepo = new FakePocketRepository([
        makePocket({ id: 'p1', accountId: 'acc-1', name: 'A', amount: 10_000 }),
        makePocket({ id: 'p2', accountId: 'acc-1', name: 'B', amount: 20_000 }),
      ]);
      const useCase = new GetAccountPockets(stubAccountRepo, pocketRepo);

      // Act
      const result = await useCase.execute({ userId: 'user-1', accountId: 'acc-1' });

      // Assert
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result.map((p) => p.name)).to.deep.equal(['A', 'B']);
      expect(result[0].createdAt).to.be.a('string'); // representación pública (ISO)
    });

    it('devuelve una lista vacía cuando la cuenta no tiene bolsillos', async () => {
      // Arrange
      const accountRepo = new FakeAccountRepository([makeAccount()]);
      const pocketRepo = new FakePocketRepository();
      const useCase = new GetAccountPockets(accountRepo, pocketRepo);

      // Act
      const result = await useCase.execute({ userId: 'user-1', accountId: 'acc-1' });

      // Assert
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('Validaciones y errores', () => {
    it('lanza ACCOUNT_NOT_FOUND cuando la cuenta no existe', async () => {
      // Arrange
      const accountRepo = new FakeAccountRepository([]);
      const pocketRepo = new FakePocketRepository();
      const useCase = new GetAccountPockets(accountRepo, pocketRepo);

      // Act + Assert
      await expect(
        useCase.execute({ userId: 'user-1', accountId: 'inexistente' }),
      ).rejects.to.include({ code: 'ACCOUNT_NOT_FOUND', statusCode: 404 });
    });

    it('lanza FORBIDDEN cuando la cuenta es de otro usuario', async () => {
      // Arrange
      const accountRepo = new FakeAccountRepository([makeAccount({ userId: 'dueño' })]);
      const pocketRepo = new FakePocketRepository();
      const useCase = new GetAccountPockets(accountRepo, pocketRepo);

      // Act + Assert
      await expect(
        useCase.execute({ userId: 'intruso', accountId: 'acc-1' }),
      ).rejects.to.include({ code: 'FORBIDDEN', statusCode: 403 });
    });
  });
});
