import { describe, it, expect, beforeEach } from 'vitest';
import { GetUserCards } from '../../../application/use-cases/card/GetUserCards';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import { InMemoryVirtualCardRepo, buildVirtualCard } from './in-memory-repos';

describe('GetUserCards', () => {
  let cardRepo: InMemoryVirtualCardRepo;
  let useCase: GetUserCards;

  beforeEach(() => {
    cardRepo = new InMemoryVirtualCardRepo();
    useCase = new GetUserCards(cardRepo);
  });

  it('should return an empty array without cards', async () => {
    await expect(useCase.execute('user-1')).resolves.toEqual([]);
  });

  it('should return only the user cards mapped to public DTOs', async () => {
    await cardRepo.save(buildVirtualCard('user-1', 'acc-1'));
    await cardRepo.save(buildVirtualCard('user-1', 'acc-1', { status: CardStatus.BLOQUEADA }));
    await cardRepo.save(buildVirtualCard('user-2', 'acc-2'));

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(2);
    for (const dto of result) {
      expect(dto.cvvMasked).toBe('***');
      expect(dto).not.toHaveProperty('cardNumber');
    }
  });

  it('should propagate repository errors', async () => {
    cardRepo.findByUserId = async () => {
      throw new Error('DB down');
    };

    await expect(useCase.execute('user-1')).rejects.toThrow('DB down');
  });
});
