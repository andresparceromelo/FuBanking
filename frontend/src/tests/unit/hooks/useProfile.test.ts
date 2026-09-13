import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { profileService } from '@/features/profile/services/profile.service';

vi.mock('@/features/profile/services/profile.service', () => ({
  profileService: { getProfile: vi.fn() },
}));

const getProfile = profileService.getProfile as unknown as ReturnType<typeof vi.fn>;

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch the profile on mount', async () => {
    const profile = { id: 'u1', firstName: 'Ana' };
    getProfile.mockResolvedValue(profile);
    const { result } = renderHook(() => useProfile());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toEqual(profile);
    expect(result.current.error).toBeNull();
  });

  it('should set the error on failure', async () => {
    getProfile.mockRejectedValue({ code: 'UNAUTHORIZED', message: 'No' });
    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toEqual({ code: 'UNAUTHORIZED', message: 'No' });
  });

  it('should refetch on demand', async () => {
    const profile = { id: 'u1' };
    getProfile.mockResolvedValue(profile);
    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.refetch();
    });

    expect(getProfile).toHaveBeenCalledTimes(2);
    expect(result.current.profile).toEqual(profile);
  });
});
