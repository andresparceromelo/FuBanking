import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/features/auth/components/LoginForm';

const { mockHandleLogin, loginState } = vi.hoisted(() => ({
  mockHandleLogin: vi.fn(),
  loginState: { isLoading: false, error: null as null | { message?: string } },
}));

vi.mock('@/features/auth/hooks/useLogin', () => ({
  useLogin: () => ({ handleLogin: mockHandleLogin, isLoading: loginState.isLoading, error: loginState.error }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginState.isLoading = false;
    loginState.error = null;
  });

  it('should show the server error banner', () => {
    loginState.error = { message: 'Credenciales inválidas' } as never;
    render(<LoginForm />);

    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('should submit valid credentials', async () => {
    const { container } = render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Segura123' } });
    fireEvent.submit(container.querySelector('form')!);

    await screen.findByText('Correo electrónico');
    expect(mockHandleLogin).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com', password: 'Segura123' }),
    );
  });

  it('should show validation errors on empty submit', async () => {
    const { container } = render(<LoginForm />);

    fireEvent.submit(container.querySelector('form')!);

    await screen.findByText('El correo electrónico es requerido');
    expect(mockHandleLogin).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    render(<LoginForm />);

    const input = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggle = input.closest('div.relative')!.querySelector('button')!;
    fireEvent.click(toggle);
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).type).toBe('text');
  });
});
