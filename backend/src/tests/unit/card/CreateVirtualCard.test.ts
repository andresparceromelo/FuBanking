import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { CreateVirtualCard } from '../../../application/use-cases/card/CreateVirtualCard';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import {
  InMemoryVirtualCardRepo,
  InMemoryAccountRepo,
  InMemoryUserRepo,
  InMemoryNotificationRepo,
  createTestUser,
  createTestAccount,
} from './in-memory-repos';

describe('CreateVirtualCard', () => {
  let cardRepo: InMemoryVirtualCardRepo;
  let accountRepo: InMemoryAccountRepo;
  let userRepo: InMemoryUserRepo;
  let notifRepo: InMemoryNotificationRepo;
  let useCase: CreateVirtualCard;

  beforeEach(() => {
    cardRepo = new InMemoryVirtualCardRepo();
    accountRepo = new InMemoryAccountRepo();
    userRepo = new InMemoryUserRepo();
    notifRepo = new InMemoryNotificationRepo();
    useCase = new CreateVirtualCard(cardRepo, accountRepo, userRepo, notifRepo);
  });

  describe('Happy path', () => {
    it('should create an ACTIVA card with the user full name and notify', async () => {
      const user = createTestUser();
      await userRepo.save(user);
      const account = createTestAccount(user.id);
      await accountRepo.save(account);

      const result = await useCase.execute({ userId: user.id, accountId: account.id });

      expect(result.status).toBe(CardStatus.ACTIVA);
      expect(result.cardHolderName).toBe('TEST USER');
      expect(result.cardNumber).toBeUndefined();
      expect(result.cvvMasked).toBe('***');
      expect(result.lastFour).toMatch(/^\d{4}$/);

      const notifs = await notifRepo.findByUserId(user.id);
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].title).toContain('virtual');
    });

    it('should fall back to TITULAR FUBANK when the user does not exist', async () => {
      const ghostId = randomUUID();
      const account = createTestAccount(ghostId);
      await accountRepo.save(account);

      const result = await useCase.execute({ userId: ghostId, accountId: account.id });

      expect(result.cardHolderName).toBe('TITULAR FUBANK');
    });
  });

  describe('Validación', () => {
    it('should throw ACCOUNT_NOT_FOUND for a missing account', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      await expect(
        useCase.execute({ userId: user.id, accountId: randomUUID() }),
      ).rejects.toThrow(/no existe/i);
    });

    it('should throw FORBIDDEN for another user account', async () => {
      const owner = createTestUser();
      const intruder = createTestUser({ email: 'x@y.co', document: '9998887776' });
      await userRepo.save(owner);
      await userRepo.save(intruder);
      const account = createTestAccount(owner.id);
      await accountRepo.save(account);

      await expect(
        useCase.execute({ userId: intruder.id, accountId: account.id }),
      ).rejects.toThrow(/permiso/i);
    });
  });

  describe('Sin repositorio de notificaciones', () => {
    it('should not throw when notificationRepository is undefined', async () => {
      const user = createTestUser();
      await userRepo.save(user);
      const account = createTestAccount(user.id);
      await accountRepo.save(account);

      const noNotif = new CreateVirtualCard(cardRepo, accountRepo, userRepo, undefined);
      const result = await noNotif.execute({ userId: user.id, accountId: account.id });

      expect(result.status).toBe(CardStatus.ACTIVA);
    });
  });
});
