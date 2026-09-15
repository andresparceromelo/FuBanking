import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { TokenStatus } from '@/features/auth/hooks/usePasswordReset';

const state = vi.hoisted(() => ({
  requestReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyToken: vi.fn(),
  hook: { isLoading: false, error: null, isSuccess: false, tokenStatus: 'valid' as TokenStatus },
}));

vi.mock('@/features/auth/hooks/usePasswordReset', () => ({
  usePasswordReset: () => ({
    requestReset: state.requestReset,
    resetPassword: state.resetPassword,
    verifyToken: state.verifyToken,
    isLoading: state.hook.isLoading,
    error: state.hook.error,
    isSuccess: state.hook.isSuccess,
    tokenStatus: state.hook.tokenStatus,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.hook.isLoading = false;
    state.hook.error = null;
    state.hook.isSuccess = false;
  });

  it('should submit the email', async () => {
    const { container } = render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(state.requestReset).toHaveBeenCalled());
    expect(state.requestReset.mock.calls[0][0]).toEqual({ email: 'ana@example.com' });
  });

  it('should show the success screen', () => {
    state.hook.isSuccess = true;
    render(<ForgotPasswordForm />);

    expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
  });

  it('should show the server error', () => {
    state.hook.error = { code: 'X', message: 'Falló el envío' };
    render(<ForgotPasswordForm />);

    expect(screen.getByText('Falló el envío')).toBeInTheDocument();
  });
});

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.hook.isLoading = false;
    state.hook.error = null;
    state.hook.isSuccess = false;
    state.hook.tokenStatus = 'valid';
  });

  it('should verify token on mount', () => {
    render(<ResetPasswordForm token="tok-1" />);
    expect(state.verifyToken).toHaveBeenCalledWith('tok-1');
  });

  it('should show loading spinner while verifying token', () => {
    state.hook.tokenStatus = 'loading';
    render(<ResetPasswordForm token="tok-1" />);
    
    expect(screen.getByText('Verificando enlace de recuperación...')).toBeInTheDocument();
  });

  it('should show expired link message', () => {
    state.hook.tokenStatus = 'expired';
    render(<ResetPasswordForm token="tok-1" />);
    
    expect(screen.getByText('Enlace expirado')).toBeInTheDocument();
    expect(screen.getByText(/solicita un nuevo enlace/i)).toBeInTheDocument();
  });

  it('should show already used link message', () => {
    state.hook.tokenStatus = 'used';
    render(<ResetPasswordForm token="tok-1" />);
    
    expect(screen.getByText('Enlace ya utilizado')).toBeInTheDocument();
  });

  it('should show invalid link message', () => {
    state.hook.tokenStatus = 'invalid';
    render(<ResetPasswordForm token="tok-1" />);
    
    expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
  });

  it('should submit new passwords with the token if token is valid and password strong', async () => {
    const { container } = render(<ResetPasswordForm token="tok-1" />);

    // Llenamos con una contraseña fuerte para habilitar el botón
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Segura123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'Segura123!' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(state.resetPassword).toHaveBeenCalled());
    expect(state.resetPassword.mock.calls[0][0]).toEqual(
      expect.objectContaining({ token: 'tok-1', newPassword: 'Segura123!' }),
    );
  });
  
  it('should disable submit if password is weak', () => {
    render(<ResetPasswordForm token="tok-1" />);

    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'debil' } });
    
    expect(screen.getByText(/demasiado débil/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Guardar contraseña/i });
    expect(button).toBeDisabled();
  });

  it('should show the success screen', () => {
    state.hook.isSuccess = true;
    render(<ResetPasswordForm token="tok-1" />);

    expect(screen.getByText('¡Contraseña actualizada!')).toBeInTheDocument();
  });

  it('should show the server error banner', () => {
    state.hook.error = { code: 'X', message: 'Token vencido' };
    render(<ResetPasswordForm token="tok-1" />);

    expect(screen.getByText('Token vencido')).toBeInTheDocument();
  });

  it('should toggle both password visibilities', () => {
    render(<ResetPasswordForm token="tok-1" />);

    const input = screen.getByLabelText('Nueva contraseña') as HTMLInputElement;
    fireEvent.click(input.closest('div.relative')!.querySelector('button')!);
    expect((screen.getByLabelText('Nueva contraseña') as HTMLInputElement).type).toBe('text');

    const confirm = screen.getByLabelText('Confirmar nueva contraseña') as HTMLInputElement;
    fireEvent.click(confirm.closest('div.relative')!.querySelector('button')!);
    expect((screen.getByLabelText('Confirmar nueva contraseña') as HTMLInputElement).type).toBe('text');
  });
});
