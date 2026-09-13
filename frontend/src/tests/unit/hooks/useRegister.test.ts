import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { authService } from '@/features/auth/services/auth.service';

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { register: vi.fn() },
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const register = authService.register as unknown as ReturnType<typeof vi.fn>;

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register and login on success', async () => {
    const user = { id: 'u1' };
    register.mockResolvedValue({ user, token: 'jwt' });
    const { result } = renderHook(() => useRegister());
    const payload = { email: 'a@b.co', password: 'Segura123' };

    await act(async () => {
      await result.current.handleRegister(payload as never);
    });

    expect(register).toHaveBeenCalledWith(payload);
    expect(mockLogin).toHaveBeenCalledWith(user, 'jwt');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should set the server error on failure', async () => {
    register.mockRejectedValue({ code: 'EMAIL_ALREADY_EXISTS', message: 'Taken' });
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.handleRegister({ email: 'a@b.co' } as never);
    });

    expect(result.current.error).toEqual({ code: 'EMAIL_ALREADY_EXISTS', message: 'Taken' });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
