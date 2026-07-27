'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/hooks/useAuth';
import { authService } from '../services/auth.service';
import { LoginInput } from '../schemas/auth.schemas';
import { AuthError } from '../types/auth.types';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);

      if (response.requiresTwoFactor) {
        // Redirigir a la pantalla 2FA pasando el temporaryToken y maskedEmail via sessionStorage
        sessionStorage.setItem('2fa_temp_token', response.temporaryToken);
        sessionStorage.setItem('2fa_masked_email', response.maskedEmail);
        router.push('/verify-two-factor');
      } else {
        // Login directo: guardar sesión y redirigir
        login(response.user, response.token);
      }
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleLogin,
    isLoading,
    error,
  };
}
