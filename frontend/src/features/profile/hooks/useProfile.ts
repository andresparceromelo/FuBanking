import { useState, useEffect } from 'react';
import { profileService } from '../services/profile.service';
import { PublicUser } from '@/features/auth/types/auth.types';
import { AuthError } from '@/features/auth/types/auth.types';

export function useProfile() {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
