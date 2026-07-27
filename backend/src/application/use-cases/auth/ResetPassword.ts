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
    // 1. Validar contraseñas
    if (dto.newPassword !== dto.confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
    }

    // 2. Verificar el token JWT
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

    // 3. Buscar el usuario en nuestra BD por email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // 4. Hashear nueva contraseña
    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    // 5. Actualizar hash en nuestra tabla de usuarios usando el repositorio
    await this.userRepository.updatePassword(user.id, newPasswordHash);
  }
}
