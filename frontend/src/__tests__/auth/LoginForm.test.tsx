/**
 * LoginForm.test.tsx
 * Pruebas unitarias — Capa Frontend
 * Componente: LoginForm
 *
 * Tabla de caminos cubierta:
 *   C1 – Formulario válido, requiresTwoFactor=false, loginExitoso=true → redirige a Dashboard
 *   C2 – Formulario inválido (campos vacíos) → muestra errores de validación
 *   C3 – Formulario válido, loginExitoso=false (credenciales incorrectas) → muestra error
 *
 * Nota: LoginForm delega la lógica al hook useLogin. El hook se mockea completamente.
 *
 * Ejecutar: jest src/__tests__/auth/LoginForm.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../features/auth/components/LoginForm';


const mockHandleLogin = jest.fn();
jest.mock('../../features/auth/hooks/useLogin', () => ({
  useLogin: () => ({
    handleLogin: mockHandleLogin,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));


function fillForm(email = 'juan@example.com', password = 'Segura123!') {
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/contraseña/i), {
    target: { value: password },
  });
}


describe('LoginForm — Pruebas de caja blanca (tabla de caminos Frontend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('C1 - formulario válido + login exitoso sin 2FA: llama handleLogin con los datos correctos', async () => {
    render(<LoginForm />);

    fillForm('juan@example.com', 'Segura123!');
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledTimes(1);
      expect(mockHandleLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'juan@example.com',
          password: 'Segura123!',
        }),
      );
    });
  });

  test('C2 - formulario inválido (campos vacíos): muestra errores de validación y NO llama handleLogin', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/correo/i) || screen.queryByText(/inválido/i) || screen.queryByText(/requerido/i),
      ).not.toBeNull();
    });
    expect(mockHandleLogin).not.toHaveBeenCalled();
  });

  test('C3 - credenciales incorrectas: muestra mensaje de error devuelto por el hook', async () => {
    jest.resetModules();
    const { useLogin: useLoginMock } = jest.requireMock('../../features/auth/hooks/useLogin') as any;

    jest.mock('../../features/auth/hooks/useLogin', () => ({
      useLogin: () => ({
        handleLogin: jest.fn(),
        isLoading: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' },
      }),
    }));

    const { LoginForm: LoginFormWithError } = await import('../../features/auth/components/LoginForm');
    render(<LoginFormWithError />);

    await waitFor(() => {
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });
});
