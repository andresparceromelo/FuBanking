import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService } from '../../interfaces/ITokenService';
import { ResetPasswordDto } from '../../dtos/auth/auth.dtos';
import { AppError } from '../../../shared/errors/AppError';
import { AuthError } from '../../../shared/errors/AuthError';

/**
 * Caso de Uso: Restablecer contraseña.
 *
 * Flujo:
 * 1. Valida que las contraseñas nuevas coincidan.
 * 2. Verifica el token JWT (debe ser de tipo 'reset').
 * 3. Busca el usuario en BD.
 * 4. Hashea la nueva contraseña.
 * 5. Actualiza en la base de datos mediante el repositorio.
 */
export class ResetPassword {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
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

    const email = payload.email;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    await this.userRepository.updatePassword(user.id, newPasswordHash);
  }
}
