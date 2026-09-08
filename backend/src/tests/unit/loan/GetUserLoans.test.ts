import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { GetUserLoans } from '../../../application/use-cases/loan/GetUserLoans';
import { LoanApplication } from '../../../domain/entities/LoanApplication';
import { InMemoryLoanRepo } from './in-memory-repos';

describe('GetUserLoans', () => {
  let loanRepo: InMemoryLoanRepo;
  let useCase: GetUserLoans;

  beforeEach(() => {
    loanRepo = new InMemoryLoanRepo();
    useCase = new GetUserLoans(loanRepo);
  });

  describe('Happy path', () => {
    it('should return only the loans belonging to the specified user', async () => {
      const userId = randomUUID();
      const otherUserId = randomUUID();

      const myLoan = LoanApplication.create({
        id: randomUUID(),
        userId,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      const otherLoan = LoanApplication.create({
        id: randomUUID(),
        userId: otherUserId,
        amount: 3_000_000,
        installments: 6,
        annualRate: 20,
        monthlyIncome: 1_500_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      await loanRepo.save(myLoan);
      await loanRepo.save(otherLoan);

      const result = await useCase.execute(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(myLoan.id);
      expect(result[0].userId).toBe(userId);
    });

    it('should return an empty array when user has no loans', async () => {
      const result = await useCase.execute(randomUUID());
      expect(result).toEqual([]);
    });
  });

  describe('Múltiples préstamos', () => {
    it('should return all loans with different statuses for the same user', async () => {
      const userId = randomUUID();

      const pending = LoanApplication.create({
        id: randomUUID(),
        userId,
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });

      const approved = LoanApplication.create({
        id: randomUUID(),
        userId,
        amount: 3_000_000,
        installments: 6,
        annualRate: 20,
        monthlyIncome: 2_000_000,
        documentVerified: true,
        ageVerified: true,
        incomeVerified: true,
        creditHistoryVerified: true,
      });
      approved.approve();

      await loanRepo.save(pending);
      await loanRepo.save(approved);

      const result = await useCase.execute(userId);

      expect(result).toHaveLength(2);
    });
  });
});
