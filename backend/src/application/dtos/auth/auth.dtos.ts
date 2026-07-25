/**
 * DTOs del módulo de Autenticación.
 *
 * Los DTOs son contratos de datos entre capas.
 * Son simples interfaces (sin lógica) que garantizan que
 * los datos que entran y salen de los casos de uso tienen la forma correcta.
 */

// ── Registro ──────────────────────────────────────────────────────────────

export interface RegisterUserDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate: string;
  email: string;
  document: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterUserResponseDto {
  user: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    fullName: string;
    birthDate: string;
    email: string;
    document: string;
    phone: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  token: string;
}

// ── Login ─────────────────────────────────────────────────────────────────

export interface LoginUserDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** Respuesta cuando el login es directo (sin 2FA). */
export interface LoginUserDirectResponseDto {
  requiresTwoFactor: false;
  user: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    fullName: string;
    birthDate: string;
    email: string;
    document: string;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
  };
  token: string;
}

/** Respuesta cuando el login requiere verificación 2FA. */
export interface LoginUserTwoFactorResponseDto {
  requiresTwoFactor: true;
  temporaryToken: string;
  maskedEmail: string;
}

export type LoginUserResponseDto = LoginUserDirectResponseDto | LoginUserTwoFactorResponseDto;

// ── 2FA ───────────────────────────────────────────────────────────────────

export interface VerifyTwoFactorDto {
  temporaryToken: string;
  code: string;
}

export interface VerifyTwoFactorResponseDto {
  user: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    fullName: string;
    birthDate: string;
    email: string;
    document: string;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
  };
  token: string;
}

export interface ResendTwoFactorDto {
  temporaryToken: string;
}

// ── Recuperación de contraseña ────────────────────────────────────────────

export interface RequestPasswordResetDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

