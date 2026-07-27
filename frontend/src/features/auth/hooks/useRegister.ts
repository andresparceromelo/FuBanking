import { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { authService } from '../services/auth.service';
import { RegisterInput } from '../schemas/auth.schemas';
import { AuthError } from '../types/auth.types';

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { login } = useAuth();

  const handleRegister = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      login(response.user, response.token);
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleRegister,
    isLoading,
    error,
  };
}
