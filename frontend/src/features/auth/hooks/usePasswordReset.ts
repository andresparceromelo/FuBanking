import { useState } from 'react';
import { authService } from '../services/auth.service';
import { RequestPasswordResetInput, ResetPasswordInput } from '../schemas/auth.schemas';
import { AuthError } from '../types/auth.types';

/** Estado de validez del token de restablecimiento. */
export type TokenStatus = 'idle' | 'loading' | 'valid' | 'expired' | 'used' | 'invalid';

export function usePasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('idle');

  const requestReset = async (data: RequestPasswordResetInput) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await authService.forgotPassword(data);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await authService.resetPassword(data);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifica el estado del token al cargar la vista de restablecimiento.
   * Distingue entre token expirado, ya usado e inválido.
   */
  const verifyToken = async (token: string) => {
    setTokenStatus('loading');
    try {
      await authService.verifyResetToken(token);
      setTokenStatus('valid');
    } catch (err: unknown) {
      const authErr = err as AuthError;
      if (authErr?.code === 'TOKEN_ALREADY_USED') {
        setTokenStatus('used');
      } else if (authErr?.code === 'TOKEN_EXPIRED') {
        setTokenStatus('expired');
      } else {
        setTokenStatus('invalid');
      }
    }
  };

  return {
    requestReset,
    resetPassword,
    verifyToken,
    isLoading,
    error,
    isSuccess,
    tokenStatus,
  };
}
