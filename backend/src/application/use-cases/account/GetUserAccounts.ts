import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { AccountSummaryDto } from '../../dtos/account/account.dtos';

/**
 * Caso de Uso: Obtener todas las cuentas del usuario autenticado.
 *
 * Solo devuelve las cuentas que pertenecen al userId proporcionado.
 * La seguridad garantiza que un usuario jamás vea cuentas ajenas.
 */
export class GetUserAccounts {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(userId: string): Promise<AccountSummaryDto[]> {
    const accounts = await this.accountRepository.findByUserId(userId);
    return accounts.map((account) => account.toPublic());
  }
}
