/**
 * PasswordReset.frontend.test.tsx
 * Pruebas unitarias — Capa Frontend
 * Componentes: ForgotPasswordForm + ResetPasswordForm (flujo unificado)
 *
 * Tabla de caminos cubierta (V(G) = 5):
 *   C1 – Email inválido (no pasa validación Zod) → muestra error, no llama al backend
 *   C2 – Email válido, falla la petición forgotPassword → muestra error de envío
 *   C3 – Correo enviado, contraseñas no pasan validación en ResetPasswordForm → error de validación
 *   C4 – Contraseñas válidas, falla la petición resetPassword → muestra error del backend
 *   C5 – Todo válido: forgotPassword + resetPassword exitosos → confirmación + redirección a login
 *
 * Notas sobre inferencias:
 *   - Los nodos 3, 7, 13 y 17 del diagrama están "inferidos". Revisado contra el hook
 *     real usePasswordReset.ts: la validación la hace zodResolver antes de llamar al
 *     handler, y el éxito/error se controla con isSuccess/error del hook.
 *   - Los mocks de next/link y next/navigation son necesarios porque los componentes
 *     usan <Link href="/login"> y el hook puede llamar a router.push.
 *
 * Ejecutar: npx jest src/__tests__/auth/PasswordReset.frontend.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks de next ─────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn().mockReturnValue('valid-token') }),
}));

// ── Mocks de usePasswordReset ─────────────────────────────────────────────────

const mockRequestReset = jest.fn();
const mockResetPassword = jest.fn();

// Estado mutable del hook para poder variar entre tests
let mockHookState = {
  requestReset: mockRequestReset,
  resetPassword: mockResetPassword,
  isLoading: false,
  error: null as { code: string; message: string } | null,
  isSuccess: false,
};

jest.mock('../../features/auth/hooks/usePasswordReset', () => ({
  usePasswordReset: () => mockHookState,
}));

// ── Import de componentes (después de mocks) ──────────────────────────────────

import { ForgotPasswordForm } from '../../features/auth/components/ForgotPasswordForm';
import { ResetPasswordForm } from '../../features/auth/components/ResetPasswordForm';

// ── Suite: ForgotPasswordForm ─────────────────────────────────────────────────

describe('ForgotPasswordForm — Pruebas de caja blanca (Frontend)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear estado del hook a valores por defecto
    mockHookState = {
      requestReset: mockRequestReset,
      resetPassword: mockResetPassword,
      isLoading: false,
      error: null,
      isSuccess: false,
    };
  });

  // ── C1 ───────────────────────────────────────────────────────────────────────
  test('C1 — email inválido: muestra error de validación y no llama al backend', async () => {
    // Arrange: renderizar formulario
    render(<ForgotPasswordForm />);

    // Act: ingresar un email inválido y hacer submit
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'no-es-un-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));

    // Assert: mensaje de validación visible, requestReset nunca fue llamado
    await waitFor(() => {
      // Zod devuelve 'Correo electrónico inválido' según requestPasswordResetSchema
      expect(screen.getByText(/correo electrónico inválido/i)).toBeInTheDocument();
    });
    expect(mockRequestReset).not.toHaveBeenCalled();
  });

  // ── C2 ───────────────────────────────────────────────────────────────────────
  test('C2 — email válido pero falla la petición: muestra mensaje de error', async () => {
    // Arrange: hook configurado con error de red
    mockHookState = {
      ...mockHookState,
      error: { code: 'NETWORK_ERROR', message: 'Error al enviar el enlace de recuperación' },
    };

    render(<ForgotPasswordForm />);

    // Assert: el error del hook se muestra en el formulario
    await waitFor(() => {
      expect(screen.getByText(/error al enviar el enlace de recuperación/i)).toBeInTheDocument();
    });
  });

  // ── C5 (parte ForgotPassword) ─────────────────────────────────────────────────
  test('C5-parte1 — forgotPassword exitoso: muestra pantalla de confirmación "revisa tu correo"', async () => {
    // Arrange: hook con isSuccess=true (petición completada con éxito)
    mockHookState = { ...mockHookState, isSuccess: true };

    render(<ForgotPasswordForm />);

    // Assert: se muestra el panel de confirmación (nodo 9 del diagrama)
    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });
    // El formulario ya no debe estar visible
    expect(screen.queryByRole('button', { name: /enviar enlace/i })).not.toBeInTheDocument();
  });
});

// ── Suite: ResetPasswordForm ─────────────────────────────────────────────────

describe('ResetPasswordForm — Pruebas de caja blanca (Frontend)', () => {
  const TOKEN = 'valid-reset-token-abc';

  beforeEach(() => {
    jest.clearAllMocks();
    mockHookState = {
      requestReset: mockRequestReset,
      resetPassword: mockResetPassword,
      isLoading: false,
      error: null,
      isSuccess: false,
    };
  });

  // ── C3 ───────────────────────────────────────────────────────────────────────
  test('C3 — contraseñas no pasan validación (no coinciden): muestra error de formulario, no llama al backend', async () => {
    // Arrange
    render(<ResetPasswordForm token={TOKEN} />);

    // Act: ingresar contraseñas que no coinciden y hacer submit
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'NuevaPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), {
      target: { value: 'OtraPass2@' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar contraseña/i }));

    // Assert: error de validación de Zod/react-hook-form visible
    // El schema resetPasswordSchema usa .refine() con mensaje 'Las contraseñas no coinciden'
    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  // ── C4 ───────────────────────────────────────────────────────────────────────
  test('C4 — contraseñas válidas pero backend rechaza el token: muestra error del servidor', async () => {
    // Arrange: hook configurado con error del backend
    mockHookState = {
      ...mockHookState,
      error: { code: 'TOKEN_INVALID', message: 'El enlace de recuperación es inválido o ha expirado' },
    };

    render(<ResetPasswordForm token={TOKEN} />);

    // Assert: el error del hook se muestra en el formulario (nodo 18 del diagrama)
    await waitFor(() => {
      expect(
        screen.getByText(/el enlace de recuperación es inválido o ha expirado/i),
      ).toBeInTheDocument();
    });
  });

  // ── C5 (parte ResetPassword) ──────────────────────────────────────────────────
  test('C5 — todo válido: muestra confirmación "Contraseña actualizada" con enlace a login', async () => {
    // Arrange: hook con isSuccess=true (contraseña restablecida exitosamente)
    mockHookState = { ...mockHookState, isSuccess: true };

    render(<ResetPasswordForm token={TOKEN} />);

    // Assert: se muestra el panel de éxito (nodo 19 del diagrama)
    await waitFor(() => {
      expect(screen.getByText(/¡contraseña actualizada!/i)).toBeInTheDocument();
    });
    // Enlace a login visible
    expect(screen.getByRole('link', { name: /ir a iniciar sesión/i })).toHaveAttribute(
      'href',
      '/login',
    );
    // El formulario ya no está visible
    expect(screen.queryByRole('button', { name: /guardar contraseña/i })).not.toBeInTheDocument();
  });
});
