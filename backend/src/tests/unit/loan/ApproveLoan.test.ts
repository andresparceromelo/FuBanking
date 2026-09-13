import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ApproveLoan } from '../../../application/use-cases/loan/ApproveLoan';
import { LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { AccountType } from '../../../domain/entities/Account';
import {
  InMemoryLoanRepo,
  InMemoryUserRepo,
  InMemoryAccountRepo,
  InMemoryNotificationRepo,
  createTestUser,
} from './in-memory-repos';
import { buildPendingLoan } from './in-memory-repos';

describe('ApproveLoan', () => {
  let loanRepo: InMemoryLoanRepo;
  let userRepo: InMemoryUserRepo;
  let accountRepo: InMemoryAccountRepo;
  let notifRepo: InMemoryNotificationRepo;
  let useCase: ApproveLoan;

  beforeEach(() => {
    loanRepo = new InMemoryLoanRepo();
    userRepo = new InMemoryUserRepo();
    accountRepo = new InMemoryAccountRepo();
    notifRepo = new InMemoryNotificationRepo();
    useCase = new ApproveLoan(loanRepo, accountRepo, notifRepo);
  });

  describe('Happy path', () => {
    it('should approve the loan, create CREDITO account and notify user', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      const result = await useCase.execute(loan.id);

      expect(result.status).toBe(LoanApplicationStatus.APPROVED);

      const accounts = await accountRepo.findByUserId(user.id);
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountType).toBe(AccountType.CREDITO);

      const userNotifs = await notifRepo.findByUserId(user.id);
      expect(userNotifs.length).toBeGreaterThanOrEqual(1);
      expect(userNotifs[0].title).toContain('aprobado');
    });

    it('should store loanId and installments in account details', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id, { installments: 24 });
      await loanRepo.save(loan);

      await useCase.execute(loan.id);

      const accounts = await accountRepo.findByUserId(user.id);
      expect(accounts[0].details).toBeDefined();
      expect(accounts[0].details!.loanId).toBe(loan.id);
      expect(accounts[0].details!.installments).toBe(24);
    });

    it('should generate an account number starting with BA', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      await useCase.execute(loan.id);

      const accounts = await accountRepo.findByUserId(user.id);
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountNumber).toMatch(/^BA\d{10}$/);
    });
  });

  describe('Préstamo no encontrado', () => {
    it('should throw LOAN_NOT_FOUND for non-existent loan', async () => {
      await expect(useCase.execute(randomUUID())).rejects.toThrow(/no encontrado/i);
    });
  });

  describe('Estado inválido', () => {
    it('should throw when approving an already APPROVED loan', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      await useCase.execute(loan.id);

      await expect(useCase.execute(loan.id)).rejects.toThrow(/PENDING/);
    });

    it('should throw when approving a REJECTED loan', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      await loan.reject();
      await loanRepo.save(loan);

      await expect(useCase.execute(loan.id)).rejects.toThrow(/PENDING/);
    });
  });

  describe('Generación de número de cuenta', () => {
    it('should retry when the generated number already exists', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      const taken = 'BA1111111111';
      const existing = await accountRepo.save(
        (await import('../../../domain/entities/Account')).Account.create({
          id: randomUUID(),
          userId: user.id,
          accountNumber: taken,
          accountType: (await import('../../../domain/entities/Account')).AccountType.AHORROS,
        }),
      );
      expect(existing.accountNumber).toBe(taken);

      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const realFind = accountRepo.findByAccountNumber.bind(accountRepo);
      let calls = 0;
      accountRepo.findByAccountNumber = async (n: string) => {
        calls += 1;
        if (calls === 1) return existing;
        return realFind(n);
      };

      try {
        const result = await useCase.execute(loan.id);
        expect(result.status).toBe(LoanApplicationStatus.APPROVED);
        expect(calls).toBeGreaterThanOrEqual(2);
        const accounts = await accountRepo.findByUserId(user.id);
        expect(accounts).toHaveLength(2);
        expect(accounts.map((a) => a.accountNumber)).toContain('BA5500000000');
      } finally {
        randomSpy.mockRestore();
      }
    });

    it('should throw ACCOUNT_NUMBER_GENERATION_FAILED after 5 collisions', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
      accountRepo.findByAccountNumber = async () =>
        (await import('../../../domain/entities/Account')).Account.create({
          id: randomUUID(),
          userId: user.id,
          accountNumber: 'BA2111111101',
          accountType: (await import('../../../domain/entities/Account')).AccountType.AHORROS,
        });

      try {
        await expect(useCase.execute(loan.id)).rejects.toThrow(/único/i);
      } finally {
        randomSpy.mockRestore();
      }
    });

    it('should return a complete DTO', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id, { amount: 6_000_000, installments: 24, annualRate: 18 });
      await loanRepo.save(loan);

      const result = await useCase.execute(loan.id);

      expect(result).toMatchObject({
        id: loan.id,
        userId: user.id,
        amount: 6_000_000,
        installments: 24,
        annualRate: 18,
        status: LoanApplicationStatus.APPROVED,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.eligibility).toEqual({ isEligible: true, reasons: [] });
      expect(typeof result.createdAt).toBe('string');
    });

    it('should persist APPROVED status via updateStatus', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      await useCase.execute(loan.id);

      expect(loanRepo.statusUpdates).toContainEqual({ id: loan.id, status: LoanApplicationStatus.APPROVED });
    });
  });

  describe('Sin repositorio de notificaciones', () => {
    it('should not throw when notificationRepository is undefined', async () => {
      const user = createTestUser();
      await userRepo.save(user);

      const loan = buildPendingLoan(user.id);
      await loanRepo.save(loan);

      const noNotifUseCase = new ApproveLoan(loanRepo, accountRepo, undefined);
      const result = await noNotifUseCase.execute(loan.id);

      expect(result.status).toBe(LoanApplicationStatus.APPROVED);
    });
  });
});
