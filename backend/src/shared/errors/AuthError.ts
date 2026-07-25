import { AppError } from './AppError';

/**
 * Errores relacionados con autenticación y autorización.
 */
export class AuthError extends AppError {
  constructor(message: string, code: AuthErrorCode = 'UNAUTHORIZED') {
    const statusCode = code === 'FORBIDDEN' ? 403 : 401;
    super(message, statusCode, code);
  }
}

export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'EMAIL_ALREADY_EXISTS'
  | 'DOCUMENT_ALREADY_EXISTS'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_INACTIVE'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_ALREADY_USED'
  | 'MAX_ATTEMPTS_REACHED'
  | 'TWO_FACTOR_REQUIRED';
