import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

const { mockHandleRegister, registerState } = vi.hoisted(() => ({
  mockHandleRegister: vi.fn(),
  registerState: { isLoading: false, error: null as null | { message?: string } },
}));

vi.mock('@/features/auth/hooks/useRegister', () => ({
  useRegister: () => ({
    handleRegister: mockHandleRegister,
    isLoading: registerState.isLoading,
    error: registerState.error,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function fillValid() {
  fireEvent.change(screen.getByLabelText('Primer nombre'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Primer apellido'), { target: { value: 'Garcia' } });
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1995-06-15' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText('Documento'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByLabelText('Ingreso mensual'), { target: { value: '1800000' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Segura123' } });
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Segura123' } });
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerState.isLoading = false;
    registerState.error = null;
  });

  it('should show the server error banner', () => {
    registerState.error = { message: 'Correo en uso' } as never;
    render(<RegisterForm />);

    expect(screen.getByText('Correo en uso')).toBeInTheDocument();
  });

  it('should submit a valid registration', async () => {
    const { container } = render(<RegisterForm />);

    fillValid();
    fireEvent.submit(container.querySelector('form')!);

    await screen.findByText('Primer nombre');
    expect(mockHandleRegister).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com', firstName: 'Ana' }),
    );
  });

  it('should show validation errors on empty submit', async () => {
    const { container } = render(<RegisterForm />);

    fireEvent.submit(container.querySelector('form')!);

    await screen.findByText('El primer nombre debe tener al menos 2 caracteres');
    expect(mockHandleRegister).not.toHaveBeenCalled();
  });

  it('should toggle both password visibilities', () => {
    render(<RegisterForm />);

    const password = screen.getByLabelText('Contraseña') as HTMLInputElement;
    const confirm = screen.getByLabelText('Confirmar contraseña') as HTMLInputElement;

    fireEvent.click(password.closest('div.relative')!.querySelector('button')!);
    fireEvent.click(confirm.closest('div.relative')!.querySelector('button')!);

    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).type).toBe('text');
    expect((screen.getByLabelText('Confirmar contraseña') as HTMLInputElement).type).toBe('text');
  });
});
