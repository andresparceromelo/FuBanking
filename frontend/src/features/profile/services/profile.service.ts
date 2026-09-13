import { apiClient } from '@/shared/services/api.client';
import { PublicUser } from '@/features/auth/types/auth.types';
import { UpdateProfileInput } from '../schemas/profile.schemas';

class ProfileService {
  async getProfile(): Promise<PublicUser> {
    const response = await apiClient.get<PublicUser>('/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileInput): Promise<PublicUser> {
    const response = await apiClient.patch<PublicUser>('/profile', data);
    return response.data;
  }

  async uploadDocument(file: File): Promise<PublicUser> {
    const formData = new FormData();
    formData.append('document', file);
    const response = await apiClient.post<PublicUser>('/profile/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export const profileService = new ProfileService();
