import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';
import { authService } from '@/features/auth/services/auth.service';

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { forgotPassword: vi.fn(), resetPassword: vi.fn() },
}));

const forgotPassword = authService.forgotPassword as unknown as ReturnType<typeof vi.fn>;
const resetPassword = authService.resetPassword as unknown as ReturnType<typeof vi.fn>;

describe('usePasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark success on request', async () => {
    forgotPassword.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.requestReset({ email: 'a@b.co' });
    });

    expect(forgotPassword).toHaveBeenCalledWith({ email: 'a@b.co' });
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set error on request failure', async () => {
    forgotPassword.mockRejectedValue({ code: 'NOT_FOUND', message: 'No existe' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.requestReset({ email: 'a@b.co' });
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual({ code: 'NOT_FOUND', message: 'No existe' });
  });

  it('should mark success on reset', async () => {
    resetPassword.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordReset());
    const payload = { token: 't', newPassword: 'Segura123', confirmPassword: 'Segura123' };

    await act(async () => {
      await result.current.resetPassword(payload as never);
    });

    expect(resetPassword).toHaveBeenCalledWith(payload);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should set error on reset failure', async () => {
    resetPassword.mockRejectedValue({ code: 'TOKEN_INVALID', message: 'Expirado' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.resetPassword({ token: 'bad' } as never);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual({ code: 'TOKEN_INVALID', message: 'Expirado' });
    expect(result.current.isLoading).toBe(false);
  });
});
