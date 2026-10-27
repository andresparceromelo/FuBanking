import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoansClient } from '@/features/loans/components/LoansClient';
import { loanService } from '@/features/loans/services/loan.service';
import { profileService } from '@/features/profile/services/profile.service';
import { eligibleProfile, cop } from './loansClient.fixtures';

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
const getMyLoans = loanService.getMyLoans as unknown as ReturnType<typeof vi.fn>;
const getProfile = profileService.getProfile as unknown as ReturnType<typeof vi.fn>;

describe('LoansClient (simulador)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyLoans.mockResolvedValue([]);
    getProfile.mockResolvedValue(eligibleProfile());
  });

  it('should render simulator with defaults and empty states', async () => {
    render(<LoansClient />);

    expect(screen.getByText('Créditos y Préstamos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay una simulación disponible.')).toBeInTheDocument();
    expect(screen.queryByText('Mis solicitudes')).not.toBeInTheDocument();

    await waitFor(() => expect(getMyLoans).toHaveBeenCalled());
  });

  it('should simulate successfully and render the summary', async () => {
    simulate.mockResolvedValue({ monthlyPayment: 470_000, totalToPay: 5_640_000, totalInterest: 640_000 });
    render(<LoansClient />);

    fireEvent.click(screen.getByText('Simular'));

    await waitFor(() => expect(screen.getByText('Simulación lista.')).toBeInTheDocument());
    expect(simulate).toHaveBeenCalledWith({ amount: 5000000, installments: 12, annualRate: 18 });
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

  it('should update all three inputs', async () => {
    render(<LoansClient />);

    fireEvent.change(screen.getByDisplayValue('5000000'), { target: { value: '7000000' } });
    fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '24' } });
    fireEvent.change(screen.getByDisplayValue('18'), { target: { value: '20' } });

    expect(screen.getByDisplayValue('7000000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();

    simulate.mockResolvedValue({ monthlyPayment: 1, totalToPay: 2, totalInterest: 3 });
    fireEvent.click(screen.getByText('Simular'));
    await waitFor(() => expect(simulate).toHaveBeenCalledWith({ amount: 7000000, installments: 24, annualRate: 20 }));
  });
});
