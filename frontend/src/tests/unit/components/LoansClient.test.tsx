import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoansClient } from '@/features/loans/components/LoansClient';
import { loanService } from '@/features/loans/services/loan.service';
import { profileService } from '@/features/profile/services/profile.service';
import { formatCurrency } from '@/shared/utils/format';

vi.mock('@/features/loans/services/loan.service', () => ({
  loanService: { simulate: vi.fn(), create: vi.fn(), getMyLoans: vi.fn() },
}));

vi.mock('@/features/profile/services/profile.service', () => ({
  profileService: { getProfile: vi.fn() },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const simulate = loanService.simulate as unknown as ReturnType<typeof vi.fn>;
const create = loanService.create as unknown as ReturnType<typeof vi.fn>;
const getMyLoans = loanService.getMyLoans as unknown as ReturnType<typeof vi.fn>;
const getProfile = profileService.getProfile as unknown as ReturnType<typeof vi.fn>;

// dom v10 no normaliza el query en matchers string: se reemplaza el NBSP de Intl.
const cop = (n: number) => formatCurrency(n).split(String.fromCharCode(160)).join(' ');

function eligibleProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'u@e.co',
    documentVerified: true,
    birthDate: '1990-05-05',
    monthlyIncome: 2_000_000,
    ...overrides,
  };
}

describe('LoansClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyLoans.mockResolvedValue([]);
    getProfile.mockResolvedValue(eligibleProfile());
  });

  it('should render simulator with defaults and empty states', async () => {
    render(<LoansClient />);

    expect(screen.getByText('Créditos y Préstamos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay una simulación disponible.')).toBeInTheDocument();
    expect(screen.queryByText('Mis solicitudes')).not.toBeInTheDocument();

    await waitFor(() => expect(getMyLoans).toHaveBeenCalled());
  });

  it('should show all requirements met for an eligible profile', async () => {
    const { container } = render(<LoansClient />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    expect(container.querySelectorAll('.text-green-700').length).toBeGreaterThanOrEqual(4);

    const solicitar = screen.getByText('Solicitar').closest('button');
    expect(solicitar).not.toBeDisabled();
  });

  it('should disable Solicitar when requirements are unmet', async () => {
    getProfile.mockResolvedValue(eligibleProfile({ documentVerified: false }));
    render(<LoansClient />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    const solicitar = screen.getByText('Solicitar').closest('button');
    expect(solicitar).toBeDisabled();
  });

  it('should simulate successfully and render the summary', async () => {
    simulate.mockResolvedValue({ monthlyPayment: 470_000, totalToPay: 5_640_000, totalInterest: 640_000 });
    render(<LoansClient />);

    fireEvent.click(screen.getByText('Simular'));

    await waitFor(() => expect(screen.getByText('Simulación lista.')).toBeInTheDocument());
    expect(simulate).toHaveBeenCalledWith({ amount: 5000, installments: 12, annualRate: 18 });
    expect(screen.getByText(cop(470_000))).toBeInTheDocument();
    expect(screen.getByText(cop(5_640_000))).toBeInTheDocument();
    expect(screen.getByText(cop(640_000))).toBeInTheDocument();
  });

  it('should show server and fallback messages on simulate error', async () => {
    simulate.mockRejectedValueOnce({ message: 'Tasa inválida' });
    render(<LoansClient />);
    fireEvent.click(screen.getByText('Simular'));
    await waitFor(() => expect(screen.getByText('Tasa inválida')).toBeInTheDocument());
  });

  it('should show fallback on simulate error without message', async () => {
    simulate.mockRejectedValueOnce(null);
    render(<LoansClient />);
    fireEvent.click(screen.getByText('Simular'));
    await waitFor(() => expect(screen.getByText('No fue posible simular el préstamo.')).toBeInTheDocument());
  });

  it('should create an eligible application and refresh loans', async () => {
    create.mockResolvedValue({
      id: 'loan-1', status: 'PENDING',
      eligibility: { isEligible: true, reasons: [] },
    });
    render(<LoansClient />);

    await waitFor(() =>
      expect(screen.getByText('Solicitar').closest('button')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByText('Solicitar'));

    await waitFor(() => expect(screen.getByText('Solicitud enviada correctamente.')).toBeInTheDocument());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5000, installments: 12, annualRate: 18, monthlyIncome: 2_000_000 }),
    );
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument();
  });

  it('should show reasons for an ineligible application', async () => {
    create.mockResolvedValue({
      id: 'loan-2', status: 'PENDING',
      eligibility: { isEligible: false, reasons: ['Falta documento'] },
    });
    render(<LoansClient />);

    await waitFor(() =>
      expect(screen.getByText('Solicitar').closest('button')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByText('Solicitar'));

    await waitFor(() =>
      expect(screen.getByText('Solicitud registrada, pero no cumple con todos los requisitos.')).toBeInTheDocument(),
    );
    expect(screen.getByText('Falta documento')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should block creation when a loan is pending', async () => {
    getMyLoans.mockResolvedValue([
      { id: 'loan-p', amount: 1_000_000, installments: 6, annualRate: 10, monthlyPayment: 170_000, totalToPay: 1_020_000, totalInterest: 20_000, status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z' },
    ]);
    render(<LoansClient />);

    await waitFor(() => expect(screen.getByText('Tienes una solicitud pendiente de revisión.')).toBeInTheDocument());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
    expect(screen.getByText('Mis solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('should render approved, rejected and unknown statuses with fallback', async () => {
    getMyLoans.mockResolvedValue([
      { id: 'a', amount: 1_000_000, installments: 6, annualRate: 10, monthlyPayment: 170_000, totalToPay: 1_020_000, totalInterest: 20_000, status: 'APPROVED', createdAt: '2026-08-01T00:00:00.000Z' },
      { id: 'r', amount: 2_000_000, installments: 6, annualRate: 10, monthlyPayment: 340_000, totalToPay: 2_040_000, totalInterest: 40_000, status: 'REJECTED', createdAt: '2026-08-01T00:00:00.000Z' },
      { id: 'x', amount: 3_000_000, installments: 6, annualRate: 10, monthlyPayment: 510_000, totalToPay: 3_060_000, totalInterest: 60_000, status: 'WEIRD', createdAt: '2026-08-01T00:00:00.000Z' },
    ]);
    render(<LoansClient />);

    await waitFor(() => expect(screen.getByText('Aprobado')).toBeInTheDocument());
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
  });

  // NOTA: los early-returns de handleCreate (!baseEligible, !allRequirementsMet,
  // hasPending) son inalcanzables por UI porque el boton Solicitar se deshabilita
  // exactamente en esos estados. Se aserta el estado deshabilitado en su lugar.
  it('should keep Solicitar disabled when amount is invalid', async () => {
    render(<LoansClient />);

    fireEvent.change(screen.getByDisplayValue('5000'), { target: { value: '0' } });

    await waitFor(() =>
      expect(screen.getByText('Solicitar').closest('button')).toBeDisabled(),
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('should keep Solicitar disabled when requirements are unmet', async () => {
    getProfile.mockResolvedValue(eligibleProfile({ monthlyIncome: 0 }));
    render(<LoansClient />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it('should keep Solicitar disabled when a loan is already pending', async () => {
    getMyLoans.mockResolvedValue([
      { id: 'loan-p', amount: 1_000_000, installments: 6, annualRate: 10, monthlyPayment: 170_000, totalToPay: 1_020_000, totalInterest: 20_000, status: 'PENDING', createdAt: '2026-08-01T00:00:00.000Z' },
    ]);
    render(<LoansClient />);

    await waitFor(() => expect(screen.getByText('Tienes una solicitud pendiente de revisión.')).toBeInTheDocument());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it('should show creation error from the server', async () => {
    create.mockRejectedValueOnce({ message: 'Ya tienes una pendiente' });
    render(<LoansClient />);

    await waitFor(() =>
      expect(screen.getByText('Solicitar').closest('button')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByText('Solicitar'));

    await waitFor(() => expect(screen.getByText('Ya tienes una pendiente')).toBeInTheDocument());
  });

  it('should treat a minor profile as not age-verified', async () => {
    getProfile.mockResolvedValue(eligibleProfile({ birthDate: '2018-01-01' }));
    render(<LoansClient />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
  });

  it('should treat an empty birthDate as not age-verified', async () => {
    getProfile.mockResolvedValue(eligibleProfile({ birthDate: '' }));
    render(<LoansClient />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
  });

  it('should handle birthdays later this year and this month', async () => {
    const t = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const laterThisYear = fmt(new Date(t.getFullYear() - 20, t.getMonth() + 1, 15));
    getProfile.mockResolvedValue(eligibleProfile({ birthDate: laterThisYear }));
    const { unmount } = render(<LoansClient />);
    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    expect(screen.getByText('Solicitar').closest('button')).not.toBeDisabled();
    unmount();

    const sameMonth = new Date(t.getFullYear() - 20, t.getMonth(), Math.min(t.getDate() + 1, 28));
    getProfile.mockResolvedValue(eligibleProfile({ birthDate: fmt(sameMonth) }));
    render(<LoansClient />);
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(2));
  });

  it('should update all three inputs', async () => {
    render(<LoansClient />);

    fireEvent.change(screen.getByDisplayValue('5000'), { target: { value: '7000' } });
    fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '24' } });
    fireEvent.change(screen.getByDisplayValue('18'), { target: { value: '20' } });

    expect(screen.getByDisplayValue('7000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();

    simulate.mockResolvedValue({ monthlyPayment: 1, totalToPay: 2, totalInterest: 3 });
    fireEvent.click(screen.getByText('Simular'));
    await waitFor(() => expect(simulate).toHaveBeenCalledWith({ amount: 7000, installments: 24, annualRate: 20 }));
  });

  it('should fall back on create error without message', async () => {
    create.mockRejectedValueOnce(null);
    render(<LoansClient />);

    await waitFor(() =>
      expect(screen.getByText('Solicitar').closest('button')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByText('Solicitar'));

    await waitFor(() => expect(screen.getByText('No fue posible crear la solicitud.')).toBeInTheDocument());
  });

  it('should keep fetching loans silent on error', async () => {
    getMyLoans.mockRejectedValueOnce(new Error('down'));
    render(<LoansClient />);

    await waitFor(() => expect(getMyLoans).toHaveBeenCalled());
    expect(screen.queryByText('Mis solicitudes')).not.toBeInTheDocument();
  });

  it('should keep profile silent on error', async () => {
    getProfile.mockRejectedValueOnce(new Error('down'));
    render(<LoansClient />);

    await waitFor(() => expect(getProfile).toHaveBeenCalled());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
  });
});
