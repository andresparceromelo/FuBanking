import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { AuthError } from '../../../shared/errors/AuthError';
import { PublicUser } from '../../../domain/entities/User';

/**
 * Caso de Uso: Desactivar 2FA para el usuario autenticado.
 *
 * Requiere que el usuario ya esté autenticado (req.user del authMiddleware).
 * Actualiza el campo two_factor_enabled a false en la base de datos.
 */
export class DisableTwoFactor {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    if (!user.twoFactorEnabled) {
      throw new AuthError(
        'La autenticación de dos factores ya está desactivada',
        'UNAUTHORIZED',
      );
    }

    const updatedUser = await this.userRepository.updateTwoFactor(userId, false);
    return updatedUser.toPublic();
  }
}
