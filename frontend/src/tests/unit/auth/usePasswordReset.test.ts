import { expect as assert } from '@assertive-ts/core';
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
    assert(result.current.isSuccess).toBeTrue();
    expect(result.current.error).toBeNull();
  });

  it('should set error on request failure', async () => {
    forgotPassword.mockRejectedValue({ code: 'NOT_FOUND', message: 'No existe' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.requestReset({ email: 'a@b.co' });
    });

    assert(result.current.isSuccess).toBeFalse();
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
    assert(result.current.isSuccess).toBeTrue();
  });

  it('should set error on reset failure', async () => {
    resetPassword.mockRejectedValue({ code: 'TOKEN_INVALID', message: 'Expirado' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.resetPassword({ token: 'bad' } as never);
    });

    assert(result.current.isSuccess).toBeFalse();
    expect(result.current.error).toEqual({ code: 'TOKEN_INVALID', message: 'Expirado' });
    assert(result.current.isLoading).toBeFalse();
  });

  it('verifyToken should set status to valid', async () => {
    verifyResetToken.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('valid-token');
    });

    assert(result.current.tokenStatus).toBeEqual('valid');
  });

  it('verifyToken should set status to used if TOKEN_ALREADY_USED', async () => {
    verifyResetToken.mockRejectedValue({ code: 'TOKEN_ALREADY_USED' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('used-token');
    });

    assert(result.current.tokenStatus).toBeEqual('used');
  });

  it('verifyToken should set status to expired if TOKEN_EXPIRED', async () => {
    verifyResetToken.mockRejectedValue({ code: 'TOKEN_EXPIRED' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('expired-token');
    });

    assert(result.current.tokenStatus).toBeEqual('expired');
  });

  it('verifyToken should set status to invalid otherwise', async () => {
    verifyResetToken.mockRejectedValue({ code: 'TOKEN_INVALID' });
    const { result } = renderHook(() => usePasswordReset());

    await act(async () => {
      await result.current.verifyToken('bad-token');
    });

    assert(result.current.tokenStatus).toBeEqual('invalid');
  });
});
