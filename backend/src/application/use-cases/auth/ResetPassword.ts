import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IResetTokenRepository } from '../../../domain/repositories/IResetTokenRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService } from '../../interfaces/ITokenService';
import { ResetPasswordDto } from '../../dtos/auth/auth.dtos';
import { AppError } from '../../../shared/errors/AppError';
import { AuthError } from '../../../shared/errors/AuthError';
import { hashToken } from '../../../infrastructure/repositories/SupabaseResetTokenRepository';

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

    let payload;
    try {
      payload = this.tokenService.verify(dto.token);
    } catch (error) {
      throw new AuthError('El enlace de recuperación es inválido o ha expirado', 'TOKEN_INVALID');
    }

    if (payload.type !== 'reset') {
      throw new AuthError('El enlace de recuperación es inválido', 'TOKEN_INVALID');
    }

    // Verifica el estado del token en la base de datos
    const tokenHash = hashToken(dto.token);
    const tokenRecord = await this.resetTokenRepository.findByTokenHash(tokenHash);

    if (!tokenRecord) {
      throw new AuthError('El enlace de recuperación es inválido', 'TOKEN_INVALID');
    }

    if (tokenRecord.used) {
      throw new AuthError(
        'Este enlace ya fue utilizado. Por favor solicita un nuevo enlace de recuperación.',
        'TOKEN_ALREADY_USED',
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AuthError(
        'Este enlace ha expirado. Por favor solicita un nuevo enlace de recuperación.',
        'TOKEN_EXPIRED',
      );
    }

    const email = payload.email;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);
    await this.userRepository.updatePassword(user.id, newPasswordHash);

    // Marca el token como consumido para evitar reutilización
    await this.resetTokenRepository.markAsUsed(tokenHash);
  }
}
