import { SupabaseClient } from '@supabase/supabase-js';
import { IPocketRepository } from '../../domain/repositories/IPocketRepository';
import { Pocket, PocketProps, CreatePocketProps } from '../../domain/entities/Pocket';
import { AppError } from '../../shared/errors/AppError';

interface PocketRow {
  id: string;
  account_id: string;
  name: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export class SupabasePocketRepository implements IPocketRepository {
  private readonly TABLE = 'pockets';

  constructor(private readonly client: SupabaseClient) {}

  private mapRowToPocket(row: PocketRow): Pocket {
    const props: PocketProps = {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      amount: Number(row.amount),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return new Pocket(props);
  }

  async findById(id: string): Promise<Pocket | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToPocket(data as PocketRow);
  }

  async findByAccountId(accountId: string): Promise<Pocket[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as PocketRow[]).map((row) => this.mapRowToPocket(row));
  }

  async save(pocket: Pocket): Promise<Pocket> {
    const row: CreatePocketProps = {
      id: pocket.id,
      accountId: pocket.accountId,
      name: pocket.name,
      amount: pocket.amount,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert({
        id: row.id,
        account_id: row.accountId,
        name: row.name,
        amount: row.amount,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Error al crear bolsillo: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
    }

    return this.mapRowToPocket(data as PocketRow);
  }

  async update(pocket: Pocket): Promise<Pocket> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .update({
        name: pocket.name,
        amount: pocket.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pocket.id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Error al actualizar bolsillo: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
    }

    return this.mapRowToPocket(data as PocketRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(`Error al eliminar bolsillo: ${error.message}`, 500, 'DB_ERROR');
    }
  }

  async getTotalAmountByAccountId(accountId: string): Promise<number> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('amount')
      .eq('account_id', accountId);

    if (error || !data) {
      return 0;
    }

    return (data as { amount: number }[]).reduce((sum, row) => sum + Number(row.amount), 0);
  }
}
