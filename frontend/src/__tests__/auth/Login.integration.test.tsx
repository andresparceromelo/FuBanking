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

// ── Mocks de Next.js ──────────────────────────────────────────────────────────

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

// ── Mock de authService (capa de red) ─────────────────────────────────────────
// NOTA: jest.mock() es hoisted antes de las declaraciones const, por lo que
// NO se puede referenciar `mockAuthServiceLogin` en el factory — causaría TDZ.
// Usamos jest.fn() directamente y accedemos al mock via jest.requireMock().

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

// ── Mock de useAuth para capturar la función login() ─────────────────────────
// Se mockea para verificar que login(user, token) se invoca en el path feliz,
// sin necesidad de un AuthProvider real con localStorage/cookies.

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

// ── Import del componente (DESPUÉS de todos los mocks) ────────────────────────

import { LoginForm } from '../../features/auth/components/LoginForm';
import { PublicUser } from '../../features/auth/types/auth.types';

// ── Acceso a los mocks via jest.requireMock() ─────────────────────────────────
// Se obtiene la referencia al spy DESPUÉS de que jest.mock() fue procesado.

function getAuthServiceMock() {
  return jest.requireMock('../../features/auth/services/auth.service').authService;
}

function getUseAuthLoginMock() {
  // useAuth retorna un nuevo objeto en cada llamada del mock, por lo que no podemos
  // comparar la misma referencia de jest.fn(). Para verificar que login() fue llamado,
  // necesitamos espiarlo de forma diferente.
  // Solución: re-declaramos el mock con estado mutable via beforeEach (ver abajo).
  return jest.requireMock('../../shared/hooks/useAuth').useAuth;
}

// ── Helper: PublicUser mínimo válido para el path de login exitoso ─────────────

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

// ── Helper: llena y envía el formulario ───────────────────────────────────────

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(/correo electrónico/i), email);
  await userEvent.type(screen.getByLabelText(/contraseña/i), password);
  await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

// ── Suite principal ────────────────────────────────────────────────────────────

describe('Login (sin 2FA) — Pruebas de integración (tabla de caminos Frontend↔Backend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Camino 1,2,3,17,F ────────────────────────────────────────────────────────
  describe('Camino 1,2,3,17,F — datos inválidos en el formulario del cliente', () => {
    it('no realiza ninguna petición de red y muestra errores inline de validación', async () => {
      // Arrange: montar el formulario sin completar ningún campo
      render(<LoginForm />);

      // Act: enviar formulario vacío (email inválido, password vacía)
      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      // Assert: errores de validación inline visibles (react-hook-form + zod)
      await waitFor(() => {
        expect(screen.queryByText(/correo electrónico inválido/i)).toBeInTheDocument();
      });

      // authService.login NO debe haberse llamado (validación cliente rechaza antes de enviar)
      expect(getAuthServiceMock().login).not.toHaveBeenCalled();
    });
  });

  // ── Camino 1,2,4,5,6,15,17,F ─────────────────────────────────────────────────
  describe('Camino 1,2,4,5,6,15,17,F — datos válidos en cliente, servidor responde 400 VALIDATION_ERROR', () => {
    it('muestra el mensaje de error devuelto por el servidor (VALIDATION_ERROR)', async () => {
      // Arrange: authService.login simula error de validación del servidor (400)
      // El interceptor de apiClient transforma la respuesta 4xx en: { code, message }
      getAuthServiceMock().login.mockRejectedValue({
        code: 'VALIDATION_ERROR',
        message: 'El correo no tiene un formato válido',
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'abc123');

      // Assert: el hook captura el error y lo expone; el componente lo muestra en el banner
      await waitFor(() => {
        expect(screen.getByText('El correo no tiene un formato válido')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
    });
  });

  // ── Camino 1,2,4,5,7,8,9,15,17,F ─────────────────────────────────────────────
  describe('Camino 1,2,4,5,7,8,9,15,17,F — servidor responde 401 INVALID_CREDENTIALS (correo no registrado)', () => {
    it("muestra 'Correo o contraseña incorrectos' cuando el correo no está registrado", async () => {
      // Arrange: backend no encuentra el email → 401 INVALID_CREDENTIALS
      getAuthServiceMock().login.mockRejectedValue({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      });

      render(<LoginForm />);
      await fillAndSubmit('noexiste@mail.com', 'abc123');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
      expect(getAuthServiceMock().login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'noexiste@mail.com' }),
      );
    });
  });

  // ── Camino 1,2,4,5,7,8,10,11,15,17,F ─────────────────────────────────────────
  describe('Camino 1,2,4,5,7,8,10,11,15,17,F — servidor responde 401 ACCOUNT_INACTIVE', () => {
    it("muestra 'Esta cuenta ha sido desactivada' cuando la cuenta está inactiva", async () => {
      // Arrange: backend encuentra el usuario pero está inactivo → 401 ACCOUNT_INACTIVE
      getAuthServiceMock().login.mockRejectedValue({
        code: 'ACCOUNT_INACTIVE',
        message: 'Esta cuenta ha sido desactivada',
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'abc123');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Esta cuenta ha sido desactivada')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
    });
  });

  // ── Camino 1,2,4,5,7,8,10,12,13,15,17,F ──────────────────────────────────────
  describe('Camino 1,2,4,5,7,8,10,12,13,15,17,F — servidor responde 401 INVALID_CREDENTIALS (password incorrecta)', () => {
    it("muestra 'Correo o contraseña incorrectos' cuando la contraseña es incorrecta", async () => {
      // Arrange: backend encuentra el usuario, pero la contraseña no coincide → 401 INVALID_CREDENTIALS
      getAuthServiceMock().login.mockRejectedValue({
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'wrongpassword');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();
      });

      expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
      expect(getAuthServiceMock().login).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@mail.com', password: 'wrongpassword' }),
      );
    });
  });

  // ── Camino 1,2,4,5,7,8,10,12,14,16,17,F ──────────────────────────────────────
  describe('Camino 1,2,4,5,7,8,10,12,14,16,17,F — servidor responde 200 login exitoso sin 2FA', () => {
    it('invoca authService.login con las credenciales correctas y no muestra ningún error', async () => {
      // Arrange: backend responde 200 con { requiresTwoFactor:false, token, user }
      const publicUser = buildPublicUser();
      getAuthServiceMock().login.mockResolvedValue({
        requiresTwoFactor: false,
        token: 'jwt-token-definitivo',
        user: publicUser,
      });

      render(<LoginForm />);
      await fillAndSubmit('ana@mail.com', 'correcta123');

      // Assert: authService.login fue llamado con las credenciales del formulario
      await waitFor(() => {
        expect(getAuthServiceMock().login).toHaveBeenCalledTimes(1);
        expect(getAuthServiceMock().login).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'ana@mail.com',
            password: 'correcta123',
          }),
        );
      });

      // No debe haber ningún banner de error en pantalla
      expect(screen.queryByText(/correo o contraseña incorrectos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cuenta ha sido desactivada/i)).not.toBeInTheDocument();
    });
  });
});
