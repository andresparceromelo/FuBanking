import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { profileService } from '@/features/profile/services/profile.service';

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }));

vi.mock('@/features/profile/services/profile.service', () => ({
  profileService: { updateProfile: vi.fn() },
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const updateProfile = profileService.updateProfile as unknown as ReturnType<typeof vi.fn>;

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should update, refresh auth state and call the callback', async () => {
    const updated = { id: 'u1', firstName: 'Maria' };
    updateProfile.mockResolvedValue(updated);
    localStorage.setItem('token', 'jwt');
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUpdateProfile(onSuccess));

    await act(async () => {
      await result.current.handleUpdate({ firstName: 'Maria' });
    });

    expect(updateProfile).toHaveBeenCalledWith({ firstName: 'Maria' });
    expect(mockLogin).toHaveBeenCalledWith(updated, 'jwt');
    expect(onSuccess).toHaveBeenCalledWith(updated);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should work without token and without callback', async () => {
    const updated = { id: 'u1' };
    updateProfile.mockResolvedValue(updated);
    const { result } = renderHook(() => useUpdateProfile());

    await act(async () => {
      await result.current.handleUpdate({ phone: '+57300' });
    });

    expect(mockLogin).toHaveBeenCalledWith(updated, '');
  });

  it('should set the server error on failure', async () => {
    updateProfile.mockRejectedValue({ code: 'VALIDATION_ERROR', message: 'Mal' });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUpdateProfile(onSuccess));

    await act(async () => {
      await result.current.handleUpdate({ firstName: 'X' });
    });

    expect(result.current.error).toEqual({ code: 'VALIDATION_ERROR', message: 'Mal' });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
