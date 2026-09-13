/**
 * Login.integration.test.tsx
 * Pruebas de integración — Frontend (LoginForm + useLogin + authService)
 * Flujo sin autenticación de dos factores (2FA)
 *
 * Tabla de caminos cubierta (V(G) = 6):
 *   Camino 1,2,3,17,F            – datos inválidos en cliente → sin petición de red; errores inline
 *   Camino 1,2,4,5,6,15,17,F    – datos válidos en cliente, servidor responde 400 VALIDATION_ERROR → muestra error del servidor
 *   Camino 1,2,4,5,7,8,9,15,17,F – servidor responde 401 INVALID_CREDENTIALS (correo no registrado) → muestra 'Correo o contraseña incorrectos'
 *   Camino 1,2,4,5,7,8,10,11,15,17,F – servidor responde 401 ACCOUNT_INACTIVE → muestra 'Esta cuenta ha sido desactivada'
 *   Camino 1,2,4,5,7,8,10,12,13,15,17,F – servidor responde 401 INVALID_CREDENTIALS (password incorrecta) → muestra 'Correo o contraseña incorrectos'
 *   Camino 1,2,4,5,7,8,10,12,14,16,17,F – servidor responde 200 { requiresTwoFactor:false, token, user } → login() invocado con datos correctos
 *
 * Estrategia:
 *   - Se monta LoginForm + useLogin reales (sin mockear el hook).
 *   - Se mockea authService.login (la capa de red) para simular respuestas del backend.
 *   - Se mockea useAuth para capturar la llamada a login(user, token) en el path feliz.
 *   - NO se usa msw ni axios-mock-adapter (no instalados); el mock es directamente sobre authService.
 *
 * NOTA TÉCNICA — TDZ con jest.mock():
 *   jest.mock() es hoisted por Babel/ts-jest al inicio del archivo, antes de que se
 *   ejecuten las declaraciones const/let. Por eso NO se pueden referenciar variables
 *   en el factory; en su lugar se usan jest.fn() directamente y se accede al mock
 *   via jest.requireMock() dentro de los tests.
 *
 * ⚠️ Tipos inferidos que no se proporcionaron explícitamente:
 *   - PublicUser: objeto mínimo construido para las pruebas.
 *   - AuthError del backend: { code: string; message: string } (según interceptor de apiClient).
 *
 * Ejecutar: npx jest src/__tests__/auth/Login.integration.test.tsx
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


jest.mock('../../features/auth/services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    register: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyTwoFactor: jest.fn(),
    resendTwoFactorCode: jest.fn(),
    enableTwoFactor: jest.fn(),
    disableTwoFactor: jest.fn(),
  },
}));


jest.mock('../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    updateUser: jest.fn(),
  }),
}));


import { LoginForm } from '../../features/auth/components/LoginForm';
import { PublicUser } from '../../features/auth/types/auth.types';


function getAuthServiceMock() {
  return jest.requireMock('../../features/auth/services/auth.service').authService;
}



function buildPublicUser(): PublicUser {
  return {
    id: 'user-001',
    email: 'ana@mail.com',
    document: '1234567890',
    firstName: 'Ana',
    middleName: null,
    lastName: 'Gómez',
    secondLastName: null,
    fullName: 'Ana Gómez',
    birthDate: '1995-03-10',
    phone: null,
    avatarUrl: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
}


async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(/correo electrónico/i), email);
  await userEvent.type(screen.getByLabelText(/contraseña/i), password);
  await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
}


describe('Login (sin 2FA) — Pruebas de integración (tabla de caminos Frontend↔Backend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Camino 1,2,3,17,F — datos inválidos en el formulario del cliente', () => {
    it('no realiza ninguna petición de red y muestra errores inline de validación', async () => {
      render(<LoginForm />);

      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      await waitFor(() => {
        expect(screen.queryByText(/correo electrónico inválido/i)).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).not.toHaveBeenCalled();
    });
  });

  describe('Camino 1,2,4,5,6,15,17,F — datos válidos en cliente, servidor responde 400 VALIDATION_ERROR', () => {
    it('muestra el mensaje de error devuelto por el servidor (VALIDATION_ERROR)', async () => {
      getAuthServiceMock().login.mockRejectedValue({
        code: 'VALIDATION_ERROR',
        message: 'El correo no tiene un formato válido',
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'abc123');

      await waitFor(() => {
        expect(screen.getByText('El correo no tiene un formato válido')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
    });
  });

  describe('Camino 1,2,4,5,7,8,9,15,17,F — servidor responde 401 INVALID_CREDENTIALS (correo no registrado)', () => {
    it("muestra 'Correo o contraseña incorrectos' cuando el correo no está registrado", async () => {
      getAuthServiceMock().login.mockRejectedValue({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      });

      render(<LoginForm />);
      await fillAndSubmit('noexiste@mail.com', 'abc123');

      await waitFor(() => {
        expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
      expect(getAuthServiceMock().login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'noexiste@mail.com' }),
      );
    });
  });

  describe('Camino 1,2,4,5,7,8,10,11,15,17,F — servidor responde 401 ACCOUNT_INACTIVE', () => {
    it("muestra 'Esta cuenta ha sido desactivada' cuando la cuenta está inactiva", async () => {
      getAuthServiceMock().login.mockRejectedValue({
        code: 'ACCOUNT_INACTIVE',
        message: 'Esta cuenta ha sido desactivada',
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'abc123');

      await waitFor(() => {
        expect(screen.getByText('Esta cuenta ha sido desactivada')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
    });
  });

  describe('Camino 1,2,4,5,7,8,10,12,13,15,17,F — servidor responde 401 INVALID_CREDENTIALS (password incorrecta)', () => {
    it("muestra 'Correo o contraseña incorrectos' cuando la contraseña es incorrecta", async () => {
      getAuthServiceMock().login.mockRejectedValue({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'wrongpassword');

      await waitFor(() => {
        expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
      expect(getAuthServiceMock().login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@mail.com', password: 'wrongpassword' }),
      );
    });
  });

  describe('Camino 1,2,4,5,7,8,10,12,14,16,17,F — servidor responde 200 login exitoso sin 2FA', () => {
    it('invoca authService.login con las credenciales correctas y no muestra ningún error', async () => {
      const publicUser = buildPublicUser();
      getAuthServiceMock().login.mockResolvedValue({
        requiresTwoFactor: false,
        token: 'jwt-token-definitivo',
        user: publicUser,
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'correcta123');

      await waitFor(() => {
        expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
        expect(getAuthServiceMock().login).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'ana@mail.com',
            password: 'correcta123',
          }),
        );
      });

      expect(screen.queryByText(/correo o contraseña incorrectos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cuenta ha sido desactivada/i)).not.toBeInTheDocument();
    });
  });
});
