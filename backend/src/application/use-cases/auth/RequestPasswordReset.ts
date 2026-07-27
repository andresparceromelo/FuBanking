import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenService } from '../../interfaces/ITokenService';
import { IEmailService } from '../../interfaces/IEmailService';
import { RequestPasswordResetDto } from '../../dtos/auth/auth.dtos';

/**
 * Caso de Uso: Solicitar recuperación de contraseña.
 *
 * Envía el email de recuperación utilizando el NodemailerEmailService,
 * generando un token local temporal.
 * Por seguridad, siempre retorna éxito aunque el email no exista.
 */
export class RequestPasswordReset {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly emailService: IEmailService,
  ) {}

  async execute(dto: RequestPasswordResetDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();

    console.log('[RequestPasswordReset] Buscando usuario con email:', email);

    // Verificar si el usuario existe
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      console.log('[RequestPasswordReset] Usuario NO encontrado en la BD. Abortando.');
      return;
    }

    console.log('[RequestPasswordReset] Usuario encontrado, ID:', user.id);

    // Generar token JWT válido por 15 minutos
    const token = this.tokenService.generate(
      { userId: user.id, email: user.email.toString(), type: 'reset' },
      { expiresIn: '15m' }
    );

    // Construir enlace de recuperación
    const resetLink = `${process.env['CLIENT_URL']}/reset-password?token=${token}`;
    console.log('[RequestPasswordReset] Enlace generado:', resetLink);

    // Enviar el email usando Nodemailer
    console.log('[RequestPasswordReset] Enviando correo a:', user.email.toString());
    await this.emailService.sendPasswordResetEmail(user.email.toString(), resetLink);
    console.log('[RequestPasswordReset] Correo enviado exitosamente.');
  }
}
