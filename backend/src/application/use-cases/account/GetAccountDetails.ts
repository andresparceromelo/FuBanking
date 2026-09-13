import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { GetAccountDetailsDto, AccountDetailResponseDto } from '../../dtos/account/account.dtos';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Obtener el detalle completo de una cuenta.
 *
 * Responsabilidades:
 * - Buscar la cuenta por ID.
 * - Verificar que la cuenta le pertenece al usuario autenticado.
 * - Retornar todos los detalles de la cuenta.
 */
export class GetAccountDetails {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(dto: GetAccountDetailsDto): Promise<AccountDetailResponseDto> {
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    return account.toPublic();
  }
}
