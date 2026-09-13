import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/shared/services/api.client';
import { loanService } from '@/features/loans/services/loan.service';

vi.mock('@/shared/services/api.client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}));

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;

describe('loanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('simulate / simulateLoan', () => {
    it('should POST /loans/simulate and return data', async () => {
      const payload = { amount: 5_000_000, installments: 12, annualRate: 24 };
      const simulation = { ...payload, monthlyRate: 0.02, monthlyPayment: 470_000, totalToPay: 5_640_000, totalInterest: 640_000 };
      post.mockResolvedValue({ data: simulation });

      const result = await loanService.simulate(payload);

      expect(post).toHaveBeenCalledWith('/loans/simulate', payload);
      expect(result).toEqual(simulation);
    });

    it('should delegate simulateLoan to simulate', async () => {
      const payload = { amount: 1_000_000, installments: 6, annualRate: 12 };
      const simulation = { ...payload, monthlyRate: 0.01, monthlyPayment: 172_000, totalToPay: 1_032_000, totalInterest: 32_000 };
      post.mockResolvedValue({ data: simulation });

      await expect(loanService.simulateLoan(payload)).resolves.toEqual(simulation);
      expect(post).toHaveBeenCalledWith('/loans/simulate', payload);
    });

    it('should propagate errors', async () => {
      post.mockRejectedValue({ code: 'VALIDATION_ERROR', message: 'Monto inválido' });

      await expect(
        loanService.simulate({ amount: -1, installments: 12, annualRate: 24 }),
      ).rejects.toEqual({ code: 'VALIDATION_ERROR', message: 'Monto inválido' });
    });
  });

  describe('create / createLoan', () => {
    it('should POST /loans and return the application', async () => {
      const payload = { amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000 };
      const application = { ...payload, id: 'loan-1', userId: 'user-1', status: 'PENDING' };
      post.mockResolvedValue({ data: application });

      const result = await loanService.create(payload);

      expect(post).toHaveBeenCalledWith('/loans', payload);
      expect(result).toEqual(application);
    });

    it('should delegate createLoan to create', async () => {
      const payload = { amount: 2_000_000, installments: 12, annualRate: 18, monthlyIncome: 2_000_000 };
      const application = { ...payload, id: 'loan-2', userId: 'user-1', status: 'PENDING' };
      post.mockResolvedValue({ data: application });

      await expect(loanService.createLoan(payload)).resolves.toEqual(application);
    });
  });

  describe('getMyLoans', () => {
    it('should GET /loans/me and return the list', async () => {
      const loans = [{ id: 'loan-1' }, { id: 'loan-2' }];
      get.mockResolvedValue({ data: loans });

      const result = await loanService.getMyLoans();

      expect(get).toHaveBeenCalledWith('/loans/me');
      expect(result).toEqual(loans);
    });
  });
});
