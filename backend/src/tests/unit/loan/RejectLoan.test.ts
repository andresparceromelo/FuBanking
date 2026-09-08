import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { RejectLoan } from '../../../application/use-cases/loan/RejectLoan';
import { LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import {
  InMemoryLoanRepo,
  InMemoryUserRepo,
  InMemoryNotificationRepo,
  createTestUser,
  buildPendingLoan,
} from './in-memory-repos';

describe('RejectLoan', () => {
  let loanRepo: InMemoryLoanRepo;
  let userRepo: InMemoryUserRepo;
  let notifRepo: InMemoryNotificationRepo;
  let useCase: RejectLoan;

  beforeEach(() => {
    loanRepo = new InMemoryLoanRepo();
    userRepo = new InMemoryUserRepo();
    notifRepo = new InMemoryNotificationRepo();
    useCase = new RejectLoan(loanRepo, notifRepo);
  });

  describe('Happy path', () => {
    it('should reject the loan and notify the user', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      const result = await useCase.execute(loan.id);

      expect(result.status).toBe(LoanApplicationStatus.REJECTED);

      const userNotifs = await notifRepo.findByUserId(user.id);
      expect(userNotifs.length).toBeGreaterThanOrEqual(1);
      expect(userNotifs[0].title).toContain('rechazado');
    });

    it('should return the correct loan data in the response', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id, { amount: 10_000_000 });
      await loanRepo.save(loan);

      const result = await useCase.execute(loan.id);

      expect(result.amount).toBe(10_000_000);
      expect(result.userId).toBe(user.id);
    });
  });

  describe('Préstamo no encontrado', () => {
    it('should throw LOAN_NOT_FOUND for non-existent loan', async () => {
      await expect(useCase.execute(randomUUID())).rejects.toThrow(/no encontrado/i);
    });
  });

  describe('Estado inválido', () => {
    it('should throw when rejecting an already APPROVED loan', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      await loan.approve();
      await loanRepo.save(loan);

      await expect(useCase.execute(loan.id)).rejects.toThrow(/PENDING/);
    });

    it('should throw when rejecting an already REJECTED loan', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      await loan.reject();
      await loanRepo.save(loan);

      await expect(useCase.execute(loan.id)).rejects.toThrow(/PENDING/);
    });
  });

  describe('Sin repositorio de notificaciones', () => {
    it('should not throw when notificationRepository is undefined', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      const noNotifUseCase = new RejectLoan(loanRepo, undefined);
      const result = await noNotifUseCase.execute(loan.id);

      expect(result.status).toBe(LoanApplicationStatus.REJECTED);
    });
  });
});
