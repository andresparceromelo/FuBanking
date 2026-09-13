import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { IVerificationCodeRepository } from '../../../domain/repositories/IVerificationCodeRepository';
import { IEmailService } from '../../interfaces/IEmailService';
import { ITokenService } from '../../interfaces/ITokenService';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { VerificationCode } from '../../../domain/entities/VerificationCode';

/**
 * Caso de Uso: Generar y enviar código OTP de 2FA.
 *
 * Flujo:
 * 1. Invalida cualquier código anterior del usuario.
 * 2. Genera un OTP de 6 dígitos con crypto.randomInt() (NO Math.random()).
 * 3. Hashea el OTP con bcrypt antes de guardarlo.
 * 4. Persiste el código hasheado en la BD con expiración de 5 minutos.
 * 5. Envía el código en texto plano al correo.
 * 6. Genera y retorna un token temporal (válido 10 minutos).
 */
export class GenerateTwoFactorCode {
  constructor(
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly emailService: IEmailService,
    private readonly tokenService: ITokenService,
    private readonly passwordService?: IPasswordService,
  ) { }

  async execute(
    userId: string,
    email: string,
  ): Promise<{ temporaryToken: string; maskedEmail: string }> {
    await this.verificationCodeRepository.invalidateAllByUserId(userId);

    const plainCode = crypto.randomInt(100000, 999999).toString();

    const { hashCode } = await this.hashOtp(plainCode);

    const verificationCode = VerificationCode.create({
      id: randomUUID(),
      userId,
      codeHash: hashCode,
    });
    await this.verificationCodeRepository.save(verificationCode);

    await this.emailService.sendTwoFactorCode(email, plainCode);

    const temporaryToken = this.tokenService.generate(
      { userId, email },
      { expiresIn: '20s' },
    );

    const maskedEmail = this.maskEmail(email);

    return { temporaryToken, maskedEmail };
  }

  private async hashOtp(plainCode: string): Promise<{ hashCode: string }> {
    if (this.passwordService) {
      const hashCode = await this.passwordService.hash(plainCode);
      return { hashCode };
    }
    const bcrypt = await import('bcrypt');
    const hashCode = await bcrypt.hash(plainCode, 10);
    return { hashCode };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visibleChars = local.length > 2 ? 1 : 0;
    const masked = local.slice(0, visibleChars) + '***';
    return `${masked}@${domain}`;
  }
}
