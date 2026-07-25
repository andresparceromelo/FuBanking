import { useState } from 'react';
import { profileService } from '../services/profile.service';
import { UpdateProfileInput } from '../schemas/profile.schemas';
import { AuthError, PublicUser } from '@/features/auth/types/auth.types';
import { useAuth } from '@/shared/hooks/useAuth';

export function useUpdateProfile(onSuccessCallback?: (user: PublicUser) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { login } = useAuth(); // We can reuse login to update the global user state

  const handleUpdate = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await profileService.updateProfile(data);
      // Actualizar el estado global con el usuario modificado
      // Nota: Reusamos el token existente que está en localStorage
      const token = localStorage.getItem('token') || '';
      login(updatedUser, token);
      
      if (onSuccessCallback) {
        onSuccessCallback(updatedUser);
      }
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleUpdate,
    isLoading,
    error,
  };
}
