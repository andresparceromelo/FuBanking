import { useState } from 'react';
import { authService } from '../services/auth.service';
import { RequestPasswordResetInput, ResetPasswordInput } from '../schemas/auth.schemas';
import { AuthError } from '../types/auth.types';

export function usePasswordReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const requestReset = async (data: RequestPasswordResetInput) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await authService.forgotPassword(data);
      setIsSuccess(true);
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestReset,
    resetPassword,
    isLoading,
    error,
    isSuccess,
  };
}
