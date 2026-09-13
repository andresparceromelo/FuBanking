import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTwoFactor } from '@/features/auth/hooks/useTwoFactor';
import { authService } from '@/features/auth/services/auth.service';

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { verifyTwoFactor: vi.fn(), resendTwoFactorCode: vi.fn() },
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const verifyTwoFactor = authService.verifyTwoFactor as unknown as ReturnType<typeof vi.fn>;
const resendTwoFactorCode = authService.resendTwoFactorCode as unknown as ReturnType<typeof vi.fn>;

describe('useTwoFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should fail verify without a temp token', async () => {
    const { result } = renderHook(() => useTwoFactor());

    await act(async () => {
      await result.current.handleVerify('123456');
    });

    expect(result.current.error).toEqual(
      expect.objectContaining({ code: 'TOKEN_INVALID' }),
    );
    expect(verifyTwoFactor).not.toHaveBeenCalled();
  });

  it('should verify, clear storage and login', async () => {
    sessionStorage.setItem('2fa_temp_token', 'tmp');
    sessionStorage.setItem('2fa_masked_email', 'a***@b.co');
    const user = { id: 'u1' };
    verifyTwoFactor.mockResolvedValue({ user, token: 'jwt' });
    const { result } = renderHook(() => useTwoFactor());

    await act(async () => {
      await result.current.handleVerify('123456');
    });

    expect(verifyTwoFactor).toHaveBeenCalledWith('tmp', '123456');
    expect(sessionStorage.getItem('2fa_temp_token')).toBeNull();
    expect(mockLogin).toHaveBeenCalledWith(user, 'jwt');
    expect(result.current.error).toBeNull();
  });

  it('should set the server error on verify failure', async () => {
    sessionStorage.setItem('2fa_temp_token', 'tmp');
    verifyTwoFactor.mockRejectedValue({ code: 'INVALID_OTP', message: 'Mal' });
    const { result } = renderHook(() => useTwoFactor());

    await act(async () => {
      await result.current.handleVerify('000000');
    });

    expect(result.current.error).toEqual({ code: 'INVALID_OTP', message: 'Mal' });
    expect(result.current.isLoading).toBe(false);
  });

  it('should fail resend without a temp token', async () => {
    const { result } = renderHook(() => useTwoFactor());

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.error).toEqual(
      expect.objectContaining({ code: 'TOKEN_INVALID' }),
    );
    expect(resendTwoFactorCode).not.toHaveBeenCalled();
  });

  it('should resend and refresh storage', async () => {
    vi.useFakeTimers();
    try {
      sessionStorage.setItem('2fa_temp_token', 'tmp');
      resendTwoFactorCode.mockResolvedValue({ temporaryToken: 'tmp2', maskedEmail: 'a***@b.co' });
      const { result } = renderHook(() => useTwoFactor());

      await act(async () => {
        await result.current.handleResend();
      });

      expect(sessionStorage.getItem('2fa_temp_token')).toBe('tmp2');
      expect(result.current.resendSuccess).toBe(true);
      expect(result.current.isResending).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(result.current.resendSuccess).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should set the server error on resend failure', async () => {
    sessionStorage.setItem('2fa_temp_token', 'tmp');
    resendTwoFactorCode.mockRejectedValue({ code: 'RATE_LIMIT', message: 'Espera' });
    const { result } = renderHook(() => useTwoFactor());

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.error).toEqual({ code: 'RATE_LIMIT', message: 'Espera' });
    expect(result.current.resendSuccess).toBe(false);
  });
});
