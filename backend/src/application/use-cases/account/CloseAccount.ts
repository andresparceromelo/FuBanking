import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { AppError } from '../../../shared/errors/AppError';
import { CloseAccountDto } from '../../dtos/account/account.dtos';

/**
 * Caso de Uso: Eliminar (cerrar) una cuenta bancaria.
 *
 * Es una eliminación suave: la cuenta queda en estado CERRADA y
 * desaparece del listado del usuario, pero se conserva su historial.
 *
 * Reglas de negocio (validadas en la entidad):
 * - La cuenta debe pertenecer al usuario autenticado.
 * - No se pueden eliminar cuentas de tipo CREDITO.
 * - No se pueden eliminar cuentas con saldo mayor a cero.
 * - No se puede eliminar una cuenta ya cerrada.
 */
export class CloseAccount {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(dto: CloseAccountDto) {
    const account = await this.accountRepository.findById(dto.accountId);
    if (!account) {
      throw new AppError('La cuenta no existe', 404, 'ACCOUNT_NOT_FOUND');
    }

    account.assertBelongsTo(dto.userId);

    account.close();

    const updatedAccount = await this.accountRepository.updateStatus(account.id, account.status);

    return updatedAccount.toPublic();
  }
}
