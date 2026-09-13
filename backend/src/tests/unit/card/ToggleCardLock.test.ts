import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ToggleCardLock } from '../../../application/use-cases/card/ToggleCardLock';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import {
  InMemoryVirtualCardRepo,
  InMemoryNotificationRepo,
  buildVirtualCard,
} from './in-memory-repos';

describe('ToggleCardLock', () => {
  let cardRepo: InMemoryVirtualCardRepo;
  let notifRepo: InMemoryNotificationRepo;
  let useCase: ToggleCardLock;

  beforeEach(() => {
    cardRepo = new InMemoryVirtualCardRepo();
    notifRepo = new InMemoryNotificationRepo();
    useCase = new ToggleCardLock(cardRepo, notifRepo);
  });

  describe('Happy path', () => {
    it('should lock an ACTIVA card and notify bloqueo', async () => {
      const card = buildVirtualCard('user-1', 'acc-1');
      await cardRepo.save(card);

      const result = await useCase.execute({ userId: 'user-1', cardId: card.id });

      expect(result.status).toBe(CardStatus.BLOQUEADA);
      expect(cardRepo.statusUpdates).toContainEqual({ id: card.id, status: CardStatus.BLOQUEADA });
      const notifs = await notifRepo.findByUserId('user-1');
      expect(notifs[0].title).toContain('bloqueada');
    });

    it('should unlock a BLOQUEADA card and notify desbloqueo', async () => {
      const card = buildVirtualCard('user-1', 'acc-1', { status: CardStatus.BLOQUEADA });
      await cardRepo.save(card);

      const result = await useCase.execute({ userId: 'user-1', cardId: card.id });

      expect(result.status).toBe(CardStatus.ACTIVA);
      const notifs = await notifRepo.findByUserId('user-1');
      expect(notifs[0].title).toContain('desbloqueada');
    });
  });

  describe('Validación', () => {
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

  describe('Sin repositorio de notificaciones', () => {
    it('should toggle without notifying', async () => {
      const card = buildVirtualCard('user-1', 'acc-1');
      await cardRepo.save(card);

      const noNotif = new ToggleCardLock(cardRepo, undefined);
      const result = await noNotif.execute({ userId: 'user-1', cardId: card.id });

      expect(result.status).toBe(CardStatus.BLOQUEADA);
      expect(notifRepo.getAll()).toHaveLength(0);
    });
  });
});
