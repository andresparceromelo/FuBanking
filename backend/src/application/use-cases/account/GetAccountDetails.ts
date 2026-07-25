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
    // 1. Buscar la cuenta
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    // 2. Verificar que la cuenta pertenece al usuario autenticado
    // Este método lanza AppError 403 si no coincide
    account.assertBelongsTo(dto.userId);

    // 3. Retornar el detalle público
    return account.toPublic();
  }
}
