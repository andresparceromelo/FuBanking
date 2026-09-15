import { Request, Response, NextFunction } from 'express';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { LogoutUser } from '../../application/use-cases/auth/LogoutUser';
import { RequestPasswordReset } from '../../application/use-cases/auth/RequestPasswordReset';
import { ResetPassword } from '../../application/use-cases/auth/ResetPassword';
import { VerifyResetToken } from '../../application/use-cases/auth/VerifyResetToken';
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
} from '../validators/auth.validators';
import { sendSuccess } from '../../shared/utils/response';

/**
 * AuthController — capa de Presentación.
 *
 * Responsabilidad única: traducir HTTP → Use Case → HTTP.
 *
 * NO contiene lógica de negocio. Solo:
 * 1. Parsea y valida el body/query con Zod.
 * 2. Llama al caso de uso correspondiente.
 * 3. Envía la respuesta HTTP.
 */
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUser,
    private readonly loginUserUseCase: LoginUser,
    private readonly logoutUserUseCase: LogoutUser,
    private readonly requestPasswordResetUseCase: RequestPasswordReset,
    private readonly resetPasswordUseCase: ResetPassword,
    private readonly verifyResetTokenUseCase: VerifyResetToken,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = registerSchema.parse(req.body);
      const result = await this.registerUserUseCase.execute(dto);
      sendSuccess(res, result, 'Usuario registrado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.loginUserUseCase.execute(dto);
      sendSuccess(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.logoutUserUseCase.execute(req.user!.id);
      sendSuccess(res, null, 'Sesión cerrada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = requestPasswordResetSchema.parse(req.body);
      await this.requestPasswordResetUseCase.execute(dto);
      sendSuccess(res, null, 'Si el correo existe, recibirás un enlace de recuperación');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = resetPasswordSchema.parse(req.body);
      await this.resetPasswordUseCase.execute(dto);
      sendSuccess(res, null, 'Contraseña actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifica el estado del token de reset sin consumirlo.
   * Permite al frontend mostrar el estado correcto al cargar la vista.
   * GET /auth/verify-reset-token?token=...
   */
  verifyResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = verifyResetTokenSchema.parse(req.query);
      await this.verifyResetTokenUseCase.execute(dto);
      sendSuccess(res, null, 'El enlace de recuperación es válido');
    } catch (error) {
      next(error);
    }
  };
}
