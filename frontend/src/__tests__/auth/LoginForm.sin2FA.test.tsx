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
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

// ── Estado mutable del mock useLogin ─────────────────────────────────────────
// Se usa un objeto mutable para poder variar entre tests sin re-registrar el mock.

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

// ── Import del componente (DESPUÉS de los mocks) ──────────────────────────────

import { LoginForm } from '../../features/auth/components/LoginForm';

// ── Suite principal ────────────────────────────────────────────────────────────

describe('LoginForm — Pruebas de caja blanca (tabla de caminos Componente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar estado del hook a valores neutros
    mockHookState = {
      handleLogin: mockHandleLogin,
      isLoading: false,
      error: null,
    };
  });

  // ── Camino 1,2,4,5,6,7,12,F ──────────────────────────────────────────────────
  describe('Camino 1,2,4,5,6,7,12,F — sin error previo, campos vacíos → formulario inválido en cliente', () => {
    it('muestra errores de validación inline y NO invoca handleLogin', async () => {
      // Arrange: hook sin error, formulario con campos vacíos
      render(<LoginForm />);

      // Verificar que NO hay banner de error previo
      expect(screen.queryByText(/correo o contraseña incorrectos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cuenta ha sido desactivada/i)).not.toBeInTheDocument();

      // Act: enviar el formulario sin completar ningún campo
      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      // Assert: errores de validación inline deben aparecer
      await waitFor(() => {
        // Zod/react-hook-form muestra estos mensajes al ser campos vacíos
        expect(screen.queryByText(/correo electrónico inválido/i)).toBeInTheDocument();
      });

      // handleLogin NO debe haber sido llamado (formulario inválido no pasa zodResolver)
      expect(mockHandleLogin).not.toHaveBeenCalled();
    });
  });

  // ── Camino 1,2,3,4,5,6,7,12,F ────────────────────────────────────────────────
  describe('Camino 1,2,3,4,5,6,7,12,F — error previo en hook + formulario inválido', () => {
    it('muestra el banner de error del hook Y los mensajes de validación inline al mismo tiempo', async () => {
      // Arrange: hook con error previo (ej. credenciales incorrectas de un intento anterior)
      mockHookState = {
        handleLogin: mockHandleLogin,
        isLoading: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' },
      };

      render(<LoginForm />);

      // El banner de error del hook debe estar visible desde el inicio
      expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();

      // Act: intentar enviar con campos vacíos.
      // NOTA: El campo email tiene type="email" — si se pone un valor sin @,
      // jsdom activa la constraint validation HTML5 y bloquea el submit antes
      // de que react-hook-form pueda llamar a onSubmit. Con ambos campos vacíos,
      // zodResolver recibe email='' y password='' y genera errores inline.
      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

      // Assert: AMBOS deben ser visibles simultáneamente
      await waitFor(() => {
        // Banner de error del hook (error de credenciales previo)
        expect(screen.getByText('Correo o contraseña incorrectos')).toBeInTheDocument();
        // Al menos un mensaje de validación inline debe aparecer
        const emailError = screen.queryByText(/correo electrónico inválido/i);
        const passwordError = screen.queryByText(/la contraseña es requerida/i);
        expect(emailError || passwordError).not.toBeNull();
      });

      // handleLogin NO invocado (formulario cliente inválido)
      expect(mockHandleLogin).not.toHaveBeenCalled();
    });
  });

  // ── Camino 1,2,4,5,6,8,9,10,12,F ─────────────────────────────────────────────
  describe('Camino 1,2,4,5,6,8,9,10,12,F — formulario válido, handleLogin simula 401', () => {
    it('invoca handleLogin con los datos del formulario (el error lo maneja el hook, no el componente)', async () => {
      // Arrange: hook sin error, handleLogin simula rechazo 401
      // El componente solo llama a handleLogin; el error resultante lo maneja el hook internamente.
      mockHandleLogin.mockResolvedValue(undefined); // se resuelve sin lanzar (el hook captura internamente)

      render(<LoginForm />);

      // Llenar formulario con credenciales válidas según formato (password incorrecta a nivel de backend)
      await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'ana@mail.com');
      await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong');

      // Act: enviar formulario
      await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

      // Assert: handleLogin debe haber sido invocado con los datos del formulario
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

  // ── Camino 1,2,4,5,6,8,9,11,12,F ─────────────────────────────────────────────
  describe('Camino 1,2,4,5,6,8,9,11,12,F — formulario válido, handleLogin simula OK', () => {
    it('invoca handleLogin con { email, password, rememberMe } correctos', async () => {
      // Arrange: hook sin error, handleLogin simula login exitoso
      mockHandleLogin.mockResolvedValue(undefined);

      render(<LoginForm />);

      // Llenar todos los campos del formulario correctamente
      await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'ana@mail.com');
      await userEvent.type(screen.getByLabelText(/contraseña/i), 'correcta123');

      // Marcar "Recuérdame" para verificar que el campo rememberMe se incluye
      const rememberMeCheckbox = screen.getByRole('checkbox');
      await userEvent.click(rememberMeCheckbox);

      // Act: enviar formulario
      await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

      // Assert: handleLogin invocado con los datos exactos del formulario
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

      // No debe mostrar ningún banner de error (useLogin.error es null)
      expect(screen.queryByText(/correo o contraseña incorrectos/i)).not.toBeInTheDocument();
    });
  });
});
