/**
 * TwoFactorVerifyForm.test.tsx
 * Pruebas unitarias — Capa Frontend
 * Componente: TwoFactorVerifyForm
 *
 * Tabla de caminos cubierta:
 *   C4 – Código con carácter no numérico: la entrada es ignorada (no dispara verificación)
 *   C5 – Código válido (6 dígitos), verificación exitosa → llama handleVerify, redirige
 *   C6 – Código válido (6 dígitos), verificación fallida → muestra error, campos pueden limpiarse
 *
 * El hook useTwoFactor se mockea completamente.
 *
 * Ejecutar: jest src/__tests__/auth/TwoFactorVerifyForm.test.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock de next/navigation ───────────────────────────────────────────────────

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// ── Mock de useTwoFactor ──────────────────────────────────────────────────────

const mockHandleVerify = jest.fn();
const mockHandleResend = jest.fn();

let mockError: { code: string; message: string } | null = null;
let mockResendSuccess = false;

jest.mock('../../features/auth/hooks/useTwoFactor', () => ({
  useTwoFactor: () => ({
    handleVerify: mockHandleVerify,
    handleResend: mockHandleResend,
    isLoading: false,
    isResending: false,
    error: mockError,
    resendSuccess: mockResendSuccess,
  }),
}));

// ── Mock de sessionStorage ────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockError = null;
  mockResendSuccess = false;

  // Simular que hay email enmascarado guardado (prerrequisito para mostrar el formulario)
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((key: string) => {
        if (key === '2fa_masked_email') return 'j***@example.com';
        if (key === '2fa_temp_token') return 'temp-token-abc';
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });
});

// ── Import del componente (después de los mocks) ──────────────────────────────

import { TwoFactorVerifyForm } from '../../features/auth/components/TwoFactorVerifyForm';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Obtiene los 6 inputs del formulario OTP.
 */
function getOtpInputs() {
  return screen.getAllByRole('textbox');
}

/**
 * Escribe un dígito en el input en la posición indicada (0-indexed).
 */
async function typeDigit(inputs: HTMLElement[], index: number, char: string) {
  await userEvent.type(inputs[index], char);
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('TwoFactorVerifyForm — Pruebas de caja blanca (tabla de caminos Frontend)', () => {

  // ── C4 ───────────────────────────────────────────────────────────────────────
  test('C4 - carácter no numérico: la entrada es ignorada, handleVerify no se llama', async () => {
    // Entrada: requiresTwoFactor=true, codigoValido=false (letra 'A' en primer dígito)
    render(<TwoFactorVerifyForm />);

    const inputs = getOtpInputs();

    // Disparar el evento de cambio con un carácter no numérico
    fireEvent.change(inputs[0], { target: { value: 'A' } });

    // Prueba: el input no acepta el valor no numérico (handleChange hace return)
    // El valor permanece vacío o sin cambio
    expect(inputs[0]).toHaveValue('');

    // Salida: handleVerify nunca fue llamado
    expect(mockHandleVerify).not.toHaveBeenCalled();
  });

  // ── C5 ───────────────────────────────────────────────────────────────────────
  test('C5 - código de 6 dígitos válido, verificación exitosa: llama handleVerify con el código completo', async () => {
    // Entrada: requiresTwoFactor=true, codigoValido=true, verificacionExitosa=true
    mockHandleVerify.mockResolvedValue(undefined); // sin error = éxito
    render(<TwoFactorVerifyForm />);

    const inputs = getOtpInputs();

    // Escribir un dígito en cada campo
    const digits = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: digits[i] } });
    }

    // Salida: handleVerify llamado con el código completo '123456'
    await waitFor(() => {
      expect(mockHandleVerify).toHaveBeenCalledWith('123456');
    });
  });

  // ── C6 ───────────────────────────────────────────────────────────────────────
  test('C6 - código válido pero verificación fallida: muestra mensaje de error', async () => {
    // Entrada: requiresTwoFactor=true, codigoValido=true, verificacionExitosa=false
    // Simular que el hook devuelve un error
    mockError = { code: 'INVALID_OTP', message: 'Código incorrecto. Te quedan 2 intentos.' };

    render(<TwoFactorVerifyForm />);

    // Prueba & Salida: el mensaje de error debe estar visible en pantalla
    await waitFor(() => {
      expect(
        screen.getByText(/código incorrecto/i),
      ).toBeInTheDocument();
    });
  });

  // ── Extra: verificación del formulario completo vía botón Submit ──────────────
  test('C5b - botón "Verificar código" habilitado solo cuando los 6 dígitos están completos', async () => {
    render(<TwoFactorVerifyForm />);

    const submitButton = screen.getByRole('button', { name: /verificar código/i });

    // Con inputs vacíos el botón debe estar deshabilitado
    expect(submitButton).toBeDisabled();

    // Rellenar todos los inputs
    const inputs = getOtpInputs();
    const digits = ['9', '8', '7', '6', '5', '4'];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: digits[i] } });
    }

    // Ahora debería estar habilitado
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
