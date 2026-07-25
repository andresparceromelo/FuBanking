import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { GetProfileResponseDto } from '../../dtos/profile/profile.dtos';
import { AuthError } from '../../../shared/errors/AuthError';

/**
 * Caso de Uso: Obtener perfil del usuario autenticado.
 *
 * Recibe el ID del usuario (extraído del JWT por el middleware)
 * y retorna sus datos públicos.
 */
export class GetProfile {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<GetProfileResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    return user.toPublic();
  }
}
