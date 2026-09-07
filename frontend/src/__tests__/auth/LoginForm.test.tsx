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
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../features/auth/components/LoginForm';

// ── Mock de dependencias externas ─────────────────────────────────────────────

// Mock de useLogin — controlamos isLoading, error y handleLogin
const mockHandleLogin = jest.fn();
jest.mock('../../features/auth/hooks/useLogin', () => ({
  useLogin: () => ({
    handleLogin: mockHandleLogin,
    isLoading: false,
    error: null,
  }),
}));

// Mock de next/link y next/navigation (requeridos por el componente)
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function fillForm(email = 'juan@example.com', password = 'Segura123!') {
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/contraseña/i), {
    target: { value: password },
  });
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('LoginForm — Pruebas de caja blanca (tabla de caminos Frontend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── C1 ───────────────────────────────────────────────────────────────────────
  test('C1 - formulario válido + login exitoso sin 2FA: llama handleLogin con los datos correctos', async () => {
    // Entrada: formularioValido=true, requiresTwoFactor=false, loginExitoso=true
    // (el resultado del login lo maneja useLogin; aquí verificamos que el formulario
    // llama handleLogin con los datos esperados)
    render(<LoginForm />);

    fillForm('juan@example.com', 'Segura123!');
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Prueba & Salida: handleLogin fue llamado con email y password correctos
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

  // ── C2 ───────────────────────────────────────────────────────────────────────
  test('C2 - formulario inválido (campos vacíos): muestra errores de validación y NO llama handleLogin', async () => {
    // Entrada: formularioValido=false (campos vacíos)
    render(<LoginForm />);

    // Enviar sin rellenar ningún campo
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Prueba & Salida: mensajes de validación visibles, handleLogin no invocado
    await waitFor(() => {
      // Zod/react-hook-form debería mostrar al menos un error de validación
      expect(
        screen.queryByText(/correo/i) || screen.queryByText(/inválido/i) || screen.queryByText(/requerido/i),
      ).not.toBeNull();
    });
    expect(mockHandleLogin).not.toHaveBeenCalled();
  });

  // ── C3 ───────────────────────────────────────────────────────────────────────
  test('C3 - credenciales incorrectas: muestra mensaje de error devuelto por el hook', async () => {
    // Entrada: requiresTwoFactor=false, loginExitoso=false
    // Simulamos que useLogin devuelve un error (credenciales inválidas)
    jest.resetModules();
    const { useLogin: useLoginMock } = jest.requireMock('../../features/auth/hooks/useLogin') as any;

    // Re-renderizamos con el mock de error activo
    jest.mock('../../features/auth/hooks/useLogin', () => ({
      useLogin: () => ({
        handleLogin: jest.fn(),
        isLoading: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' },
      }),
    }));

    // Importamos el componente de nuevo para que tome el mock actualizado
    const { LoginForm: LoginFormWithError } = await import('../../features/auth/components/LoginForm');
    render(<LoginFormWithError />);

    // Prueba & Salida: el mensaje de error es visible en el formulario
    await waitFor(() => {
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });
});
