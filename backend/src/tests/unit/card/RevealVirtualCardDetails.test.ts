import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { RevealVirtualCardDetails } from '../../../application/use-cases/card/RevealVirtualCardDetails';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import { InMemoryVirtualCardRepo, buildVirtualCard } from './in-memory-repos';

describe('RevealVirtualCardDetails', () => {
  let cardRepo: InMemoryVirtualCardRepo;
  let useCase: RevealVirtualCardDetails;

  beforeEach(() => {
    cardRepo = new InMemoryVirtualCardRepo();
    useCase = new RevealVirtualCardDetails(cardRepo);
  });

  it('should reveal raw cardNumber and cvv to the owner', async () => {
    const card = buildVirtualCard('user-1', 'acc-1');
    await cardRepo.save(card);

    const result = await useCase.execute({ userId: 'user-1', cardId: card.id });

    expect(result).toEqual({ cardNumber: card.cardNumber, cvv: card.cvv });
  });

  it('should throw CARD_NOT_FOUND for a missing card', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', cardId: randomUUID() }),
    ).rejects.toThrow(/no existe/i);
  });

  it('should throw FORBIDDEN for another user card', async () => {
    const card = buildVirtualCard('owner-1', 'acc-1');
    await cardRepo.save(card);

    await expect(
      useCase.execute({ userId: 'intruder-1', cardId: card.id }),
    ).rejects.toThrow(/permiso/i);
  });

  it('should throw CARD_CANCELLED for a cancelled card', async () => {
    const card = buildVirtualCard('user-1', 'acc-1', { status: CardStatus.CANCELADA });
    await cardRepo.save(card);

    await expect(
      useCase.execute({ userId: 'user-1', cardId: card.id }),
    ).rejects.toThrow(/cancelada/i);
  });
});
