import { IResetTokenRepository } from '../../../domain/repositories/IResetTokenRepository';
import { ITokenService } from '../../interfaces/ITokenService';
import { AuthError } from '../../../shared/errors/AuthError';
import { hashToken } from '../../../infrastructure/repositories/SupabaseResetTokenRepository';

export interface VerifyResetTokenDto {
  token: string;
}

/**
 * Caso de Uso: Verificar validez de un token de restablecimiento de contraseña.
 *
 * Permite al frontend consultar el estado del token al cargar la vista,
 * ANTES de mostrar el formulario (Defectos 4 y 5).
 *
 * Flujo:
 * 1. Verifica que el JWT sea válido y de tipo 'reset'.
 * 2. Busca el registro en BD por hash SHA-256.
 * 3. Evalúa: no existe → inválido, usado → TOKEN_ALREADY_USED, expirado → TOKEN_EXPIRED.
 * 4. Si todo es válido, retorna sin error.
 *
 * No consume el token (no lo marca como used).
 */
export class VerifyResetToken {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly resetTokenRepository: IResetTokenRepository,
  ) {}

  async execute(dto: VerifyResetTokenDto): Promise<void> {
    let payload;
    try {
      payload = this.tokenService.verify(dto.token);
    } catch (error) {
      throw new AuthError('El enlace de recuperación es inválido o ha expirado', 'TOKEN_INVALID');
    }

    if (payload.type !== 'reset') {
      throw new AuthError('El enlace de recuperación es inválido', 'TOKEN_INVALID');
    }

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
  }
}
