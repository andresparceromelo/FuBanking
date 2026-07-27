import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { GetTransferDto, TransferReceiptDto } from '../../dtos/transfer/transfer.dtos';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Obtener comprobante de transferencia.
 *
 * Solo el dueño de la cuenta origen o destino puede ver la transacción.
 */
export class GetTransfer {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: GetTransferDto): Promise<TransferReceiptDto> {
    // 1. Buscar la transacción
    const transaction = await this.transactionRepository.findById(dto.transactionId);
    if (!transaction) {
      throw new AppError('Transacción no encontrada', 404, 'TRANSACTION_NOT_FOUND');
    }

    // 2. Verificar que el usuario está involucrado (seguridad)
    const userAccounts = await this.accountRepository.findByUserId(dto.userId);
    const userAccountIds = userAccounts.map((a) => a.id);
    const isInvolved =
      userAccountIds.includes(transaction.senderAccountId) ||
      userAccountIds.includes(transaction.receiverAccountId);

    if (!isInvolved) {
      throw new AppError('No tienes acceso a esta transacción', 403, 'FORBIDDEN');
    }

    // 3. Obtener cuentas para los números
    const [senderAccount, receiverAccount] = await Promise.all([
      this.accountRepository.findById(transaction.senderAccountId),
      this.accountRepository.findById(transaction.receiverAccountId),
    ]);

    // 4. Obtener nombre del destinatario
    const receiverUser = receiverAccount
      ? await this.userRepository.findById(receiverAccount.userId)
      : null;
    const receiverName = receiverUser
      ? `${receiverUser.firstName} ${receiverUser.lastName}`
      : 'Usuario';

    return {
      id:              transaction.id,
      referenceNumber: transaction.referenceNumber,
      senderAccount:   senderAccount ? this.mask(senderAccount.accountNumber) : '****',
      receiverAccount: receiverAccount ? this.mask(receiverAccount.accountNumber) : '****',
      receiverName,
      amount:          transaction.amount,
      type:            transaction.type,
      status:          transaction.status,
      description:     transaction.description,
      createdAt:       transaction.createdAt.toISOString(),
    };
  }

  private mask(n: string): string {
    return n.length <= 4 ? n : `****${n.slice(-4)}`;
  }
}
