/**
 * LoginForm.sin2FA.test.tsx
 * Pruebas unitarias de caja blanca — Frontend / Componente LoginForm
 *
 * Tabla de caminos cubierta (V(G) = 4):
 *   Camino 1,2,4,5,6,7,12,F     – sin error previo, campos vacíos → errores inline, handleLogin NO invocado
 *   Camino 1,2,3,4,5,6,7,12,F   – error previo en hook + campos inválidos → banner de error Y errores inline simultáneos
 *   Camino 1,2,4,5,6,8,9,10,12,F – sin error previo, formulario válido, handleLogin simula 401 → handleLogin invocado
 *   Camino 1,2,4,5,6,8,9,11,12,F – sin error previo, formulario válido, handleLogin simula OK → handleLogin invocado con datos correctos
 *
 * Dependencia mockeada: hook useLogin (vi.mock / jest.mock sobre el módulo ../hooks/useLogin).
 * El estado de isLoading, error y handleLogin es controlado por cada test.
 *
 * Ejecutar: npx jest src/__tests__/auth/LoginForm.sin2FA.test.tsx
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/login',
}));


const mockHandleLogin = jest.fn();
let mockHookState: {
  handleLogin: jest.Mock;
  isLoading: boolean;
  error: { code: string; message: string } | null;
} = {
  handleLogin: mockHandleLogin,
  isLoading: false,
  error: null,
};

jest.mock('../../features/auth/hooks/useLogin', () => ({
  useLogin: () => mockHookState,
}));


import { LoginForm } from '../../features/auth/components/LoginForm';


describe('LoginForm — Pruebas de caja blanca (tabla de caminos Componente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState = {
      handleLogin: mockHandleLogin,
      isLoading: false,
      error: null,
    };
  });

  describe('Camino 1,2,4,5,6,7,12,F — sin error previo, campos vacíos → formulario inválido en cliente', () => {
    it('muestra errores de validación inline y NO invoca handleLogin', async () => {
      render(<LoginForm />);

      expect(screen.queryByText(/correo o contraseña incorrectos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cuenta ha sido desactivada/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      await waitFor(() => {
        expect(screen.queryByText(/correo electrónico inválido/i)).toBeInTheDocument();
      });

      expect(mockHandleLogin).not.toHaveBeenCalled();
    });
  });

  describe('Camino 1,2,3,4,5,6,7,12,F — error previo en hook + formulario inválido', () => {
    it('muestra el banner de error del hook Y los mensajes de validación inline al mismo tiempo', async () => {
      mockHookState = {
        handleLogin: mockHandleLogin,
        isLoading: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' },
      };

      render(<LoginForm />);

      expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      await waitFor(() => {
        expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();
        const emailError = screen.queryByText(/correo electrónico inválido/i);
        const passwordError = screen.queryByText(/la contraseña es requerida/i);
        expect(emailError || passwordError).not.toBeNull();
      });

      expect(mockHandleLogin).not.toHaveBeenCalled();
    });
  });

  describe('Camino 1,2,4,5,6,8,9,10,12,F — formulario válido, handleLogin simula 401', () => {
    it('invoca handleLogin con los datos del formulario (el error lo maneja el hook, no el componente)', async () => {
      mockHandleLogin.mockResolvedValue(undefined); // se resuelve sin lanzar (el hook captura internamente)

      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'ana@mail.com');
      await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong');

      await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

      await waitFor(() => {
        expect(mockHandleLogin).toHaveBeenCalledTimes(1);
        expect(mockHandleLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'ana@mail.com',
            password: 'wrong',
          }),
        );
      });
    });
  });

  describe('Camino 1,2,4,5,6,8,9,11,12,F — formulario válido, handleLogin simula OK', () => {
    it('invoca handleLogin con { email, password, rememberMe } correctos', async () => {
      mockHandleLogin.mockResolvedValue(undefined);

      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'ana@mail.com');
      await userEvent.type(screen.getByLabelText(/contraseña/i), 'correcta123');

      const rememberMeCheckbox = screen.getByRole('checkbox');
      await userEvent.click(rememberMeCheckbox);

      await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

      await waitFor(() => {
        expect(mockHandleLogin).toHaveBeenCalledTimes(1);
        expect(mockHandleLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'ana@mail.com',
            password: 'correcta123',
            rememberMe: true,
          }),
        );
      });

      expect(screen.queryByText(/correo o contraseña incorrectos/i)).not.toBeInTheDocument();
    });
  });
});
