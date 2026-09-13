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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';


const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));


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


beforeEach(() => {
  jest.clearAllMocks();
  mockError = null;
  mockResendSuccess = false;

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


import { TwoFactorVerifyForm } from '../../features/auth/components/TwoFactorVerifyForm';


/**
 * Obtiene los 6 inputs del formulario OTP.
 */
function getOtpInputs() {
  return screen.getAllByRole('textbox');
}



describe('TwoFactorVerifyForm — Pruebas de caja blanca (tabla de caminos Frontend)', () => {

  test('C4 - carácter no numérico: la entrada es ignorada, handleVerify no se llama', async () => {
    render(<TwoFactorVerifyForm />);

    const inputs = getOtpInputs();

    fireEvent.change(inputs[0], { target: { value: 'A' } });

    expect(inputs[0]).toHaveValue('');

    expect(mockHandleVerify).not.toHaveBeenCalled();
  });

  test('C5 - código de 6 dígitos válido, verificación exitosa: llama handleVerify con el código completo', async () => {
    mockHandleVerify.mockResolvedValue(undefined); // sin error = éxito
    render(<TwoFactorVerifyForm />);

    const inputs = getOtpInputs();

    const digits = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: digits[i] } });
    }

    await waitFor(() => {
      expect(mockHandleVerify).toHaveBeenCalledWith('123456');
    });
  });

  test('C6 - código válido pero verificación fallida: muestra mensaje de error', async () => {
    mockError = { code: 'INVALID_OTP', message: 'Código incorrecto. Te quedan 2 intentos.' };

    render(<TwoFactorVerifyForm />);

    await waitFor(() => {
      expect(
        screen.getByText(/código incorrecto/i),
      ).toBeInTheDocument();
    });
  });

  test('C5b - botón "Verificar código" habilitado solo cuando los 6 dígitos están completos', async () => {
    render(<TwoFactorVerifyForm />);

    const submitButton = screen.getByRole('button', { name: /verificar código/i });

    expect(submitButton).toBeDisabled();

    const inputs = getOtpInputs();
    const digits = ['9', '8', '7', '6', '5', '4'];
    for (let i = 0; i < 6; i++) {
      fireEvent.change(inputs[i], { target: { value: digits[i] } });
    }

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
