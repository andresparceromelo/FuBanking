import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { SearchRecipientResponseDto } from '../../dtos/transfer/transfer.dtos';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Buscar destinatario por número de cuenta.
 *
 * Seguridad:
 * - Solo devuelve nombre y número enmascarado.
 * - Nunca expone saldo, email ni ID del usuario.
 */
export class SearchAccountByNumber {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    accountNumber: string,
    requestingUserId: string,
  ): Promise<SearchRecipientResponseDto> {
    if (!accountNumber || accountNumber.trim().length === 0) {
      throw new AppError('El número de cuenta es requerido', 400, 'MISSING_ACCOUNT_NUMBER');
    }

    const account = await this.accountRepository.findByAccountNumber(accountNumber.trim());

    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    if (!account.isOperational()) {
      throw new AppError('La cuenta de destino no está activa', 400, 'ACCOUNT_INACTIVE');
    }

    // No revelar información de la propia cuenta del usuario
    if (account.userId === requestingUserId) {
      throw new AppError(
        'No puedes transferirte dinero a ti mismo por esta vía',
        400,
        'OWN_ACCOUNT',
      );
    }

    const user = await this.userRepository.findById(account.userId);
    const name = user ? `${user.firstName} ${user.lastName}` : 'Usuario';

    const masked = account.accountNumber.length <= 4
      ? account.accountNumber
      : `****${account.accountNumber.slice(-4)}`;

    return {
      name,
      accountNumber: masked,
      accountNumberFull: account.accountNumber,
    };
  }
}
