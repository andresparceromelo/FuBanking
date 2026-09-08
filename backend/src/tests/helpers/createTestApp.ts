import express, { Application, Request, Response } from 'express';
import { Router } from 'express';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IVerificationCodeRepository } from '../../domain/repositories/IVerificationCodeRepository';
import { IPasswordService } from '../../application/interfaces/IPasswordService';
import { ITokenService } from '../../application/interfaces/ITokenService';
import { IEmailService } from '../../application/interfaces/IEmailService';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { LogoutUser } from '../../application/use-cases/auth/LogoutUser';
import { RequestPasswordReset } from '../../application/use-cases/auth/RequestPasswordReset';
import { ResetPassword } from '../../application/use-cases/auth/ResetPassword';
import { VerifyTwoFactorCode } from '../../application/use-cases/auth/VerifyTwoFactorCode';
import { EnableTwoFactor } from '../../application/use-cases/auth/EnableTwoFactor';
import { DisableTwoFactor } from '../../application/use-cases/auth/DisableTwoFactor';
import { ResendTwoFactorCode } from '../../application/use-cases/auth/ResendTwoFactorCode';
import { AuthController } from '../../presentation/controllers/AuthController';
import { TwoFactorController } from '../../presentation/controllers/TwoFactorController';
import { errorHandler } from '../../presentation/middlewares/errorHandler';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../fakes/InMemoryVerificationCodeRepository';
import { FakePasswordService } from '../fakes/FakePasswordService';
import { FakeTokenService } from '../fakes/FakeTokenService';
import { FakeEmailService } from '../fakes/FakeEmailService';
export interface TestDeps {
  userRepository: InMemoryUserRepository;
  verificationCodeRepository: InMemoryVerificationCodeRepository;
  passwordService: FakePasswordService;
  tokenService: FakeTokenService;
  emailService: FakeEmailService;
}
export interface TestApp {
  app: Application;
  deps: TestDeps;
}
export function createTestApp(overrides: Partial<{
  userRepository: IUserRepository;
  verificationCodeRepository: IVerificationCodeRepository;
  passwordService: IPasswordService;
  tokenService: ITokenService;
  emailService: IEmailService;
}> = {}): TestApp {
  const userRepository = (overrides.userRepository ?? new InMemoryUserRepository()) as InMemoryUserRepository;
  const verificationCodeRepository = (overrides.verificationCodeRepository ?? new InMemoryVerificationCodeRepository()) as InMemoryVerificationCodeRepository;
  const passwordService = (overrides.passwordService ?? new FakePasswordService()) as FakePasswordService;
  const tokenService = (overrides.tokenService ?? new FakeTokenService()) as FakeTokenService;
  const emailService = (overrides.emailService ?? new FakeEmailService()) as FakeEmailService;
  const deps: TestDeps = { userRepository, verificationCodeRepository, passwordService, tokenService, emailService };
  const registerUser = new RegisterUser(userRepository, passwordService, tokenService);
  const loginUser = new LoginUser(userRepository, passwordService, tokenService, verificationCodeRepository, emailService);
  const logoutUser = new LogoutUser();
  const requestPasswordReset = new RequestPasswordReset(userRepository, tokenService, emailService);
  const resetPassword = new ResetPassword(userRepository, passwordService, tokenService);
  const verifyTwoFactor = new VerifyTwoFactorCode(verificationCodeRepository, userRepository, passwordService, tokenService);
  const enableTwoFactor = new EnableTwoFactor(userRepository);
  const disableTwoFactor = new DisableTwoFactor(userRepository);
  const resendTwoFactor = new ResendTwoFactorCode(userRepository, verificationCodeRepository, emailService, tokenService, passwordService);
  const controller = new AuthController(registerUser, loginUser, logoutUser, requestPasswordReset, resetPassword);
  const twoFactorController = new TwoFactorController(verifyTwoFactor, enableTwoFactor, disableTwoFactor, resendTwoFactor);
  const authRouter = Router();
  authRouter.post('/register', controller.register);
  authRouter.post('/login', controller.login);
  authRouter.post('/forgot-password', controller.forgotPassword);
  authRouter.post('/reset-password', controller.resetPassword);
  authRouter.post('/2fa/verify', twoFactorController.verify);
  authRouter.post('/2fa/resend', twoFactorController.resend);
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
  });
  app.use(errorHandler);
  return { app, deps };
}
