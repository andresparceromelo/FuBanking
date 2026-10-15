import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ConfirmCardPasswordModal } from '@/features/cards/components/ConfirmCardPasswordModal';

describe('ConfirmCardPasswordModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    accountNumber: '1234567890',
    accountType: 'AHORROS',
    isLoading: false,
    externalError: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(
      <ConfirmCardPasswordModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza la información de la cuenta y el formulario cuando isOpen es true', () => {
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    expect(screen.getByText('Confirmar con contraseña')).toBeInTheDocument();
    expect(screen.getByText(/7890/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña de FuBanking/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-auth-submit')).toBeInTheDocument();
  });

  it('muestra error local si se intenta enviar vacío', async () => {
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    const submitBtn = screen.getByTestId('card-auth-submit');
    // We trigger submit on form
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByTestId('card-auth-error')).toHaveTextContent(/ingresa tu contraseña/i);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('llama a onConfirm con la contraseña ingresada y cierra al tener éxito', async () => {
    defaultProps.onConfirm.mockResolvedValue(true);
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    const input = screen.getByLabelText(/Contraseña de FuBanking/i);
    fireEvent.change(input, { target: { value: 'MiClaveSegura123' } });

    const submitBtn = screen.getByTestId('card-auth-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('MiClaveSegura123');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('no cierra el modal si onConfirm retorna false', async () => {
    defaultProps.onConfirm.mockResolvedValue(false);
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    const input = screen.getByLabelText(/Contraseña de FuBanking/i);
    fireEvent.change(input, { target: { value: 'ClaveErrada' } });

    const submitBtn = screen.getByTestId('card-auth-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('ClaveErrada');
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it('alterna la visibilidad de la contraseña con el botón del ojo', () => {
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    const input = screen.getByLabelText(/Contraseña de FuBanking/i) as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleBtn = screen.getByLabelText('Ver contraseña');
    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByLabelText('Ocultar contraseña'));
    expect(input.type).toBe('password');
  });

  it('muestra error externo si es provisto', () => {
    render(
      <ConfirmCardPasswordModal
        {...defaultProps}
        externalError="Contraseña incorrecta"
      />,
    );

    expect(screen.getByTestId('card-auth-error')).toHaveTextContent('Contraseña incorrecta');
  });

  it('cierra el modal al pulsar la tecla Escape', () => {
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra el modal al pulsar Cancelar o el botón X', () => {
    render(<ConfirmCardPasswordModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText('Cerrar modal');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
