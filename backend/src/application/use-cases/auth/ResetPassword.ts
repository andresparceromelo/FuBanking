import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ResetPasswordDto } from '../../dtos/auth/auth.dtos';
import { AppError } from '../../../shared/errors/AppError';
import { AuthError } from '../../../shared/errors/AuthError';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Caso de Uso: Restablecer contraseña.
 *
 * Flujo:
 * 1. Verifica el token de recuperación con Supabase Auth.
 * 2. Valida que las contraseñas nuevas coincidan.
 * 3. Hashea la nueva contraseña.
 * 4. Actualiza en la base de datos.
 */
export class ResetPassword {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    // 1. Validar contraseñas
    if (dto.newPassword !== dto.confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
    }

    // 2. Verificar el token de Supabase
    const { data, error } = await this.supabaseClient.auth.getUser(dto.token);

    if (error || !data.user?.email) {
      throw new AuthError('El enlace de recuperación es inválido o ha expirado', 'TOKEN_INVALID');
    }

    const email = data.user.email;

    // 3. Buscar el usuario en nuestra BD por email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // 4. Hashear nueva contraseña
    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    // 5. Actualizar también en Supabase Auth para mantener sincronía
    await this.supabaseClient.auth.updateUser({ password: dto.newPassword });

    // 6. Actualizar hash en nuestra tabla de usuarios
    // Como no tenemos update de password en IUserRepository,
    // hacemos el update directamente via supabase en esta excepción controlada.
    // TODO: Agregar updatePassword a IUserRepository en una iteración futura.
    await this.supabaseClient
      .from('users')
      .update({ password: newPasswordHash })
      .eq('email', email);
  }
}
