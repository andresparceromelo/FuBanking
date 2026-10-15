import { describe, it, expect, beforeEach } from 'vitest';
import { TransferPocketBalance } from '../../application/use-cases/pocket/TransferPocketBalance';
import { FakeAccountRepository, FakePocketRepository, makeAccount, makePocket } from '../unit/pocket/test-doubles';
import { AccountStatus } from '../../domain/entities/Account';

/**
 * Performance de la transferencia entre bolsillos (pura lgica de negocio en memoria).
 * Patrn del ejemplo del profesor: presupuesto explcito + mediana de N repeticiones.
 */
describe('Pocket - TransferPocketBalance performance', () => {
  let accountRepo: FakeAccountRepository;
  let pocketRepo: FakePocketRepository;
  let useCase: TransferPocketBalance;

  beforeEach(async () => {
    accountRepo = new FakeAccountRepository();
    pocketRepo = new FakePocketRepository();
    useCase = new TransferPocketBalance(accountRepo as any, pocketRepo);

    // Setup de datos base
    await accountRepo.save(makeAccount({
      id: 'acc-1',
      userId: 'user-1',
      accountNumber: '12345',
      balance: 1000000,
      status: AccountStatus.ACTIVA,
    }));

    await pocketRepo.save(makePocket({
      id: 'pocket-1',
      accountId: 'acc-1',
      name: 'Viaje',
      amount: 500000
    }));

    await pocketRepo.save(makePocket({
      id: 'pocket-2',
      accountId: 'acc-1',
      name: 'Ahorro',
      amount: 100000
    }));
  });

  it('procesa transferencias entre bolsillos rpidamente (<20ms, mediana de 5)', async () => {
    // Arrange
    const durations: number[] = [];
    const input = {
      userId: 'user-1',
      fromPocketId: 'pocket-1',
      toPocketId: 'pocket-2',
      amount: 1000 // Transferencias pequeas para no vaciar el bolsillo
    };

    // Act
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      
      // Hacemos 100 transferencias por iteracin para medir mejor
      let result;
      for (let j = 0; j < 100; j++) {
        result = await useCase.execute(input);
      }
      
      durations.push(performance.now() - start);
      
      // Assert (correctitud bsica)
      expect(result).toBeDefined();
      expect(result?.fromPocket).toBeDefined();
      expect(result?.toPocket).toBeDefined();
    }

    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;

    // Assert final de los saldos para verificar que las transferencias ocurrieron
    const finalFrom = await pocketRepo.findById('pocket-1');
    const finalTo = await pocketRepo.findById('pocket-2');
    expect(finalFrom?.amount).toBe(500000 - (500 * 1000));
    expect(finalTo?.amount).toBe(100000 + (500 * 1000));

    // Assert (presupuesto para 100 ejecuciones del caso de uso)
    expect(median).toBeLessThan(20);
  });
});
