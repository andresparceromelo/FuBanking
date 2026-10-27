import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TwoFactorVerifyForm } from '@/features/auth/components/TwoFactorVerifyForm';

const state = vi.hoisted(() => ({
  handleVerify: vi.fn(),
  handleResend: vi.fn(),
  hook: { isLoading: false, isResending: false, error: null, resendSuccess: false },
  push: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useTwoFactor', () => ({
  useTwoFactor: () => ({
    handleVerify: state.handleVerify,
    handleResend: state.handleResend,
    isLoading: state.hook.isLoading,
    isResending: state.hook.isResending,
    error: state.hook.error,
    resendSuccess: state.hook.resendSuccess,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: state.push }),
}));

describe('TwoFactorVerifyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    state.hook.isLoading = false;
    state.hook.isResending = false;
    state.hook.error = null;
    state.hook.resendSuccess = false;
    sessionStorage.setItem('2fa_masked_email', 'a***@b.co');
  });

  it('should redirect to login without a masked email', () => {
    sessionStorage.clear();
    render(<TwoFactorVerifyForm />);

    expect(state.push).toHaveBeenCalledWith('/login');
  });

  it('should verify on completing 6 digits', () => {
    const { container } = render(<TwoFactorVerifyForm />);
    const inputs = container.querySelectorAll('input[inputmode="numeric"]');

    '123456'.split('').forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });

    expect(state.handleVerify).toHaveBeenCalledWith('123456');
  });

  it('should ignore non-digit input and handle backspace', () => {
    const { container } = render(<TwoFactorVerifyForm />);
    const inputs = container.querySelectorAll('input[inputmode="numeric"]');

    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect((inputs[0] as HTMLInputElement).value).toBe('');

    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect((inputs[0] as HTMLInputElement).value).toBe('');

    fireEvent.keyDown(inputs[0], { key: 'Backspace' });
    expect((inputs[0] as HTMLInputElement).value).toBe('');
  });

  it('should paste a full code and ignore non-digits', () => {
    const { container } = render(<TwoFactorVerifyForm />);
    const inputs = container.querySelectorAll('input[inputmode="numeric"]');

    fireEvent.paste(inputs[0], { clipboardData: { getData: () => 'abc' } });
    expect(state.handleVerify).not.toHaveBeenCalled();

    fireEvent.paste(inputs[0], { clipboardData: { getData: () => '987654' } });
    expect(state.handleVerify).toHaveBeenCalledWith('987654');
    expect((inputs[5] as HTMLInputElement).value).toBe('4');
  });

  it('should ignore non-backspace keys', () => {
    const { container } = render(<TwoFactorVerifyForm />);
    const inputs = container.querySelectorAll('input[inputmode="numeric"]');

    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect((inputs[0] as HTMLInputElement).value).toBe('');
    expect(state.handleVerify).not.toHaveBeenCalled();
  });

  it('should submit via the form button when complete', () => {
    const { container } = render(<TwoFactorVerifyForm />);
    const inputs = container.querySelectorAll('input[inputmode="numeric"]');

    '654321'.split('').forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    state.handleVerify.mockClear();

    fireEvent.submit(container.querySelector('form')!);
    expect(state.handleVerify).toHaveBeenCalledWith('654321');
  });

  it('should not submit an incomplete code', () => {
    const { container } = render(<TwoFactorVerifyForm />);
    const inputs = container.querySelectorAll('input[inputmode="numeric"]');

    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.submit(container.querySelector('form')!);

    expect(state.handleVerify).not.toHaveBeenCalled();
  });

  it('should show the spinner state while resending', () => {
    state.hook.isResending = true;
    render(<TwoFactorVerifyForm />);

    expect(screen.getByText('No recibí el código').closest('button')).toBeDisabled();
  });

  it('should resend and go back to login', () => {
    render(<TwoFactorVerifyForm />);

    fireEvent.click(screen.getByText('No recibí el código'));
    expect(state.handleResend).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Volver al inicio de sesión'));
    expect(sessionStorage.getItem('2fa_temp_token')).toBeNull();
    expect(state.push).toHaveBeenCalledWith('/login');
  });

  it('should show error and resend-success banners', () => {
    state.hook.error = { code: 'X', message: 'Código mal' };
    state.hook.resendSuccess = true;
    render(<TwoFactorVerifyForm />);

    expect(screen.getByText('Código mal')).toBeInTheDocument();
    expect(screen.getByText('¡Código reenviado exitosamente!')).toBeInTheDocument();
  });
});
