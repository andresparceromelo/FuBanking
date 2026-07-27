import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { GetTransferHistoryDto, TransferHistoryItemDto } from '../../dtos/transfer/transfer.dtos';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Obtener el historial de transacciones de una cuenta.
 *
 * Sigue los principios de Programacion Orientada a Objetos (Responsabilidad Unica).
 * Se encarga de buscar las transacciones y mapearlas indicando la direccion
 * (ingreso o egreso) y obteniendo los datos de la contraparte.
 */
export class GetTransferHistory {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: GetTransferHistoryDto): Promise<TransferHistoryItemDto[]> {
    // 1. Verificar que la cuenta exista y pertenezca al usuario
    const account = await this.accountRepository.findById(dto.accountId);
    
    if (!account) {
      throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Seguridad de dominio:
    account.assertBelongsTo(dto.userId);

    // 2. Obtener el historial de la BD
    const transactions = await this.transactionRepository.findByAccountId(account.id);

    // 3. Mapear cada transaccion a su representacion visual
    // Usamos Promise.all para resolver los nombres de las contrapartes concurrentemente
    const historyPromises = transactions.map(async (tx) => {
      const isOutgoing = tx.senderAccountId === account.id;
      const relatedAccountId = isOutgoing ? tx.receiverAccountId : tx.senderAccountId;
      
      const relatedAccount = await this.accountRepository.findById(relatedAccountId);
      let relatedName = 'Usuario';
      let relatedMasked = '****';

      if (relatedAccount) {
        relatedMasked = this.mask(relatedAccount.accountNumber);
        const relatedUser = await this.userRepository.findById(relatedAccount.userId);
        if (relatedUser) {
          relatedName = `${relatedUser.firstName} ${relatedUser.lastName}`;
        }
      }

      const item: TransferHistoryItemDto = {
        id:              tx.id,
        referenceNumber: tx.referenceNumber,
        amount:          tx.amount,
        type:            tx.type,
        status:          tx.status,
        description:     tx.description,
        createdAt:       tx.createdAt.toISOString(),
        direction:       isOutgoing ? 'OUTGOING' : 'INCOMING',
        relatedAccount:  relatedMasked,
        relatedName:     relatedName,
      };
      return item;
    });

    return Promise.all(historyPromises);
  }

  private mask(n: string): string {
    return n.length <= 4 ? n : `****${n.slice(-4)}`;
  }
}
