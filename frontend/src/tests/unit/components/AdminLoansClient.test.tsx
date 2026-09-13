import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminLoansClient } from '@/features/admin/components/AdminLoansClient';
import { useAdminLoans } from '@/features/admin/hooks/useAdminLoans';
import type { AdminLoanApplication } from '@/features/admin/types/admin.types';

vi.mock('@/features/admin/hooks/useAdminLoans', () => ({
  useAdminLoans: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;
const mockUseAdminLoans = useAdminLoans as unknown as MockFn;

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

function state(overrides: Record<string, unknown> = {}) {
  return {
    loans: [], isLoading: false, error: null,
    fetchLoans: vi.fn().mockResolvedValue([]),
    approveLoan: vi.fn().mockResolvedValue(null),
    rejectLoan: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('AdminLoansClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch loans on mount and render the grid', () => {
    const fetchLoans = vi.fn().mockResolvedValue([loan('loan-1')]);
    mockUseAdminLoans.mockReturnValue(state({ loans: [loan('loan-1'), loan('loan-2', 'APPROVED')], fetchLoans }));

    render(<AdminLoansClient />);

    expect(fetchLoans).toHaveBeenCalled();
    expect(screen.getByText('Gestionar Creditos')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Aprobados')).toBeInTheDocument();
    expect(screen.getByText('Rechazados')).toBeInTheDocument();
  });

  it('should filter loans by status', () => {
    mockUseAdminLoans.mockReturnValue(
      state({ loans: [loan('loan-1'), loan('loan-2', 'APPROVED')] }),
    );
    render(<AdminLoansClient />);

    fireEvent.click(screen.getByText('Pendientes'));
    expect(screen.getByText('Aprobar')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Aprobados'));
    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
  });

  it('should approve and reject through LoanCards', () => {
    const approveLoan = vi.fn().mockResolvedValue(loan('loan-1', 'APPROVED'));
    const rejectLoan = vi.fn().mockResolvedValue(loan('loan-1', 'REJECTED'));
    mockUseAdminLoans.mockReturnValue(state({ loans: [loan('loan-1')], approveLoan, rejectLoan }));
    render(<AdminLoansClient />);

    fireEvent.click(screen.getByText('Aprobar'));
    expect(approveLoan).toHaveBeenCalledWith('loan-1');

    fireEvent.click(screen.getByText('Rechazar'));
    expect(rejectLoan).toHaveBeenCalledWith('loan-1');
  });

  it('should refresh when Actualizar is clicked', () => {
    const fetchLoans = vi.fn().mockResolvedValue([]);
    mockUseAdminLoans.mockReturnValue(state({ fetchLoans }));
    render(<AdminLoansClient />);

    const calls = fetchLoans.mock.calls.length;
    fireEvent.click(screen.getByText('Actualizar'));
    expect(fetchLoans.mock.calls.length).toBe(calls + 1);
  });

  it('should show the error banner', () => {
    mockUseAdminLoans.mockReturnValue(state({ error: 'Fallo de red' }));
    render(<AdminLoansClient />);

    expect(screen.getByText('Fallo de red')).toBeInTheDocument();
  });

  it('should show the spinner while loading without loans', () => {
    mockUseAdminLoans.mockReturnValue(state({ isLoading: true, loans: [] }));
    const { container } = render(<AdminLoansClient />);

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText(/No hay prestamos/)).not.toBeInTheDocument();
  });

  it('should fall back to index key when loan has no id', () => {
    const noId = { ...loan('x'), id: undefined as unknown as string };
    mockUseAdminLoans.mockReturnValue(state({ loans: [noId] }));
    render(<AdminLoansClient />);

    expect(screen.getByText('Aprobar')).toBeInTheDocument();
  });

  it('should show the empty state with filter text', () => {
    mockUseAdminLoans.mockReturnValue(state({ loans: [] }));
    render(<AdminLoansClient />);

    expect(screen.getByText(/No hay prestamos/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Rechazados'));
    expect(screen.getByText(/rejected/)).toBeInTheDocument();
  });
});
