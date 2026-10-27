import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoansClient } from '@/features/loans/components/LoansClient';
import { loanService } from '@/features/loans/services/loan.service';
import { profileService } from '@/features/profile/services/profile.service';
import { eligibleProfile, pendingLoanRow } from './loansClient.fixtures';

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

const create = loanService.create as unknown as ReturnType<typeof vi.fn>;
const getMyLoans = loanService.getMyLoans as unknown as ReturnType<typeof vi.fn>;
const getProfile = profileService.getProfile as unknown as ReturnType<typeof vi.fn>;

describe('LoansClient (solicitud)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyLoans.mockResolvedValue([]);
    getProfile.mockResolvedValue(eligibleProfile());
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
      expect.objectContaining({ amount: 5000000, installments: 12, annualRate: 18, monthlyIncome: 2_000_000 }),
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
    getMyLoans.mockResolvedValue([pendingLoanRow()]);
    render(<LoansClient />);

    await waitFor(() => expect(screen.getByText('Tienes una solicitud pendiente de revisión.')).toBeInTheDocument());
    expect(screen.getByText('Solicitar').closest('button')).toBeDisabled();
    expect(screen.getByText('Mis solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  // NOTA: los early-returns de handleCreate (!baseEligible, !allRequirementsMet,
  // hasPending) son inalcanzables por UI porque el boton Solicitar se deshabilita
  // exactamente en esos estados. Se aserta el estado deshabilitado en su lugar.
  it('should keep Solicitar disabled when amount is invalid', async () => {
    render(<LoansClient />);

    fireEvent.change(screen.getByDisplayValue('5000000'), { target: { value: '0' } });

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
    getMyLoans.mockResolvedValue([pendingLoanRow()]);
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

  it('should fall back on create error without message', async () => {
    create.mockRejectedValueOnce(null);
    render(<LoansClient />);

    await waitFor(() =>
      expect(screen.getByText('Solicitar').closest('button')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByText('Solicitar'));

    await waitFor(() => expect(screen.getByText('No fue posible crear la solicitud.')).toBeInTheDocument());
  });
});
