import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IVerificationCodeRepository } from '../../../domain/repositories/IVerificationCodeRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService, TokenOptions } from '../../interfaces/ITokenService';
import { IEmailService } from '../../interfaces/IEmailService';
import {
  LoginUserDto,
  LoginUserResponseDto,
} from '../../dtos/auth/auth.dtos';
import { AuthError } from '../../../shared/errors/AuthError';
import { GenerateTwoFactorCode } from './GenerateTwoFactorCode';

/**
 * Caso de Uso: Inicio de sesión.
 *
 * Flujo:
 * 1. Busca el usuario por email.
 * 2. Compara la contraseña con el hash almacenado.
 * 3. Verifica que la cuenta esté activa.
 * 4a. Si NO tiene 2FA: genera JWT directamente.
 * 4b. Si SÍ tiene 2FA: genera OTP → guarda hash → envía correo → retorna temporaryToken.
 *
 * Nota de seguridad: el mensaje de error es genérico para no revelar
 * si el email existe o no en el sistema (previene user enumeration).
 */
export class LoginUser {
  private readonly generateTwoFactorCode: GenerateTwoFactorCode;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly emailService: IEmailService,
  ) {
    this.generateTwoFactorCode = new GenerateTwoFactorCode(
      verificationCodeRepository,
      emailService,
      tokenService,
    );
  }

  async execute(dto: LoginUserDto): Promise<LoginUserResponseDto> {
    const genericError = new AuthError(
      'Correo o contraseña incorrectos',
      'INVALID_CREDENTIALS',
    );

    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    if (!user) throw genericError;

    // 2. Verificar que la cuenta esté activa
    if (!user.isActive) {
      throw new AuthError('Esta cuenta ha sido desactivada', 'ACCOUNT_INACTIVE');
    }

    // 3. Comparar contraseña
    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.getPasswordHash(),
    );
    if (!isPasswordValid) throw genericError;

    // 4a. Sin 2FA: generar JWT directamente
    if (!user.twoFactorEnabled) {
      const tokenOptions: TokenOptions = {
        expiresIn: dto.rememberMe ? '30d' : '7d',
      };
      const token = this.tokenService.generate(
        { userId: user.id, email: user.email.toString() },
        tokenOptions,
      );
      return {
        requiresTwoFactor: false,
        user: user.toPublic(),
        token,
      };
    }

    // 4b. Con 2FA: generar OTP y enviar al correo
    const { temporaryToken, maskedEmail } = await this.generateTwoFactorCode.execute(
      user.id,
      user.email.toString(),
    );

    return {
      requiresTwoFactor: true,
      temporaryToken,
      maskedEmail,
    };
  }
}
