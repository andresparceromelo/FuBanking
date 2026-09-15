import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IVerificationCodeRepository } from '../../../domain/repositories/IVerificationCodeRepository';
import { IEmailService } from '../../interfaces/IEmailService';
import { ITokenService } from '../../interfaces/ITokenService';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ResendTwoFactorDto } from '../../dtos/auth/auth.dtos';
import { AuthError } from '../../../shared/errors/AuthError';
import { GenerateTwoFactorCode } from './GenerateTwoFactorCode';

/**
 * Caso de Uso: Reenviar código OTP de 2FA.
 *
 * Flujo:
 * 1. Verificar y decodificar el temporaryToken → obtener userId y rememberMe.
 * 2. Verificar que el usuario existe.
 * 3. Generar y enviar un nuevo código (invalida el anterior automáticamente).
 * 4. Retornar un nuevo temporaryToken (conservando rememberMe) y el email enmascarado.
 *
 * Seguridad:
 * - rememberMe se preserva del token anterior, no se acepta del cliente.
 */
export class ResendTwoFactorCode {
  private readonly generateTwoFactorCode: GenerateTwoFactorCode;

  constructor(
    private readonly userRepository: IUserRepository,
    verificationCodeRepository: IVerificationCodeRepository,
    emailService: IEmailService,
    private readonly tokenService: ITokenService,
    passwordService: IPasswordService,
  ) {
    this.generateTwoFactorCode = new GenerateTwoFactorCode(
      verificationCodeRepository,
      emailService,
      tokenService,
      passwordService,
    );
  }

  async execute(
    dto: ResendTwoFactorDto,
  ): Promise<{ temporaryToken: string; maskedEmail: string }> {
    let payload: { userId: string; email: string; rememberMe?: boolean };
    try {
      payload = this.tokenService.verify(dto.temporaryToken) as {
        userId: string;
        email: string;
        rememberMe?: boolean;
      };
    } catch {
      throw new AuthError('Token temporal inválido o expirado', 'TOKEN_INVALID');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // Preservar rememberMe del token anterior para no perder la preferencia del usuario.
    const result = await this.generateTwoFactorCode.execute(
      user.id,
      user.email.toString(),
      payload.rememberMe,
    );

    return result;
  }
}
