import { IVerificationCodeRepository } from '../../../domain/repositories/IVerificationCodeRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService, TokenOptions } from '../../interfaces/ITokenService';
import { VerifyTwoFactorDto, VerifyTwoFactorResponseDto } from '../../dtos/auth/auth.dtos';
import { AuthError } from '../../../shared/errors/AuthError';

/**
 * Caso de Uso: Verificar el código OTP de 2FA.
 *
 * Flujo de Seguridad Bancaria (Política de 1 solo intento):
 * 1. Verificar y decodificar el temporaryToken → obtener userId y rememberMe.
 * 2. Buscar el código de verificación más reciente del usuario.
 * 3. Validar: no expirado, no usado, no superó intentos (1 intento).
 * 4. Comparar el código ingresado con el hash almacenado (bcrypt).
 * 5. Si es correcto: marcar como usado → generar JWT definitivo.
 * 6. Si es incorrecto: incrementar intento, marcarlo como usado/anulado de inmediato y lanzar MAX_ATTEMPTS_REACHED.
 *
 * Seguridad:
 * - rememberMe se recupera del payload del temporaryToken (generado en el primer paso).
 *   No se acepta rememberMe directamente del cliente en este paso para evitar manipulación.
 */
export class VerifyTwoFactorCode {
  constructor(
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: VerifyTwoFactorDto): Promise<VerifyTwoFactorResponseDto> {
    let payload: { userId: string; email: string; rememberMe?: boolean };
    try {
      payload = this.tokenService.verify(dto.temporaryToken);
    } catch (err: unknown) {
      const isExpired =
        err instanceof Error && err.message.toLowerCase().includes('expired');
      if (isExpired) {
        throw new AuthError(
          'El código ha expirado, por favor solicita uno nuevo.',
          'TOKEN_EXPIRED',
        );
      }
      throw new AuthError('Token temporal inválido o expirado', 'TOKEN_INVALID');
    }

    const verificationCode = await this.verificationCodeRepository.findLatestByUserId(
      payload.userId,
    );

    if (!verificationCode) {
      throw new AuthError(
        'No existe un código de verificación activo. Solicita uno nuevo.',
        'INVALID_OTP',
      );
    }

    if (verificationCode.isUsed()) {
      throw new AuthError(
        'Este código ya fue utilizado o anulado. Solicita un nuevo código.',
        'OTP_ALREADY_USED',
      );
    }

    if (verificationCode.isExpired()) {
      throw new AuthError(
        'El código ha expirado. Solicita un nuevo código.',
        'OTP_EXPIRED',
      );
    }

    if (verificationCode.hasExceededAttempts()) {
      throw new AuthError(
        'Has superado el límite de intentos permitidos (1 intento). Solicita un nuevo código o reinicia el inicio de sesión.',
        'MAX_ATTEMPTS_REACHED',
      );
    }

    const isCodeValid = await this.passwordService.compare(
      dto.code,
      verificationCode.codeHash,
    );

    if (!isCodeValid) {
      verificationCode.incrementAttempts();
      verificationCode.markAsUsed();
      await this.verificationCodeRepository.update(verificationCode);

      throw new AuthError(
        'Código incorrecto. Por motivos de seguridad bancaria se ha anulado el código (política de 1 solo intento). Debes reiniciar el proceso de inicio de sesión.',
        'MAX_ATTEMPTS_REACHED',
      );
    }

    verificationCode.markAsUsed();
    await this.verificationCodeRepository.update(verificationCode);

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // rememberMe proviene del temporaryToken (primer paso del login), no del cliente.
    const tokenOptions: TokenOptions = {
      expiresIn: payload.rememberMe ? '30d' : '7d',
    };
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
