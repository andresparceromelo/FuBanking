import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IResetTokenRepository } from '../../../domain/repositories/IResetTokenRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService } from '../../interfaces/ITokenService';
import { ResetPasswordDto } from '../../dtos/auth/auth.dtos';
import { AppError } from '../../../shared/errors/AppError';
import { AuthError } from '../../../shared/errors/AuthError';
import { resolveValidResetToken } from './resetTokenValidation';

/**
 * Caso de Uso: Restablecer contraseña.
 *
 * Flujo:
 * 1. Valida que las contraseñas nuevas coincidan.
 * 2. Verifica el token JWT (debe ser de tipo 'reset').
 * 3. Verifica el estado del token en BD:
 *    - No existe → inválido.
 *    - ya_usado → TOKEN_ALREADY_USED (mensaje específico).
 *    - expirado → TOKEN_EXPIRED.
 * 4. Busca el usuario en BD.
 * 5. Hashea la nueva contraseña y actualiza.
 * 6. Marca el token como usado en BD.
 */
export class ResetPassword {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly resetTokenRepository: IResetTokenRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
    }

    const { email, tokenHash } = await resolveValidResetToken(
      this.tokenService,
      this.resetTokenRepository,
      dto.token,
    );

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);
    await this.userRepository.updatePassword(user.id, newPasswordHash);

    // Marca el token como consumido para evitar reutilización
    try {
      await this.resetTokenRepository.markAsUsed(tokenHash);
    } catch (err) {
      console.warn('⚠️ No se pudo marcar token como usado (BD no disponible):', (err as Error).message);
    }
  }
}
