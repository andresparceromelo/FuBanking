import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoanCard } from '@/features/admin/components/LoanCard';
import { AdminLoanApplication } from '@/features/admin/types/admin.types';
import { formatCurrency } from '@/shared/utils/format';

// dom v10 no normaliza el query en matchers string: se reemplaza el NBSP de Intl.
const cop = (n: number) => formatCurrency(n).split(String.fromCharCode(160)).join(' ');

const testLoan: AdminLoanApplication = {
  id: 'loan-1',
  userId: 'user-abc-12345',
  amount: 5_000_000,
  installments: 12,
  annualRate: 24,
  monthlyIncome: 1_800_000,
  monthlyPayment: 480_000,
  totalToPay: 5_760_000,
  totalInterest: 760_000,
  documentVerified: true,
  ageVerified: true,
  incomeVerified: true,
  creditHistoryVerified: true,
  eligibility: { isEligible: true, reasons: [] },
  status: 'PENDING',
  createdAt: '2026-08-01T00:00:00.000Z',
};

describe('LoanCard', () => {
  it('should render loan details', () => {
    render(
      <LoanCard loan={testLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText(/user-abc/)).toBeInTheDocument();
    expect(screen.getByText(cop(5_000_000))).toBeInTheDocument();
    expect(screen.getByText(cop(480_000))).toBeInTheDocument();
    expect(screen.getByText(cop(5_760_000))).toBeInTheDocument();
    expect(screen.getByText(/12 meses/)).toBeInTheDocument();
    expect(screen.getByText(/Pendiente/)).toBeInTheDocument();
  });

  it('should show approve and reject buttons when status is PENDING', () => {
    render(
      <LoanCard loan={testLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText('Aprobar')).toBeInTheDocument();
    expect(screen.getByText('Rechazar')).toBeInTheDocument();
  });

  it('should not show buttons when status is APPROVED', () => {
    const approvedLoan = { ...testLoan, status: 'APPROVED' as const };
    render(
      <LoanCard loan={approvedLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
    expect(screen.queryByText('Rechazar')).not.toBeInTheDocument();
  });

  it('should call onApprove when approve button is clicked', () => {
    let approvedId = '';
    const onApprove = (id: string) => { approvedId = id; };
    render(
      <LoanCard loan={testLoan} onApprove={onApprove} onReject={() => {}} isLoading={false} />,
    );

    fireEvent.click(screen.getByText('Aprobar'));
    expect(approvedId).toBe('loan-1');
  });

  it('should call onReject when reject button is clicked', () => {
    let rejectedId = '';
    const onReject = (id: string) => { rejectedId = id; };
    render(
      <LoanCard loan={testLoan} onApprove={() => {}} onReject={onReject} isLoading={false} />,
    );

    fireEvent.click(screen.getByText('Rechazar'));
    expect(rejectedId).toBe('loan-1');
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <LoanCard loan={testLoan} onApprove={() => {}} onReject={() => {}} isLoading={true} />,
    );

    expect(screen.getByText('Aprobar')).toBeDisabled();
    expect(screen.getByText('Rechazar')).toBeDisabled();
  });

  it('should display eligibility requirements with checkmarks', () => {
    render(
      <LoanCard loan={testLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText('Documento')).toBeInTheDocument();
    expect(screen.getByText('Mayor de edad')).toBeInTheDocument();
    expect(screen.getByText('Ingreso validado')).toBeInTheDocument();
    expect(screen.getByText('Historial crediticio')).toBeInTheDocument();
  });

  it('should show Rechazado badge and no buttons when status is REJECTED', () => {
    const rejectedLoan = { ...testLoan, status: 'REJECTED' as const };
    render(
      <LoanCard loan={rejectedLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText('Rechazado')).toBeInTheDocument();
    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
    expect(screen.queryByText('Rechazar')).not.toBeInTheDocument();
  });

  it('should show Aprobado badge when status is APPROVED', () => {
    const approvedLoan = { ...testLoan, status: 'APPROVED' as const };
    render(
      <LoanCard loan={approvedLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText('Aprobado')).toBeInTheDocument();
  });

  it('should fall back to gray badge for unknown status', () => {
    const unknownLoan = { ...testLoan, status: 'WEIRD' as unknown as AdminLoanApplication['status'] };
    const { container } = render(
      <LoanCard loan={unknownLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText('WEIRD')).toBeInTheDocument();
    expect(container.querySelector('.bg-gray-100')).not.toBeNull();
  });

  it('should show Desconocido when status is null', () => {
    const nullStatusLoan = { ...testLoan, status: null as unknown as AdminLoanApplication['status'] };
    render(
      <LoanCard loan={nullStatusLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText('Desconocido')).toBeInTheDocument();
  });

  it('should show N/A when userId is null', () => {
    const noUserLoan = { ...testLoan, userId: null as unknown as string };
    render(
      <LoanCard loan={noUserLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText(/N\/A/)).toBeInTheDocument();
  });

  it('should render red badges for unmet requirements', () => {
    const unmetLoan = {
      ...testLoan,
      documentVerified: false,
      ageVerified: false,
      incomeVerified: false,
      creditHistoryVerified: false,
    };
    const { container } = render(
      <LoanCard loan={unmetLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(container.querySelectorAll('.text-red-700')).toHaveLength(4);
  });

  it('should render rate, income and date info', () => {
    render(
      <LoanCard loan={testLoan} onApprove={() => {}} onReject={() => {}} isLoading={false} />,
    );

    expect(screen.getByText(/24% EA/)).toBeInTheDocument();
    expect(screen.getByText(cop(1_800_000), { exact: false })).toBeInTheDocument();
  });
});
