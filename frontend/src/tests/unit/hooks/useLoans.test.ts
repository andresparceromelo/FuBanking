import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoans } from '@/features/loans/hooks/useLoans';
import { loanService } from '@/features/loans/services/loan.service';

vi.mock('@/features/loans/services/loan.service', () => ({
  loanService: { simulateLoan: vi.fn(), createLoan: vi.fn() },
}));

const simulateLoan = loanService.simulateLoan as unknown as ReturnType<typeof vi.fn>;
const createLoan = loanService.createLoan as unknown as ReturnType<typeof vi.fn>;

describe('useLoans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose initial state', () => {
    const { result } = renderHook(() => useLoans());

    expect(result.current.simulation).toBeNull();
    expect(result.current.application).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('simulateLoan', () => {
    it('should set simulation data on success and clear error', async () => {
      const simulation = { amount: 5_000_000, monthlyPayment: 470_000 };
      simulateLoan.mockResolvedValue(simulation);
      const { result } = renderHook(() => useLoans());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.simulateLoan({ amount: 5_000_000, installments: 12, annualRate: 24 });
      });

      expect(returned).toEqual(simulation);
      expect(result.current.simulation).toEqual(simulation);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set the server message on failure', async () => {
      simulateLoan.mockRejectedValue({ message: 'Monto inválido' });
      const { result } = renderHook(() => useLoans());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.simulateLoan({ amount: -1, installments: 12, annualRate: 24 });
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBe('Monto inválido');
      expect(result.current.simulation).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should fall back when the error is a plain string', async () => {
      simulateLoan.mockRejectedValue('boom');
      const { result } = renderHook(() => useLoans());

      await act(async () => {
        await result.current.simulateLoan({ amount: 1, installments: 1, annualRate: 0 });
      });

      expect(result.current.error).toBe('No fue posible simular el credito.');
    });

    it('should fall back when the message is empty', async () => {
      simulateLoan.mockRejectedValue({ message: '' });
      const { result } = renderHook(() => useLoans());

      await act(async () => {
        await result.current.simulateLoan({ amount: 1, installments: 1, annualRate: 0 });
      });

      expect(result.current.error).toBe('No fue posible simular el credito.');
    });

    it('should fall back when the error has no message', async () => {
      simulateLoan.mockRejectedValue(null);
      const { result } = renderHook(() => useLoans());

      await act(async () => {
        await result.current.simulateLoan({ amount: 1, installments: 1, annualRate: 0 });
      });

      expect(result.current.error).toBe('No fue posible simular el credito.');
    });
  });

  describe('createLoan', () => {
    it('should set application data on success', async () => {
      const application = { id: 'loan-1', status: 'PENDING' };
      createLoan.mockResolvedValue(application);
      const { result } = renderHook(() => useLoans());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.createLoan({
          amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000,
        });
      });

      expect(returned).toEqual(application);
      expect(result.current.application).toEqual(application);
      expect(result.current.error).toBeNull();
    });

    it('should fall back when creation fails without message', async () => {
      createLoan.mockRejectedValue({});
      const { result } = renderHook(() => useLoans());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.createLoan({
          amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000,
        });
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBe('No fue posible crear la solicitud.');
      expect(result.current.application).toBeNull();
    });

    it('should expose setError', async () => {
      const { result } = renderHook(() => useLoans());

      await act(async () => {
        result.current.setError('custom');
      });

      expect(result.current.error).toBe('custom');
    });
  });
});
