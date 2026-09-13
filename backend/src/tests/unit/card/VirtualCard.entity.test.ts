import { describe, it, expect } from 'vitest';
import { VirtualCard, CardStatus } from '../../../domain/entities/VirtualCard';
import { buildVirtualCard } from './in-memory-repos';

describe('VirtualCard — Entity', () => {
  describe('generateNumber()', () => {
    it('should generate a 16-digit number with Visa prefix and matching lastFour', () => {
      const gen = VirtualCard.generateNumber();

      expect(gen.cardNumber).toMatch(/^4532\d{12}$/);
      expect(gen.cardNumber).toHaveLength(16);
      expect(gen.lastFour).toBe(gen.cardNumber.slice(-4));
    });

    it('should generate a 3-digit cvv and MM/YY expiration 4 years ahead', () => {
      const gen = VirtualCard.generateNumber();
      const now = new Date();
      const expMonth = String(now.getMonth() + 1).padStart(2, '0');
      const expYear = String((now.getFullYear() + 4) % 100).padStart(2, '0');

      expect(gen.cvv).toMatch(/^\d{3}$/);
      expect(Number(gen.cvv)).toBeGreaterThanOrEqual(100);
      expect(gen.expirationDate).toBe(`${expMonth}/${expYear}`);
    });
  });

  describe('toggleLock()', () => {
    it('should flip ACTIVA to BLOQUEADA and back', () => {
      const card = buildVirtualCard('user-1', 'acc-1');

      expect(card.status).toBe(CardStatus.ACTIVA);
      card.toggleLock();
      expect(card.status).toBe(CardStatus.BLOQUEADA);
      card.toggleLock();
      expect(card.status).toBe(CardStatus.ACTIVA);
    });

    it('should throw CARD_CANCELLED on a cancelled card', () => {
      const card = buildVirtualCard('user-1', 'acc-1', { status: CardStatus.CANCELADA });

      expect(() => card.toggleLock()).toThrow(/cancelada/i);
    });
  });

  describe('toPublic()', () => {
    it('should mask cvv, omit cardNumber and serialize the date', () => {
      const card = buildVirtualCard('user-1', 'acc-1');

      const dto = card.toPublic();

      expect(dto.cvvMasked).toBe('***');
      expect(dto).not.toHaveProperty('cardNumber');
      expect(dto).not.toHaveProperty('cvv');
      expect(dto.lastFour).toBe(card.lastFour);
      expect(dto.status).toBe(CardStatus.ACTIVA);
      expect(typeof dto.createdAt).toBe('string');
      expect(new Date(dto.createdAt)).toBeInstanceOf(Date);
      expect(card.createdAt).toBeInstanceOf(Date);
      expect(card.accountId).toBe('acc-1');
      expect(card.cardHolderName).toBe('TEST USER');
      expect(card.expirationDate).toMatch(/^\d{2}\/\d{2}$/);
    });
  });
});
