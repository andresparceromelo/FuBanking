import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { SearchRecipientResponseDto } from '../../dtos/transfer/transfer.dtos';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Buscar destinatario por correo electrónico.
 *
 * Seguridad:
 * - Solo devuelve nombre y número de cuenta enmascarado.
 * - Nunca expone el email completo, saldo ni ID.
 */
export class SearchUserByEmail {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(
    email: string,
    requestingUserId: string,
  ): Promise<SearchRecipientResponseDto> {
    if (!email || email.trim().length === 0) {
      throw new AppError('El correo electrónico es requerido', 400, 'MISSING_EMAIL');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError('No se encontró ningún usuario con ese correo', 404, 'USER_NOT_FOUND');
    }

    if (user.id === requestingUserId) {
      throw new AppError(
        'No puedes transferirte dinero a ti mismo',
        400,
        'OWN_ACCOUNT',
      );
    }

    // Obtener la primera cuenta activa del usuario encontrado
    const accounts = await this.accountRepository.findByUserId(user.id);
    const activeAccount = accounts.find((a) => a.isOperational());

    if (!activeAccount) {
      throw new AppError(
        'El usuario no tiene cuentas activas para recibir transferencias',
        400,
        'NO_ACTIVE_ACCOUNT',
      );
    }

    const masked = activeAccount.accountNumber.length <= 4
      ? activeAccount.accountNumber
      : `****${activeAccount.accountNumber.slice(-4)}`;

    return {
      name: `${user.firstName} ${user.lastName}`,
      accountNumber: masked,
      accountNumberFull: activeAccount.accountNumber,
    };
  }
}
