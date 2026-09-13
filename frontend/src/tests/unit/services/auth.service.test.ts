import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '@/shared/services/api.client';
import { authService } from '@/features/auth/services/auth.service';

vi.mock('@/shared/services/api.client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), patch: vi.fn() },
}));

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should POST /auth/register and return data', async () => {
    const payload = { email: 'a@b.co', password: 'Segura123' };
    const response = { user: { id: 'u1' }, token: 't' };
    post.mockResolvedValue({ data: response });

    const result = await authService.register(payload as never);

    expect(post).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toEqual(response);
  });

  it('should POST /auth/login and return data', async () => {
    const payload = { email: 'a@b.co', password: 'Segura123' };
    const response = { requiresTwoFactor: false, user: { id: 'u1' }, token: 't' };
    post.mockResolvedValue({ data: response });

    const result = await authService.login(payload);

    expect(post).toHaveBeenCalledWith('/auth/login', payload);
    expect(result).toEqual(response);
  });

  it('should POST forgot/reset password without returning data', async () => {
    post.mockResolvedValue({ data: null });

    await authService.forgotPassword({ email: 'a@b.co' });
    expect(post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.co' });

    await authService.resetPassword({ token: 't', newPassword: 'Segura123', confirmPassword: 'Segura123' } as never);
    expect(post).toHaveBeenCalledWith('/auth/reset-password', expect.objectContaining({ token: 't' }));
  });

  it('should logout silently on server failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      post.mockResolvedValue({ data: null });
      await authService.logout();
      expect(post).toHaveBeenCalledWith('/auth/logout');

      post.mockRejectedValueOnce(new Error('down'));
      await expect(authService.logout()).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('should verify and resend 2FA codes', async () => {
    const verifyRes = { user: { id: 'u1' }, token: 'jwt' };
    post.mockResolvedValue({ data: verifyRes });

    const verified = await authService.verifyTwoFactor('tmp', '123456');
    expect(post).toHaveBeenCalledWith('/auth/2fa/verify', { temporaryToken: 'tmp', code: '123456' });
    expect(verified).toEqual(verifyRes);

    const resendRes = { temporaryToken: 'tmp2', maskedEmail: 'a***@b.co' };
    post.mockResolvedValue({ data: resendRes });

    const resent = await authService.resendTwoFactorCode('tmp');
    expect(post).toHaveBeenCalledWith('/auth/2fa/resend', { temporaryToken: 'tmp' });
    expect(resent).toEqual(resendRes);
  });

  it('should enable and disable 2FA', async () => {
    post.mockResolvedValue({ data: null });

    await authService.enableTwoFactor();
    expect(post).toHaveBeenCalledWith('/auth/2fa/enable');

    await authService.disableTwoFactor();
    expect(post).toHaveBeenCalledWith('/auth/2fa/disable');
  });

  it('should propagate errors', async () => {
    post.mockRejectedValue({ code: 'INVALID_CREDENTIALS', message: 'Bad' });

    await expect(authService.login({ email: 'a@b.co', password: 'x' })).rejects.toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Bad',
    });
  });
});
