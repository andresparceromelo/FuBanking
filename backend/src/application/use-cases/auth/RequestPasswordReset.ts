import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IResetTokenRepository } from '../../../domain/repositories/IResetTokenRepository';
import { ITokenService } from '../../interfaces/ITokenService';
import { IEmailService } from '../../interfaces/IEmailService';
import { RequestPasswordResetDto } from '../../dtos/auth/auth.dtos';
import { hashToken } from '../../../infrastructure/repositories/SupabaseResetTokenRepository';

/**
 * Caso de Uso: Solicitar recuperación de contraseña.
 *
 * Flujo:
 * 1. Busca el usuario por email (retorna sin error si no existe, por seguridad).
 * 2. Invalida todos los tokens de reset previos del usuario.
 * 3. Genera un nuevo token JWT de tipo 'reset' (5 minutos de vigencia).
 * 4. Persiste el hash SHA-256 del token en la BD.
 * 5. Envía el email con el enlace de recuperación.
 *
 * Por seguridad, siempre retorna éxito aunque el email no exista.
 */
export class RequestPasswordReset {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
    private readonly resetTokenRepository: IResetTokenRepository,
  ) { }

  async execute(dto: RequestPasswordResetDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return;
    }

    // Invalida cualquier token de reset previo activo para este usuario
    await this.resetTokenRepository.invalidateAllByUserId(user.id);

    const token = this.tokenService.generate(
      { userId: user.id, email: user.email.toString(), type: 'reset' },
      { expiresIn: '5m' }
    );

    // Persiste el hash del token (nunca el token plano)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.resetTokenRepository.save({
      tokenHash: hashToken(token),
      userId: user.id,
      used: false,
      expiresAt,
    });

    const resetLink = `${process.env['CLIENT_URL']}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(user.email.toString(), resetLink);
  }
}
