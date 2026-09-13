import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualCard } from '@/features/cards/components/VirtualCard';
import { cardService } from '@/features/cards/services/card.service';
import type { VirtualCard as CardType } from '@/features/cards/types/card.types';

vi.mock('@/features/cards/services/card.service', () => ({
  cardService: { revealDetails: vi.fn() },
}));

const revealDetails = cardService.revealDetails as unknown as ReturnType<typeof vi.fn>;

function card(overrides: Partial<CardType> = {}): CardType {
  return {
    id: 'card-1', userId: 'user-1', accountId: 'acc-1',
    cardHolderName: 'TEST USER', lastFour: '1234', expirationDate: '09/30',
    cvvMasked: '***', status: 'ACTIVA', createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('VirtualCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render holder, masked number, expiration and status', () => {
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    expect(screen.getByText('TEST USER')).toBeInTheDocument();
    expect(screen.getAllByText('**** **** **** 1234')).toHaveLength(2);
    expect(screen.getByText(/Vence 09\/30/)).toBeInTheDocument();
    expect(screen.getByText('ACTIVA')).toBeInTheDocument();
    expect(screen.getByText('Bloquear Temporalmente')).toBeInTheDocument();
  });

  it('should show blocked overlay and unlock action when BLOQUEADA', () => {
    render(<VirtualCard card={card({ status: 'BLOQUEADA' })} onToggleLock={() => {}} isLoading={false} />);

    expect(screen.getByText('Desbloquear Tarjeta')).toBeInTheDocument();
  });

  it('should call onToggleLock with the card id', () => {
    let toggled = '';
    render(<VirtualCard card={card()} onToggleLock={(id) => { toggled = id; }} isLoading={false} />);

    fireEvent.click(screen.getByText('Bloquear Temporalmente'));
    expect(toggled).toBe('card-1');
  });

  it('should disable toggle when loading or CANCELADA', () => {
    const { rerender } = render(
      <VirtualCard card={card()} onToggleLock={() => {}} isLoading />,
    );
    expect(screen.getByText('Bloquear Temporalmente').closest('button')).toBeDisabled();

    rerender(<VirtualCard card={card({ status: 'CANCELADA' })} onToggleLock={() => {}} isLoading={false} />);
    expect(screen.getByText('Bloquear Temporalmente').closest('button')).toBeDisabled();
  });

  it('should reveal number and cvv on demand', async () => {
    revealDetails.mockResolvedValue({ cardNumber: '4532000000001234', cvv: '123' });
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    fireEvent.click(screen.getByText('Ver numero y CVV'));

    await waitFor(() => expect(screen.getByText('4532 0000 0000 1234')).toBeInTheDocument());
    expect(revealDetails).toHaveBeenCalledWith('card-1');
    expect(screen.getByText('Ocultar numero y CVV')).toBeInTheDocument();
  });

  it('should hide without calling the service twice', async () => {
    revealDetails.mockResolvedValue({ cardNumber: '4532000000001234', cvv: '123' });
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    fireEvent.click(screen.getByText('Ver numero y CVV'));
    await waitFor(() => expect(screen.getByText('Ocultar numero y CVV')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Ocultar numero y CVV'));
    expect(screen.getByText('Ver numero y CVV')).toBeInTheDocument();
    expect(revealDetails).toHaveBeenCalledTimes(1);
  });

  it('should show the server message when reveal fails', async () => {
    revealDetails.mockRejectedValue({ message: 'Sin permiso' });
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    fireEvent.click(screen.getByText('Ver numero y CVV'));

    await waitFor(() => expect(screen.getByText('Sin permiso')).toBeInTheDocument());
  });

  it('should fall back when reveal fails with empty message', async () => {
    revealDetails.mockRejectedValue({ message: '' });
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    fireEvent.click(screen.getByText('Ver numero y CVV'));

    await waitFor(() => expect(screen.getByText('No fue posible revelar los datos.')).toBeInTheDocument());
  });

  it('should fall back when reveal fails without message', async () => {
    revealDetails.mockRejectedValue(null);
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    fireEvent.click(screen.getByText('Ver numero y CVV'));

    await waitFor(() => expect(screen.getByText('No fue posible revelar los datos.')).toBeInTheDocument());
  });

  it('should reuse cached details on second reveal without calling the service', async () => {
    revealDetails.mockResolvedValue({ cardNumber: '4532000000001234', cvv: '123' });
    render(<VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />);

    fireEvent.click(screen.getByText('Ver numero y CVV'));
    await waitFor(() => expect(screen.getByText('Ocultar numero y CVV')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ocultar numero y CVV'));
    expect(screen.getByText('Ver numero y CVV')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ver numero y CVV'));
    await waitFor(() => expect(screen.getByText('4532 0000 0000 1234')).toBeInTheDocument());
    expect(revealDetails).toHaveBeenCalledTimes(1);
  });

  it('should flip the card on click', () => {
    const { container } = render(
      <VirtualCard card={card()} onToggleLock={() => {}} isLoading={false} />,
    );

    const face = screen.getByText('TEST USER').closest('div.space-y-4') as HTMLElement;
    const flipper = face.querySelector('div[style*="preserve-3d"]') as HTMLElement;
    expect(flipper.style.transform).toBe('rotateY(0deg)');

    fireEvent.click(flipper);
    expect(flipper.style.transform).toBe('rotateY(180deg)');

    fireEvent.click(flipper);
    expect(flipper.style.transform).toBe('rotateY(0deg)');
    expect(container).toBeInTheDocument();
  });

  it('should disable reveal for CANCELADA cards', () => {
    render(<VirtualCard card={card({ status: 'CANCELADA' })} onToggleLock={() => {}} isLoading={false} />);

    expect(screen.getByText('Ver numero y CVV').closest('button')).toBeDisabled();
  });
});
