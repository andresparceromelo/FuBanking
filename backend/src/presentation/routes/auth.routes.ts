import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { TwoFactorController } from '../controllers/TwoFactorController';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { LogoutUser } from '../../application/use-cases/auth/LogoutUser';
import { RequestPasswordReset } from '../../application/use-cases/auth/RequestPasswordReset';
import { ResetPassword } from '../../application/use-cases/auth/ResetPassword';
import { VerifyResetToken } from '../../application/use-cases/auth/VerifyResetToken';
import { EnableTwoFactor } from '../../application/use-cases/auth/EnableTwoFactor';
import { DisableTwoFactor } from '../../application/use-cases/auth/DisableTwoFactor';
import { VerifyTwoFactorCode } from '../../application/use-cases/auth/VerifyTwoFactorCode';
import { ResendTwoFactorCode } from '../../application/use-cases/auth/ResendTwoFactorCode';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseVerificationCodeRepository } from '../../infrastructure/repositories/SupabaseVerificationCodeRepository';
import { SupabaseResetTokenRepository } from '../../infrastructure/repositories/SupabaseResetTokenRepository';
import { BcryptPasswordService } from '../../infrastructure/services/BcryptPasswordService';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { NodemailerEmailService } from '../../infrastructure/services/NodemailerEmailService';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';
import { createRateLimiter } from '../middlewares/rateLimitMiddleware';
import { env } from '../../shared/config/env';

/**
 * Rutas de autenticación: /api/v1/auth
 *
 * Este archivo actúa como el Composition Root del módulo de autenticación:
 * instancia todas las dependencias y las inyecta en los casos de uso y controller.
 */
const router = Router();

const userRepository = new SupabaseUserRepository(supabaseClient);
const verificationCodeRepository = new SupabaseVerificationCodeRepository(supabaseClient);
const resetTokenRepository = new SupabaseResetTokenRepository(supabaseClient);
const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService();
const emailService = new NodemailerEmailService();

const registerUser = new RegisterUser(userRepository, passwordService, tokenService);
const loginUser = new LoginUser(
  userRepository,
  passwordService,
  tokenService,
  verificationCodeRepository,
  emailService,
);
const logoutUser = new LogoutUser();
const requestPasswordReset = new RequestPasswordReset(
  userRepository,
  tokenService,
  emailService,
  resetTokenRepository,
);
const resetPassword = new ResetPassword(
  userRepository,
  passwordService,
  tokenService,
  resetTokenRepository,
);
const verifyResetToken = new VerifyResetToken(tokenService, resetTokenRepository);

const verifyTwoFactor = new VerifyTwoFactorCode(
  verificationCodeRepository,
  userRepository,
  passwordService,
  tokenService,
);
const enableTwoFactor = new EnableTwoFactor(userRepository);
const disableTwoFactor = new DisableTwoFactor(userRepository);
const resendTwoFactor = new ResendTwoFactorCode(
  userRepository,
  verificationCodeRepository,
  emailService,
  tokenService,
  passwordService,
);

/**
 * Rate limiter para el endpoint de reenvío de código 2FA.
 * Usa el temporaryToken como clave (si está disponible), o la IP como fallback.
 * Configurable via RESEND_RATE_LIMIT_MAX y RESEND_RATE_LIMIT_WINDOW_MS.
 */
const resendRateLimiter = createRateLimiter({
  maxRequests: env.RESEND_RATE_LIMIT_MAX,
  windowMs: env.RESEND_RATE_LIMIT_WINDOW_MS,
  keyExtractor: (req) => {
    const token = (req.body as Record<string, unknown>)?.temporaryToken;
    if (typeof token === 'string' && token.length > 0) {
      return `resend:token:${token}`;
    }
    return `resend:ip:${req.ip ?? 'unknown'}`;
  },
});

const controller = new AuthController(
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
);

const twoFactorController = new TwoFactorController(
  verifyTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  resendTwoFactor,
);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.get('/verify-reset-token', controller.verifyResetToken);

router.post('/2fa/verify', twoFactorController.verify);
router.post('/2fa/resend', resendRateLimiter, twoFactorController.resend);

router.post('/logout', authMiddleware, controller.logout);
router.post('/2fa/enable', authMiddleware, twoFactorController.enable);
router.post('/2fa/disable', authMiddleware, twoFactorController.disable);

export default router;
