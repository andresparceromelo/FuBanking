import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { CreateVirtualCard } from '../../../application/use-cases/card/CreateVirtualCard';
import { ToggleCardLock } from '../../../application/use-cases/card/ToggleCardLock';
import { RevealVirtualCardDetails } from '../../../application/use-cases/card/RevealVirtualCardDetails';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import {
  InMemoryVirtualCardRepo,
  InMemoryAccountRepo,
  InMemoryUserRepo,
  InMemoryNotificationRepo,
  createTestUser,
  createTestAccount,
  buildVirtualCard,
} from './in-memory-repos';

/**
 * D-01..D-05 — Inyección de fallos sobre el dominio real de tarjetas
 * (débito/prepago: sin cupo, sin deuda, sin estados ajenos a ACTIVA/BLOQUEADA/CANCELADA).
 */
describe('Tarjetas — Inyección de fallos (D-01..D-05)', () => {
  let cardRepo: InMemoryVirtualCardRepo;
  let accountRepo: InMemoryAccountRepo;
  let userRepo: InMemoryUserRepo;
  let notifRepo: InMemoryNotificationRepo;

  beforeEach(() => {
    cardRepo = new InMemoryVirtualCardRepo();
    accountRepo = new InMemoryAccountRepo();
    userRepo = new InMemoryUserRepo();
    notifRepo = new InMemoryNotificationRepo();
  });

  it('D-01 [Crear]: debe rechazar si la cuenta no existe', async () => {
    const user = createTestUser();
    await userRepo.save(user);
    const useCase = new CreateVirtualCard(cardRepo, accountRepo, userRepo, notifRepo);

    await expect(
      useCase.execute({ userId: user.id, accountId: randomUUID() }),
    ).rejects.toThrow(/no existe/i);
  });

  it('D-02 [Crear]: debe rechazar si la cuenta es de otro usuario', async () => {
    const owner = createTestUser();
    const intruder = createTestUser({ email: 'i@x.co', document: '1112223334' });
    await userRepo.save(owner);
    await userRepo.save(intruder);
    await accountRepo.save(createTestAccount(owner.id));
    const useCase = new CreateVirtualCard(cardRepo, accountRepo, userRepo, notifRepo);
    const account = (await accountRepo.findByUserId(owner.id))[0];

    await expect(
      useCase.execute({ userId: intruder.id, accountId: account.id }),
    ).rejects.toThrow(/permiso/i);
  });

  it('D-03 [Revelar]: debe rechazar datos de una tarjeta cancelada', async () => {
    const card = buildVirtualCard('user-1', 'acc-1', { status: CardStatus.CANCELADA });
    await cardRepo.save(card);
    const useCase = new RevealVirtualCardDetails(cardRepo);

    await expect(
      useCase.execute({ userId: 'user-1', cardId: card.id }),
    ).rejects.toThrow(/cancelada/i);
  });

  it('D-04 [Bloqueo]: debe rechazar el toggle de una tarjeta cancelada', async () => {
    const card = buildVirtualCard('user-1', 'acc-1', { status: CardStatus.CANCELADA });
    await cardRepo.save(card);
    const useCase = new ToggleCardLock(cardRepo, notifRepo);

    await expect(
      useCase.execute({ userId: 'user-1', cardId: card.id }),
    ).rejects.toThrow(/cancelada/i);
  });

  it('D-05 [Revelar]: debe rechazar a un usuario ajeno aunque la tarjeta exista', async () => {
    const card = buildVirtualCard('owner-1', 'acc-1');
    await cardRepo.save(card);
    const useCase = new RevealVirtualCardDetails(cardRepo);

    await expect(
      useCase.execute({ userId: 'otro-1', cardId: card.id }),
    ).rejects.toThrow(/permiso/i);
  });
});
