import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/shared/services/api.client';
import { profileService } from '@/features/profile/services/profile.service';

vi.mock('@/shared/services/api.client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}));

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as unknown as ReturnType<typeof vi.fn>;

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should GET /profile and return data', async () => {
    const profile = { id: 'u1', firstName: 'Ana' };
    get.mockResolvedValue({ data: profile });

    const result = await profileService.getProfile();

    expect(get).toHaveBeenCalledWith('/profile');
    expect(result).toEqual(profile);
  });

  it('should PATCH /profile with the payload', async () => {
    const profile = { id: 'u1', firstName: 'Maria' };
    patch.mockResolvedValue({ data: profile });
    const payload = { firstName: 'Maria' };

    const result = await profileService.updateProfile(payload as never);

    expect(patch).toHaveBeenCalledWith('/profile', payload);
    expect(result).toEqual(profile);
  });

  it('should POST multipart form data on uploadDocument', async () => {
    const profile = { id: 'u1', documentVerified: true };
    post.mockResolvedValue({ data: profile });
    const file = new File(['%PDF'], 'cedula.pdf', { type: 'application/pdf' });

    const result = await profileService.uploadDocument(file);

    expect(post).toHaveBeenCalledWith(
      '/profile/document',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    const sent = post.mock.calls[0][1] as FormData;
    expect(sent.get('document')).toBe(file);
    expect(result).toEqual(profile);
  });

  it('should propagate errors', async () => {
    get.mockRejectedValue({ code: 'UNAUTHORIZED', message: 'No' });

    await expect(profileService.getProfile()).rejects.toEqual({
      code: 'UNAUTHORIZED',
      message: 'No',
    });
  });
});
