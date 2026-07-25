import { apiClient } from '@/shared/services/api.client';
import {
  AuthResponse,
  TwoFactorVerifyResponse,
  TwoFactorResendResponse,
} from '../types/auth.types';
import {
  LoginInput,
  RegisterInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '../schemas/auth.schemas';

class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async forgotPassword(data: RequestPasswordResetInput): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordInput): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  }

  async logout(): Promise<void> {
    // We attempt to call the backend logout. Even if it fails (e.g. token expired), we still log out locally.
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout failed, proceeding with local logout', error);
    }
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────

  /**
   * Verifica el código OTP y obtiene el JWT definitivo.
   */
  async verifyTwoFactor(temporaryToken: string, code: string): Promise<TwoFactorVerifyResponse> {
    const response = await apiClient.post<TwoFactorVerifyResponse>('/auth/2fa/verify', {
      temporaryToken,
      code,
    });
    return response.data;
  }

  /**
   * Reenvía un nuevo código OTP al correo.
   */
  async resendTwoFactorCode(temporaryToken: string): Promise<TwoFactorResendResponse> {
    const response = await apiClient.post<TwoFactorResendResponse>('/auth/2fa/resend', {
      temporaryToken,
    });
    return response.data;
  }

  /**
   * Activa el 2FA para el usuario autenticado.
   */
  async enableTwoFactor(): Promise<void> {
    await apiClient.post('/auth/2fa/enable');
  }

  /**
   * Desactiva el 2FA para el usuario autenticado.
   */
  async disableTwoFactor(): Promise<void> {
    await apiClient.post('/auth/2fa/disable');
  }
}

export const authService = new AuthService();
