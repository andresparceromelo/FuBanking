'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { authService } from '../services/auth.service';
import { AuthError } from '../types/auth.types';

export function useTwoFactor() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { login } = useAuth();

  /**
   * Verifica el código OTP ingresado por el usuario.
   * Si es correcto, completa el login y redirige.
   */
  const handleVerify = useCallback(async (code: string) => {
    const temporaryToken = sessionStorage.getItem('2fa_temp_token');
    if (!temporaryToken) {
      setError({ code: 'TOKEN_INVALID', message: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyTwoFactor(temporaryToken, code);
      // Limpiar datos temporales del sessionStorage
      sessionStorage.removeItem('2fa_temp_token');
      sessionStorage.removeItem('2fa_masked_email');
      // Completar login
      login(response.user, response.token);
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  /**
   * Reenvía un nuevo código OTP al correo del usuario.
   * Actualiza el token temporal en sessionStorage.
   */
  const handleResend = useCallback(async () => {
    const temporaryToken = sessionStorage.getItem('2fa_temp_token');
    if (!temporaryToken) {
      setError({ code: 'TOKEN_INVALID', message: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
      return;
    }

    setIsResending(true);
    setError(null);
    setResendSuccess(false);
    try {
      const response = await authService.resendTwoFactorCode(temporaryToken);
      // Actualizar el nuevo token temporal
      sessionStorage.setItem('2fa_temp_token', response.temporaryToken);
      sessionStorage.setItem('2fa_masked_email', response.maskedEmail);
      setResendSuccess(true);
      // Limpiar mensaje de éxito después de 4 segundos
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsResending(false);
    }
  }, []);

  return {
    handleVerify,
    handleResend,
    isLoading,
    isResending,
    error,
    resendSuccess,
  };
}
