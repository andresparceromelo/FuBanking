import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UpdateProfileDto, UpdateProfileResponseDto } from '../../dtos/profile/profile.dtos';
import { AuthError } from '../../../shared/errors/AuthError';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Actualizar perfil del usuario autenticado.
 *
 * Campos editables: fullName, phone, avatarUrl.
 * El correo y el documento NO se pueden cambiar.
 */
export class UpdateProfile {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // Verificar que se envió al menos un campo a actualizar
    const hasChanges = dto.firstName !== undefined
      || dto.middleName !== undefined
      || dto.lastName !== undefined
      || dto.secondLastName !== undefined
      || dto.birthDate !== undefined
      || dto.phone !== undefined
      || dto.avatarUrl !== undefined;

    if (!hasChanges) {
      throw new AppError('No se proporcionó ningún campo para actualizar', 400, 'NO_CHANGES');
    }

    // Actualizar via repositorio
    const updatedUser = await this.userRepository.update(userId, {
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      secondLastName: dto.secondLastName,
      birthDate: dto.birthDate ?? undefined,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
    });

    return updatedUser.toPublic();
  }
}
