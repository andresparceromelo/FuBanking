import { Request, Response, NextFunction } from 'express';
import { VerifyTwoFactorCode } from '../../application/use-cases/auth/VerifyTwoFactorCode';
import { EnableTwoFactor } from '../../application/use-cases/auth/EnableTwoFactor';
import { DisableTwoFactor } from '../../application/use-cases/auth/DisableTwoFactor';
import { ResendTwoFactorCode } from '../../application/use-cases/auth/ResendTwoFactorCode';
import {
  verifyTwoFactorSchema,
  resendTwoFactorSchema,
} from '../validators/auth.validators';
import { sendSuccess } from '../../shared/utils/response';

/**
 * TwoFactorController — capa de Presentación.
 *
 * Responsabilidad única: traducir HTTP → Use Case → HTTP para el módulo 2FA.
 *
 * NO contiene lógica de negocio. Solo:
 * 1. Parsea y valida el body con Zod.
 * 2. Llama al caso de uso correspondiente.
 * 3. Envía la respuesta HTTP.
 */
export class TwoFactorController {
  constructor(
    private readonly verifyTwoFactorUseCase: VerifyTwoFactorCode,
    private readonly enableTwoFactorUseCase: EnableTwoFactor,
    private readonly disableTwoFactorUseCase: DisableTwoFactor,
    private readonly resendTwoFactorCodeUseCase: ResendTwoFactorCode,
  ) {}

  /**
   * POST /auth/2fa/verify
   * Verifica el código OTP y entrega el JWT definitivo.
   * Ruta pública (el temporaryToken sirve como identificador).
   */
  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = verifyTwoFactorSchema.parse(req.body);
      const result = await this.verifyTwoFactorUseCase.execute(dto);
      sendSuccess(res, result, 'Verificación exitosa. Bienvenido.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/2fa/enable
   * Activa el 2FA para el usuario autenticado.
   * Ruta protegida (requiere authMiddleware).
   */
  enable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.enableTwoFactorUseCase.execute(req.user!.id);
      sendSuccess(res, { user }, 'Autenticación de dos factores activada exitosamente.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/2fa/disable
   * Desactiva el 2FA para el usuario autenticado.
   * Ruta protegida (requiere authMiddleware).
   */
  disable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.disableTwoFactorUseCase.execute(req.user!.id);
      sendSuccess(res, { user }, 'Autenticación de dos factores desactivada exitosamente.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/2fa/resend
   * Reenvía un nuevo código OTP, invalidando el anterior.
   * Ruta pública (el temporaryToken sirve como identificador).
   */
  resend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = resendTwoFactorSchema.parse(req.body);
      const result = await this.resendTwoFactorCodeUseCase.execute(dto);
      sendSuccess(res, result, 'Código reenviado exitosamente. Revisa tu correo.');
    } catch (error) {
      next(error);
    }
  };
}
