import { PublicUser } from '@/features/auth/types/auth.types';

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: PublicUser;
}
