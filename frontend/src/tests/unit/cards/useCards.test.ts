import { expect as assert } from '@assertive-ts/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCards } from '@/features/cards/hooks/useCards';
import { cardService } from '@/features/cards/services/card.service';
import type { VirtualCard } from '@/features/cards/types/card.types';

vi.mock('@/features/cards/services/card.service', () => ({
  cardService: {
    getMyCards: vi.fn(),
    createCard: vi.fn(),
    toggleLock: vi.fn(),
    revealDetails: vi.fn(),
    deleteCard: vi.fn(),
  },
}));

const getMyCards = cardService.getMyCards as unknown as ReturnType<typeof vi.fn>;
const createCard = cardService.createCard as unknown as ReturnType<typeof vi.fn>;
const toggleLock = cardService.toggleLock as unknown as ReturnType<typeof vi.fn>;
const deleteCard = cardService.deleteCard as unknown as ReturnType<typeof vi.fn>;

function card(id: string, status: VirtualCard['status'] = 'ACTIVA'): VirtualCard {
  return {
    id, userId: 'user-1', accountId: 'acc-1', cardHolderName: 'TEST USER',
    lastFour: '1234', expirationDate: '09/30', cvvMasked: '***',
    status, createdAt: '2026-08-01T00:00:00.000Z',
  } as VirtualCard;
}

describe('useCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose initial state', () => {
    const { result } = renderHook(() => useCards());

    expect(result.current.cards).toEqual([]);
    assert(result.current.isLoading).toBeFalse();
    expect(result.current.error).toBeNull();
  });

  describe('fetchCards', () => {
    it('should set cards on success', async () => {
      const cards = [card('card-1'), card('card-2', 'BLOQUEADA')];
      getMyCards.mockResolvedValue(cards);
      const { result } = renderHook(() => useCards());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchCards();
      });

      expect(returned).toEqual(cards);
      expect(result.current.cards).toEqual(cards);
      expect(result.current.error).toBeNull();
    });

    it('should fall back on failure', async () => {
      getMyCards.mockRejectedValue({});
      const { result } = renderHook(() => useCards());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.fetchCards();
      });

      expect(returned).toEqual([]);
      assert(result.current.error).toBeEqual('No se pudieron cargar las tarjetas.');
    });
  });

  describe('createCard', () => {
    it('should prepend the created card', async () => {
      getMyCards.mockResolvedValue([card('old-1')]);
      const created = card('new-1');
      createCard.mockResolvedValue(created);
      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.fetchCards();
      });

      let returned: unknown;
      await act(async () => {
        returned = await result.current.createCard('acc-1');
      });

      expect(returned).toEqual(created);
      expect(result.current.cards.map((c) => c.id)).toEqual(['new-1', 'old-1']);
      expect(createCard).toHaveBeenCalledWith('acc-1');
    });

    it('should use the server message on failure', async () => {
      createCard.mockRejectedValue({ message: 'Cuenta inválida' });
      const { result } = renderHook(() => useCards());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.createCard('bad-acc');
      });

      expect(returned).toBeNull();
      assert(result.current.error).toBeEqual('Cuenta inválida');
    });

    it('should fall back on empty message', async () => {
      createCard.mockRejectedValue({ message: '' });
      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.createCard('acc-1');
      });

      assert(result.current.error).toBeEqual('No se pudo crear la tarjeta.');
    });

    it('should forward password to cardService.createCard when provided', async () => {
      const created = card('new-1');
      createCard.mockResolvedValue(created);
      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.createCard('acc-1', 'Segura123!');
      });

      expect(createCard).toHaveBeenCalledWith('acc-1', 'Segura123!');
    });
  });

  describe('toggleLock', () => {
    it('should replace only the toggled card', async () => {
      const before = [card('card-1'), card('card-2')];
      getMyCards.mockResolvedValue(before);
      const locked = card('card-1', 'BLOQUEADA');
      toggleLock.mockResolvedValue(locked);
      const { result } = renderHook(() => useCards());

      await act(async () => {
        await result.current.fetchCards();
      });
      await act(async () => {
        await result.current.toggleLock('card-1');
      });

      expect(result.current.cards).toEqual([locked, card('card-2')]);
      expect(toggleLock).toHaveBeenCalledWith('card-1');
    });

    it('should fall back on string errors', async () => {
      toggleLock.mockRejectedValue('boom');
      const { result } = renderHook(() => useCards());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.toggleLock('card-1');
      });

      expect(returned).toBeNull();
      assert(result.current.error).toBeEqual('No se pudo actualizar la tarjeta.');
    });
  });

  describe('deleteCard', () => {
    it('should remove the deleted card', async () => {
      // Arrange
      const before = [card('card-1'), card('card-2')];
      getMyCards.mockResolvedValue(before);
      deleteCard.mockResolvedValue(card('card-1'));
      const { result } = renderHook(() => useCards());
      // Act
      await act(async () => {
        await result.current.fetchCards();
      });
      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.deleteCard('card-1');
      });
      // Assert
      expect(deleteCard).toHaveBeenCalledWith('card-1');
      expect(result.current.cards).toEqual([card('card-2')]);
      expect(returned).toEqual(card('card-1'));
    });

    it('should fall back on failure', async () => {
      // Arrange
      deleteCard.mockRejectedValue('boom');
      const { result } = renderHook(() => useCards());
      // Act
      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.deleteCard('card-1');
      });
      // Assert
      expect(returned).toBeNull();
      expect(result.current.error).toBe('No se pudo eliminar la tarjeta.');
    });
  });
});
