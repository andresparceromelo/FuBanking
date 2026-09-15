import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePasswordReset } from '@/features/auth/hooks/usePasswordReset';
import { authService } from '@/features/auth/services/auth.service';

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyResetToken: vi.fn() },
}));

const forgotPassword = authService.forgotPassword as unknown as ReturnType<typeof vi.fn>;
const resetPassword = authService.resetPassword as unknown as ReturnType<typeof vi.fn>;
const verifyResetToken = authService.verifyResetToken as unknown as ReturnType<typeof vi.fn>;

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

  it('verifyToken should set status to valid', async () => {
    verifyResetToken.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('valid-token');
    });

    expect(result.current.tokenStatus).toBe('valid');
  });

  it('verifyToken should set status to used if TOKEN_ALREADY_USED', async () => {
    verifyResetToken.mockRejectedValue({ code: 'TOKEN_ALREADY_USED' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('used-token');
    });

    expect(result.current.tokenStatus).toBe('used');
  });

  it('verifyToken should set status to expired if TOKEN_EXPIRED', async () => {
    verifyResetToken.mockRejectedValue({ code: 'TOKEN_EXPIRED' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('expired-token');
    });

    expect(result.current.tokenStatus).toBe('expired');
  });

  it('verifyToken should set status to invalid otherwise', async () => {
    verifyResetToken.mockRejectedValue({ code: 'TOKEN_INVALID' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('bad-token');
    });

    expect(result.current.tokenStatus).toBe('invalid');
  });
});
