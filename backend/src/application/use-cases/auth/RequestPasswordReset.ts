import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { RequestPasswordResetDto } from '../../dtos/auth/auth.dtos';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Caso de Uso: Solicitar recuperación de contraseña.
 *
 * Usa el flujo nativo de Supabase Auth para enviar el email de recuperación.
 * Por seguridad, siempre retorna éxito aunque el email no exista
 * (previene la enumeración de usuarios).
 *
 * Nota: este caso de uso es el único que depende directamente del cliente
 * de Supabase porque usa la funcionalidad de Auth (no la BD directamente).
 */
export class RequestPasswordReset {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async execute(dto: RequestPasswordResetDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();

    // Verificar si el usuario existe (opcional: para evitar enviar emails innecesarios)
    const user = await this.userRepository.findByEmail(email);

    // Si el usuario no existe, retornamos éxito igualmente (seguridad)
    if (!user) return;

    // Usar Supabase Auth para enviar el email de recuperación
    await this.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env['CLIENT_URL']}/reset-password`,
    });
  }
}
