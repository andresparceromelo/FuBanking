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
 * 1. Verificar y decodificar el temporaryToken → obtener userId.
 * 2. Verificar que el usuario existe.
 * 3. Generar y enviar un nuevo código (invalida el anterior automáticamente).
 * 4. Retornar un nuevo temporaryToken y el email enmascarado.
 *
 * Anti-spam: el propio mecanismo de invalidación del código anterior
 * previene el abuso masivo. En producción se puede agregar un rate-limiter externo.
 */
export class ResendTwoFactorCode {
  private readonly generateTwoFactorCode: GenerateTwoFactorCode;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly emailService: IEmailService,
    private readonly tokenService: ITokenService,
    private readonly passwordService: IPasswordService,
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
    // 1. Verificar y decodificar token temporal
    let payload: { userId: string; email: string };
    try {
      payload = this.tokenService.verify(dto.temporaryToken) as { userId: string; email: string };
    } catch {
      throw new AuthError('Token temporal inválido o expirado', 'TOKEN_INVALID');
    }

    // 2. Verificar que el usuario existe
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // 3. Generar y enviar nuevo código (invalida automáticamente el anterior)
    const result = await this.generateTwoFactorCode.execute(
      user.id,
      user.email.toString(),
    );

    return result;
  }
}
