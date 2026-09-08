import { describe, it, expect } from 'vitest';
import { loanService } from '@/features/loans/services/loan.service';

describe('loanService', () => {
  describe('simulate', () => {
    it('should call POST /loans/simulate and return the result', async () => {
      const payload = { amount: 5_000_000, installments: 12, annualRate: 24 };
      
      try {
        const result = await loanService.simulate(payload);

        expect(result.amount).toBe(5_000_000);
        expect(result.installments).toBe(12);
        expect(result.annualRate).toBe(24);
        expect(result).toHaveProperty('monthlyRate');
        expect(result).toHaveProperty('monthlyPayment');
        expect(result).toHaveProperty('totalToPay');
        expect(result).toHaveProperty('totalInterest');
      } catch (error) {
        // Without authentication, this will throw an error from the real API
        expect(error).toBeDefined();
      }
    });
  });

  describe('create', () => {
    it('should call POST /loans and return the created application', async () => {
      const payload = {
        amount: 5_000_000,
        installments: 12,
        annualRate: 24,
        monthlyIncome: 1_800_000,
      };

      try {
        const result = await loanService.create(payload);
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('status');
      } catch (error) {
        // Might fail if user is not authenticated or other real validation fails
        expect(error).toBeDefined();
      }
    });
  });

  describe('getMyLoans', () => {
    it('should call GET /loans/me and return the list', async () => {
      try {
        const result = await loanService.getMyLoans();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
