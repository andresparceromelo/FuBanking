import { describe, it, expect, beforeEach } from 'vitest';
import { CreateLoanApplication } from '../../../application/use-cases/loan/CreateLoanApplication';
import { LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { InMemoryLoanRepo, InMemoryUserRepo, InMemoryNotificationRepo, createTestUser } from './in-memory-repos';

describe('CreateLoanApplication', () => {
  let loanRepo: InMemoryLoanRepo;
  let userRepo: InMemoryUserRepo;
  let notifRepo: InMemoryNotificationRepo;
  let useCase: CreateLoanApplication;

  beforeEach(() => {
    loanRepo = new InMemoryLoanRepo();
    notifRepo = new InMemoryNotificationRepo();
    useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);
  });

  describe('Happy path', () => {
    it('should create a loan application with PENDING status', async () => {
      const user = createTestUser();
      userRepo = new InMemoryUserRepo([user]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);

      const result = await useCase.execute({
        userId: user.id,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 1_800_000,
      });

      expect(result.status).toBe(LoanApplicationStatus.PENDING);
      expect(result.eligibility.isEligible).toBe(true);
      expect(result.monthlyPayment).toBeGreaterThan(0);
    });

    it('should notify the user after creating the loan', async () => {
      const user = createTestUser();
      userRepo = new InMemoryUserRepo([user]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);

      await useCase.execute({
        userId: user.id,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 1_800_000,
      });

      const notifs = await notifRepo.findByUserId(user.id);
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].title).toContain('crédito');
    });

    it('should notify all admins about the new request', async () => {
      const user = createTestUser();
      const admin = createTestUser({ email: 'admin@example.com', document: '9999999999' });
      admin.updateProfile({} as any);
      // Force admin role via constructor hack for testing
      const adminAsAny = admin as any;
      adminAsAny._role = 'admin';

      userRepo = new InMemoryUserRepo([user, admin]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);

      await useCase.execute({
        userId: user.id,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 1_800_000,
      });

      const adminNotifs = await notifRepo.findByUserId(admin.id);
      expect(adminNotifs.length).toBeGreaterThanOrEqual(1);
      expect(adminNotifs[0].title).toContain('solicitud');
    });
  });

  describe('Validación de duplicados', () => {
    it('should reject when user already has a PENDING loan', async () => {
      const user = createTestUser();
      userRepo = new InMemoryUserRepo([user]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);

      await useCase.execute({
        userId: user.id,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 1_800_000,
      });

      await expect(
        useCase.execute({
          userId: user.id,
          amount: 3_000_000,
          installments: 6,
          annualRate: 20,
          monthlyIncome: 1_800_000,
        }),
      ).rejects.toThrow(/pendiente/i);
    });
  });

  describe('Usuario no encontrado', () => {
    it('should throw USER_NOT_FOUND for non-existent user', async () => {
      await expect(
        useCase.execute({
          userId: 'non-existent',
          amount: 5_000_000,
          installments: 12,
          annualRate: 24,
          monthlyIncome: 1_800_000,
        }),
      ).rejects.toThrow(/no encontrado/i);
    });
  });

  describe('Requisitos incompletos', () => {
    it('should reject when user has no document verified', async () => {
      const user = createTestUser({ documentVerified: false });
      userRepo = new InMemoryUserRepo([user]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);

      await expect(
        useCase.execute({
          userId: user.id,
          amount: 5_000_000,
          installments: 12,
          annualRate: 24,
          monthlyIncome: 1_800_000,
        }),
      ).rejects.toThrow(/requisitos/i);
    });

    it('should reject when user has no income', async () => {
      const user = createTestUser({ monthlyIncome: null });
      userRepo = new InMemoryUserRepo([user]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, notifRepo);

      await expect(
        useCase.execute({
          userId: user.id,
          amount: 5_000_000,
          installments: 12,
          annualRate: 24,
          monthlyIncome: 1_800_000,
        }),
      ).rejects.toThrow(/requisitos/i);
    });
  });

  describe('Sin repositorio de notificaciones', () => {
    it('should not throw when notificationRepository is undefined', async () => {
      const user = createTestUser();
      userRepo = new InMemoryUserRepo([user]);
      useCase = new CreateLoanApplication(loanRepo, userRepo, undefined);

      const result = await useCase.execute({
        userId: user.id,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 1_800_000,
      });

      expect(result.status).toBe(LoanApplicationStatus.PENDING);
    });
  });
});
