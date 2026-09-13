import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminLoans } from '@/features/admin/hooks/useAdminLoans';
import { adminService } from '@/features/admin/services/admin.service';
import type { AdminLoanApplication } from '@/features/admin/types/admin.types';

vi.mock('@/features/admin/services/admin.service', () => ({
  adminService: { getAllLoans: vi.fn(), approveLoan: vi.fn(), rejectLoan: vi.fn() },
}));

const getAllLoans = adminService.getAllLoans as unknown as ReturnType<typeof vi.fn>;
const approveLoan = adminService.approveLoan as unknown as ReturnType<typeof vi.fn>;
const rejectLoan = adminService.rejectLoan as unknown as ReturnType<typeof vi.fn>;

function loan(id: string, status: AdminLoanApplication['status'] = 'PENDING'): AdminLoanApplication {
  return {
    id, userId: 'user-1', amount: 1_000_000, installments: 12, annualRate: 12,
    monthlyIncome: 2_000_000, monthlyPayment: 90_000, totalToPay: 1_080_000,
    totalInterest: 80_000, documentVerified: true, ageVerified: true,
    incomeVerified: true, creditHistoryVerified: true,
    eligibility: { isEligible: true, reasons: [] }, status,
    createdAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('useAdminLoans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchLoans', () => {
    it('should set loans on success and clear error', async () => {
      const loans = [loan('loan-1'), loan('loan-2', 'APPROVED')];
      getAllLoans.mockResolvedValue(loans);
      const { result } = renderHook(() => useAdminLoans());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchLoans();
      });

      expect(returned).toEqual(loans);
      expect(result.current.loans).toEqual(loans);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return [] and fallback message on failure', async () => {
      getAllLoans.mockRejectedValue({});
      const { result } = renderHook(() => useAdminLoans());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.fetchLoans();
      });

      expect(returned).toEqual([]);
      expect(result.current.error).toBe('No fue posible obtener los prestamos.');
      expect(result.current.loans).toEqual([]);
    });
  });

  describe('approveLoan', () => {
    it('should replace only the approved loan and keep the rest', async () => {
      const before = [loan('loan-1'), loan('loan-2')];
      getAllLoans.mockResolvedValue(before);
      const approved = loan('loan-1', 'APPROVED');
      approveLoan.mockResolvedValue(approved);
      const { result } = renderHook(() => useAdminLoans());

      await act(async () => {
        await result.current.fetchLoans();
      });

      let returned: unknown;
      await act(async () => {
        returned = await result.current.approveLoan('loan-1');
      });

      expect(returned).toEqual(approved);
      expect(result.current.loans).toEqual([approved, loan('loan-2')]);
    });

    it('should set server message on failure and keep loans', async () => {
      const before = [loan('loan-1')];
      getAllLoans.mockResolvedValue(before);
      approveLoan.mockRejectedValue({ message: 'Ya fue procesado' });
      const { result } = renderHook(() => useAdminLoans());

      await act(async () => {
        await result.current.fetchLoans();
      });

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.approveLoan('loan-1');
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBe('Ya fue procesado');
      expect(result.current.loans).toEqual(before);
    });

    it('should fall back without message', async () => {
      approveLoan.mockRejectedValue(null);
      const { result } = renderHook(() => useAdminLoans());

      await act(async () => {
        await result.current.approveLoan('loan-1');
      });

      expect(result.current.error).toBe('No fue posible aprobar el prestamo.');
    });

    it('should fall back when the message is empty', async () => {
      approveLoan.mockRejectedValue({ message: '' });
      const { result } = renderHook(() => useAdminLoans());

      await act(async () => {
        await result.current.approveLoan('loan-1');
      });

      expect(result.current.error).toBe('No fue posible aprobar el prestamo.');
    });

    it('should fall back when the error is a plain string', async () => {
      rejectLoan.mockRejectedValue('boom');
      const { result } = renderHook(() => useAdminLoans());

      await act(async () => {
        await result.current.rejectLoan('loan-1');
      });

      expect(result.current.error).toBe('No fue posible rechazar el prestamo.');
    });
  });

  describe('rejectLoan', () => {
    it('should replace only the rejected loan', async () => {
      const before = [loan('loan-1'), loan('loan-2')];
      getAllLoans.mockResolvedValue(before);
      const rejected = loan('loan-2', 'REJECTED');
      rejectLoan.mockResolvedValue(rejected);
      const { result } = renderHook(() => useAdminLoans());

      await act(async () => {
        await result.current.fetchLoans();
      });
      await act(async () => {
        await result.current.rejectLoan('loan-2');
      });

      expect(result.current.loans).toEqual([loan('loan-1'), rejected]);
    });

    it('should fall back without message', async () => {
      rejectLoan.mockRejectedValue(undefined);
      const { result } = renderHook(() => useAdminLoans());

      let returned: unknown = 'pending';
      await act(async () => {
        returned = await result.current.rejectLoan('loan-1');
      });

      expect(returned).toBeNull();
      expect(result.current.error).toBe('No fue posible rechazar el prestamo.');
    });
  });
});
