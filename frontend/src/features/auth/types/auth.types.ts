export interface PublicUser {
  id: string;
  email: string;
  document: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  birthDate: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: string;
}

/** Respuesta del login cuando las credenciales son correctas y NO hay 2FA. */
export interface AuthDirectResponse {
  requiresTwoFactor: false;
  user: PublicUser;
  token: string;
}

/** Respuesta del login cuando se requiere verificación 2FA. */
export interface AuthTwoFactorResponse {
  requiresTwoFactor: true;
  temporaryToken: string;
  maskedEmail: string;
}

export type AuthResponse = AuthDirectResponse | AuthTwoFactorResponse;

export interface AuthError {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

/** Respuesta del endpoint verify-two-factor (JWT definitivo). */
export interface TwoFactorVerifyResponse {
  user: PublicUser;
  token: string;
}

/** Respuesta del endpoint resend-two-factor. */
export interface TwoFactorResendResponse {
  temporaryToken: string;
  maskedEmail: string;
}
