import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { TwoFactorController } from '../controllers/TwoFactorController';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { LogoutUser } from '../../application/use-cases/auth/LogoutUser';
import { RequestPasswordReset } from '../../application/use-cases/auth/RequestPasswordReset';
import { ResetPassword } from '../../application/use-cases/auth/ResetPassword';
import { EnableTwoFactor } from '../../application/use-cases/auth/EnableTwoFactor';
import { DisableTwoFactor } from '../../application/use-cases/auth/DisableTwoFactor';
import { VerifyTwoFactorCode } from '../../application/use-cases/auth/VerifyTwoFactorCode';
import { ResendTwoFactorCode } from '../../application/use-cases/auth/ResendTwoFactorCode';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseVerificationCodeRepository } from '../../infrastructure/repositories/SupabaseVerificationCodeRepository';
import { BcryptPasswordService } from '../../infrastructure/services/BcryptPasswordService';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { NodemailerEmailService } from '../../infrastructure/services/NodemailerEmailService';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Rutas de autenticación: /api/v1/auth
 *
 * Este archivo actúa como el Composition Root del módulo de autenticación:
 * instancia todas las dependencias y las inyecta en los casos de uso y controller.
 */
const router = Router();

const userRepository = new SupabaseUserRepository(supabaseClient);
const verificationCodeRepository = new SupabaseVerificationCodeRepository(supabaseClient);
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
const requestPasswordReset = new RequestPasswordReset(userRepository, tokenService, emailService);
const resetPassword = new ResetPassword(userRepository, passwordService, tokenService);

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

const controller = new AuthController(
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
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

router.post('/2fa/verify', twoFactorController.verify);
router.post('/2fa/resend', twoFactorController.resend);

router.post('/logout', authMiddleware, controller.logout);
router.post('/2fa/enable', authMiddleware, twoFactorController.enable);
router.post('/2fa/disable', authMiddleware, twoFactorController.disable);

export default router;
