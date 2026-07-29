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

const fallbackStore = new Map<string, Pocket>();
let fallbackEnabled = false;

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

  private isMissingTableError(error: any): boolean {
    const message = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
    return error?.code === '42P01' || message.includes('could not find the table') || message.includes('relation') && message.includes('does not exist');
  }

  private handleMissingTable(error: any): never {
    fallbackEnabled = true;
    console.warn('Supabase pockets table is not available. Using in-memory fallback for pockets.');
    if (error) {
      throw new AppError('La tabla de bolsillos aún no está creada en Supabase. Se está usando almacenamiento temporal en memoria.', 500, 'DB_TABLE_MISSING');
    }
    throw new AppError('La tabla de bolsillos aún no está creada en Supabase. Se está usando almacenamiento temporal en memoria.', 500, 'DB_TABLE_MISSING');
  }

  async findById(id: string): Promise<Pocket | null> {
    if (fallbackEnabled) {
      return fallbackStore.get(id) ?? null;
    }

    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return this.mapRowToPocket(data as PocketRow);
    } catch (error: any) {
      if (this.isMissingTableError(error)) {
        this.handleMissingTable(error);
      }
      throw error;
    }
  }

  async findByAccountId(accountId: string): Promise<Pocket[]> {
    if (fallbackEnabled) {
      return Array.from(fallbackStore.values()).filter((pocket) => pocket.accountId === accountId);
    }

    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return (data as PocketRow[]).map((row) => this.mapRowToPocket(row));
    } catch (error: any) {
      if (this.isMissingTableError(error)) {
        this.handleMissingTable(error);
      }
      throw error;
    }
  }

  async save(pocket: Pocket): Promise<Pocket> {
    if (fallbackEnabled) {
      fallbackStore.set(pocket.id, pocket);
      return pocket;
    }

    const row: CreatePocketProps = {
      id: pocket.id,
      accountId: pocket.accountId,
      name: pocket.name,
      amount: pocket.amount,
    };

    try {
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
        if (this.isMissingTableError(error)) {
          fallbackEnabled = true;
          fallbackStore.set(pocket.id, pocket);
          return pocket;
        }
        throw new AppError(`Error al crear bolsillo: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
      }

      return this.mapRowToPocket(data as PocketRow);
    } catch (error: any) {
      if (this.isMissingTableError(error)) {
        fallbackEnabled = true;
        fallbackStore.set(pocket.id, pocket);
        return pocket;
      }
      throw error;
    }
  }

  async update(pocket: Pocket): Promise<Pocket> {
    if (fallbackEnabled) {
      fallbackStore.set(pocket.id, pocket);
      return pocket;
    }

    try {
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
        if (this.isMissingTableError(error)) {
          fallbackEnabled = true;
          fallbackStore.set(pocket.id, pocket);
          return pocket;
        }
        throw new AppError(`Error al actualizar bolsillo: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
      }

      return this.mapRowToPocket(data as PocketRow);
    } catch (error: any) {
      if (this.isMissingTableError(error)) {
        fallbackEnabled = true;
        fallbackStore.set(pocket.id, pocket);
        return pocket;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    if (fallbackEnabled) {
      fallbackStore.delete(id);
      return;
    }

    try {
      const { error } = await this.client
        .from(this.TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        if (this.isMissingTableError(error)) {
          fallbackEnabled = true;
          fallbackStore.delete(id);
          return;
        }
        throw new AppError(`Error al eliminar bolsillo: ${error.message}`, 500, 'DB_ERROR');
      }
    } catch (error: any) {
      if (this.isMissingTableError(error)) {
        fallbackEnabled = true;
        fallbackStore.delete(id);
        return;
      }
      throw error;
    }
  }

  async getTotalAmountByAccountId(accountId: string): Promise<number> {
    if (fallbackEnabled) {
      return Array.from(fallbackStore.values())
        .filter((pocket) => pocket.accountId === accountId)
        .reduce((sum, pocket) => sum + pocket.amount, 0);
    }

    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('amount')
        .eq('account_id', accountId);

      if (error || !data) {
        if (this.isMissingTableError(error)) {
          fallbackEnabled = true;
          return 0;
        }
        return 0;
      }

      return (data as { amount: number }[]).reduce((sum, row) => sum + Number(row.amount), 0);
    } catch (error: any) {
      if (this.isMissingTableError(error)) {
        fallbackEnabled = true;
        return 0;
      }
      throw error;
    }
  }
}
