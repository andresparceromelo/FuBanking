import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteVirtualCard } from '../../../application/use-cases/card/DeleteVirtualCard';
import { InMemoryNotificationRepo, InMemoryVirtualCardRepo, buildVirtualCard } from './in-memory-repos';

describe('DeleteVirtualCard', () => {
  let cardRepo: InMemoryVirtualCardRepo;
  let notifRepo: InMemoryNotificationRepo;
  let useCase: DeleteVirtualCard;

  beforeEach(() => {
    cardRepo = new InMemoryVirtualCardRepo();
    notifRepo = new InMemoryNotificationRepo();
    useCase = new DeleteVirtualCard(cardRepo, notifRepo);
  });

  it('should delete a card and notify the user', async () => {
    const card = buildVirtualCard('user-1', 'acc-1');
    await cardRepo.save(card);

    const result = await useCase.execute({ userId: 'user-1', cardId: card.id });

    expect(result.id).toBe(card.id);
    expect(await cardRepo.findById(card.id)).toBeNull();
    const notifs = await notifRepo.findByUserId('user-1');
    expect(notifs[0].title).toContain('eliminada');
  });

  it('should reject a card from another user', async () => {
    const card = buildVirtualCard('owner-1', 'acc-1');
    await cardRepo.save(card);

    await expect(useCase.execute({ userId: 'intruder-1', cardId: card.id })).rejects.toThrow(/permiso/i);
  });

  it('should reject a missing card', async () => {
    await expect(useCase.execute({ userId: 'user-1', cardId: randomUUID() })).rejects.toThrow(/no existe/i);
  });
});
