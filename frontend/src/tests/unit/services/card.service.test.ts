import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/shared/services/api.client';
import { cardService } from '@/features/cards/services/card.service';

vi.mock('@/shared/services/api.client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}));

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as unknown as ReturnType<typeof vi.fn>;

describe('cardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should GET /cards/me and return the list', async () => {
    const cards = [{ id: 'card-1', status: 'ACTIVA' }];
    get.mockResolvedValue({ data: cards });

    const result = await cardService.getMyCards();

    expect(get).toHaveBeenCalledWith('/cards/me');
    expect(result).toEqual(cards);
  });

  it('should POST /cards with the accountId', async () => {
    const card = { id: 'card-1', status: 'ACTIVA' };
    post.mockResolvedValue({ data: card });

    const result = await cardService.createCard('acc-1');

    expect(post).toHaveBeenCalledWith('/cards', { accountId: 'acc-1' });
    expect(result).toEqual(card);
  });

  it('should PATCH /cards/:id/toggle-lock', async () => {
    const card = { id: 'card-1', status: 'BLOQUEADA' };
    patch.mockResolvedValue({ data: card });

    const result = await cardService.toggleLock('card-1');

    expect(patch).toHaveBeenCalledWith('/cards/card-1/toggle-lock');
    expect(result).toEqual(card);
  });

  it('should GET /cards/:id/reveal', async () => {
    const details = { cardNumber: '4532000000001234', cvv: '123' };
    get.mockResolvedValue({ data: details });

    const result = await cardService.revealDetails('card-1');

    expect(get).toHaveBeenCalledWith('/cards/card-1/reveal');
    expect(result).toEqual(details);
  });

  it('should propagate errors', async () => {
    get.mockRejectedValue({ code: 'CARD_NOT_FOUND', message: 'No existe' });

    await expect(cardService.getMyCards()).rejects.toEqual({
      code: 'CARD_NOT_FOUND',
      message: 'No existe',
    });
  });
});
