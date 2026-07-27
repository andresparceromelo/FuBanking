import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { Transaction } from '../../../domain/entities/Transaction';
import { CreateTransferDto, TransferReceiptDto } from '../../dtos/transfer/transfer.dtos';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Caso de Uso: Crear Transferencia.
 *
 * Flujo:
 * 1. Obtener todas las cuentas del usuario autenticado (cuenta origen).
 * 2. Buscar la cuenta destino por número de cuenta.
 * 3. Validar reglas de negocio en dominio.
 * 4. Ejecutar la transferencia atómica via RPC.
 * 5. Retornar comprobante con datos enmascarados.
 *
 * Seguridad:
 * - El frontend envía el senderAccountId.
 * - El backend valida que la cuenta de origen pertenece al usuario autenticado.
 */
export class CreateTransfer {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateTransferDto): Promise<TransferReceiptDto> {
    // 1. Validar monto a nivel de dominio
    Transaction.validateAmount(dto.amount);

    // 2. Obtener cuenta origen elegida por el usuario
    const senderAccount = await this.accountRepository.findById(dto.senderAccountId);

    if (!senderAccount) {
      throw new AppError(
        'La cuenta de origen no existe',
        404,
        'SENDER_ACCOUNT_NOT_FOUND',
      );
    }

    // Verificar seguridad de dominio
    senderAccount.assertBelongsTo(dto.userId);

    if (!senderAccount.isOperational()) {
      throw new AppError(
        'La cuenta de origen no está activa',
        400,
        'SENDER_ACCOUNT_INACTIVE',
      );
    }

    // 3. Buscar cuenta destino por número de cuenta
    const receiverAccount = await this.accountRepository.findByAccountNumber(
      dto.receiverAccountNumber.trim(),
    );

    if (!receiverAccount) {
      throw new AppError(
        'La cuenta de destino no existe',
        404,
        'RECEIVER_ACCOUNT_NOT_FOUND',
      );
    }

    // 4. Validar que no sea la misma cuenta
    Transaction.validateDifferentAccounts(senderAccount.id, receiverAccount.id);

    // 5. Validar que la cuenta destino está activa
    if (!receiverAccount.isOperational()) {
      throw new AppError(
        'La cuenta de destino no está activa',
        400,
        'RECEIVER_ACCOUNT_INACTIVE',
      );
    }

    // 6. Validar saldo suficiente
    if (senderAccount.balance < dto.amount) {
      throw new AppError(
        'Saldo insuficiente para realizar la transferencia',
        400,
        'INSUFFICIENT_FUNDS',
      );
    }

    // 7. Generar referencia única
    const referenceNumber = Transaction.generateReferenceNumber();

    // 8. Ejecutar la transferencia atómica via RPC
    const transaction = await this.transactionRepository.executeTransfer(
      senderAccount.id,
      receiverAccount.id,
      dto.amount,
      dto.description ?? null,
      referenceNumber,
    );

    // 9. Obtener nombre del destinatario
    const receiverUser = await this.userRepository.findById(receiverAccount.userId);
    const receiverName = receiverUser
      ? `${receiverUser.firstName} ${receiverUser.lastName}`
      : 'Usuario';

    // 10. Retornar comprobante con números enmascarados
    return {
      id:              transaction.id,
      referenceNumber: transaction.referenceNumber,
      senderAccount:   this.maskAccountNumber(senderAccount.accountNumber),
      receiverAccount: this.maskAccountNumber(receiverAccount.accountNumber),
      receiverName,
      amount:          transaction.amount,
      type:            transaction.type,
      status:          transaction.status,
      description:     transaction.description,
      createdAt:       transaction.createdAt.toISOString(),
    };
  }

  /**
   * Enmascara los últimos 4 dígitos del número de cuenta.
   * Ejemplo: 0019283746 → ****3746
   */
  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  }
}
