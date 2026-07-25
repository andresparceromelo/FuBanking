import { IVerificationCodeRepository } from '../../../domain/repositories/IVerificationCodeRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService, TokenOptions } from '../../interfaces/ITokenService';
import { VerifyTwoFactorDto, VerifyTwoFactorResponseDto } from '../../dtos/auth/auth.dtos';
import { AuthError } from '../../../shared/errors/AuthError';

/**
 * Caso de Uso: Verificar el código OTP de 2FA.
 *
 * Flujo:
 * 1. Verificar y decodificar el temporaryToken → obtener userId.
 * 2. Buscar el código de verificación más reciente del usuario.
 * 3. Validar: no expirado, no usado, no superó intentos.
 * 4. Comparar el código ingresado con el hash almacenado (bcrypt).
 * 5. Si es correcto: marcar como usado → generar JWT definitivo.
 * 6. Si es incorrecto: incrementar intentos y lanzar error.
 */
export class VerifyTwoFactorCode {
  constructor(
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: VerifyTwoFactorDto): Promise<VerifyTwoFactorResponseDto> {
    // 1. Verificar y decodificar el token temporal
    let payload: { userId: string; email: string };
    try {
      payload = this.tokenService.verify(dto.temporaryToken) as { userId: string; email: string };
    } catch {
      throw new AuthError('Token temporal inválido o expirado', 'TOKEN_INVALID');
    }

    // 2. Buscar el código de verificación más reciente
    const verificationCode = await this.verificationCodeRepository.findLatestByUserId(
      payload.userId,
    );

    if (!verificationCode) {
      throw new AuthError(
        'No existe un código de verificación activo. Solicita uno nuevo.',
        'INVALID_OTP',
      );
    }

    // 3a. Verificar que no esté ya utilizado
    if (verificationCode.isUsed()) {
      throw new AuthError(
        'Este código ya fue utilizado. Solicita un nuevo código.',
        'OTP_ALREADY_USED',
      );
    }

    // 3b. Verificar que no haya expirado
    if (verificationCode.isExpired()) {
      throw new AuthError(
        'El código ha expirado. Solicita un nuevo código.',
        'OTP_EXPIRED',
      );
    }

    // 3c. Verificar límite de intentos
    if (verificationCode.hasExceededAttempts()) {
      throw new AuthError(
        'Has superado el límite de intentos. Solicita un nuevo código.',
        'MAX_ATTEMPTS_REACHED',
      );
    }

    // 4. Comparar código ingresado con el hash almacenado
    const isCodeValid = await this.passwordService.compare(
      dto.code,
      verificationCode.codeHash,
    );

    if (!isCodeValid) {
      // Incrementar intentos y persistir
      verificationCode.incrementAttempts();
      await this.verificationCodeRepository.update(verificationCode);

      const remainingAttempts = 5 - verificationCode.attempts;
      throw new AuthError(
        `Código incorrecto. Te quedan ${remainingAttempts} intento${remainingAttempts === 1 ? '' : 's'}.`,
        'INVALID_OTP',
      );
    }

    // 5. Código correcto: marcar como usado
    verificationCode.markAsUsed();
    await this.verificationCodeRepository.update(verificationCode);

    // 6. Obtener datos completos del usuario
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // 7. Generar JWT definitivo
    const tokenOptions: TokenOptions = { expiresIn: '7d' };
    const token = this.tokenService.generate(
      { userId: user.id, email: user.email.toString() },
      tokenOptions,
    );

    return {
      user: user.toPublic(),
      token,
    };
  }
}
