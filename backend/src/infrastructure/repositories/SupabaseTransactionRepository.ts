import { SupabaseClient } from '@supabase/supabase-js';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { Transaction, TransactionProps, TransactionType, TransactionStatus } from '../../domain/entities/Transaction';
import { AppError } from '../../shared/errors/AppError';

/**
 * Fila de la tabla transactions en Supabase.
 */
interface TransactionRow {
  id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
  type: string;
  status: string;
  reference_number: string;
  description: string | null;
  created_at: string;
}

/**
 * Implementación del repositorio de transacciones usando Supabase.
 *
 * Es la única clase que conoce la estructura de la tabla transactions.
 * Los casos de uso NUNCA acceden directamente a Supabase.
 */
export class SupabaseTransactionRepository implements ITransactionRepository {
  private readonly TABLE = 'transactions';

  constructor(private readonly client: SupabaseClient) {}

  // -- Mapeo BD → Dominio --

  private mapRowToTransaction(row: TransactionRow): Transaction {
    const props: TransactionProps = {
      id:                row.id,
      senderAccountId:   row.sender_account_id,
      receiverAccountId: row.receiver_account_id,
      amount:            Number(row.amount),
      type:              row.type as TransactionType,
      status:            row.status as TransactionStatus,
      referenceNumber:   row.reference_number,
      description:       row.description,
      createdAt:         new Date(row.created_at),
    };
    return Transaction.fromPersistence(props);
  }

  // -- Operaciones --

  async executeTransfer(
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    description: string | null,
    referenceNumber: string,
  ): Promise<Transaction> {
    const { data, error } = await this.client.rpc('make_transfer', {
      p_sender_account_id:   senderAccountId,
      p_receiver_account_id: receiverAccountId,
      p_amount:              amount,
      p_description:         description,
      p_reference_number:    referenceNumber,
    });

    if (error) {
      // Mapear errores de la función RPC a errores del dominio
      const msg = error.message ?? '';
      if (msg.includes('INSUFFICIENT_FUNDS')) {
        throw new AppError('Saldo insuficiente para realizar la transferencia', 400, 'INSUFFICIENT_FUNDS');
      }
      if (msg.includes('SENDER_ACCOUNT_INACTIVE')) {
        throw new AppError('Tu cuenta de origen no está activa', 400, 'SENDER_ACCOUNT_INACTIVE');
      }
      if (msg.includes('RECEIVER_ACCOUNT_INACTIVE')) {
        throw new AppError('La cuenta de destino no está activa', 400, 'RECEIVER_ACCOUNT_INACTIVE');
      }
      if (msg.includes('SENDER_NOT_FOUND') || msg.includes('RECEIVER_NOT_FOUND')) {
        throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
      }
      throw new AppError(`Error al ejecutar la transferencia: ${msg}`, 500, 'TRANSFER_ERROR');
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new AppError('La transferencia no retornó datos', 500, 'TRANSFER_ERROR');
    }

    const row: TransactionRow = Array.isArray(data) ? data[0] : data;
    return this.mapRowToTransaction(row);
  }

  async findById(id: string): Promise<Transaction | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToTransaction(data as TransactionRow);
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .or(`sender_account_id.eq.${accountId},receiver_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as TransactionRow[]).map((row) => this.mapRowToTransaction(row));
  }
}
