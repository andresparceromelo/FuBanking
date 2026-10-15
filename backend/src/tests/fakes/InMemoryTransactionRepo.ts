import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { Transaction, TransactionStatus, TransactionType } from '../../domain/entities/Transaction';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { randomUUID } from 'node:crypto';

export class InMemoryTransactionRepo implements ITransactionRepository {
  private readonly store = new Map<string, Transaction>();

  constructor(private readonly accountRepo?: IAccountRepository) {}

  async executeTransfer(
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    description: string | null,
    referenceNumber: string,
  ): Promise<Transaction> {
    if (this.accountRepo) {
      const sender = await this.accountRepo.findById(senderAccountId);
      if (!sender) throw new Error('Cuenta origen no encontrada');
      if (sender.balance < amount) throw new Error('Fondos insuficientes');
      const receiver = await this.accountRepo.findById(receiverAccountId);
      if (!receiver) throw new Error('Cuenta destino no encontrada');

      await this.accountRepo.updateBalance(senderAccountId, sender.balance - amount);
      await this.accountRepo.updateBalance(receiverAccountId, receiver.balance + amount);
    }

    const transaction = new Transaction({
      id: randomUUID(),
      senderAccountId,
      receiverAccountId,
      amount,
      type: TransactionType.TRANSFERENCIA,
      status: TransactionStatus.COMPLETADA,
      referenceNumber,
      description,
      createdAt: new Date(),
    });

    this.store.set(transaction.id, transaction);
    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.store.get(id) ?? null;
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return Array.from(this.store.values()).filter(
      (t) => t.senderAccountId === accountId || t.receiverAccountId === accountId,
    );
  }

  // Helper para tests
  saveDirect(transaction: Transaction): void {
    this.store.set(transaction.id, transaction);
  }
}
