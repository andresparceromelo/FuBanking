import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { authService } from '@/features/auth/services/auth.service';

const { mockLogin, mockPush } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { login: vi.fn() },
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const login = authService.login as unknown as ReturnType<typeof vi.fn>;

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should login directly without 2FA', async () => {
    const user = { id: 'u1' };
    login.mockResolvedValue({ requiresTwoFactor: false, user, token: 'jwt' });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({ email: 'a@b.co', password: 'x' });
    });

    expect(mockLogin).toHaveBeenCalledWith(user, 'jwt');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should stash the temp token and redirect on 2FA', async () => {
    login.mockResolvedValue({
      requiresTwoFactor: true,
      temporaryToken: 'tmp',
      maskedEmail: 'a***@b.co',
    });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({ email: 'a@b.co', password: 'x' });
    });

    expect(sessionStorage.getItem('2fa_temp_token')).toBe('tmp');
    expect(sessionStorage.getItem('2fa_masked_email')).toBe('a***@b.co');
    expect(mockPush).toHaveBeenCalledWith('/verify-two-factor');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should set the server error on failure', async () => {
    login.mockRejectedValue({ code: 'INVALID_CREDENTIALS', message: 'Bad credentials' });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin({ email: 'a@b.co', password: 'x' });
    });

    expect(result.current.error).toEqual({ code: 'INVALID_CREDENTIALS', message: 'Bad credentials' });
    expect(result.current.isLoading).toBe(false);
  });
});
