import { SupabaseClient } from '@supabase/supabase-js';
import { IVirtualCardRepository } from '../../domain/repositories/IVirtualCardRepository';
import { VirtualCard, VirtualCardProps, CardStatus } from '../../domain/entities/VirtualCard';
import { AppError } from '../../shared/errors/AppError';

interface VirtualCardRow {
  id: string;
  user_id: string;
  account_id: string;
  card_holder_name: string;
  card_number: string;
  last_four: string;
  expiration_date: string;
  cvv: string;
  status: string;
  created_at: string;
}

export class SupabaseVirtualCardRepository implements IVirtualCardRepository {
  private readonly TABLE = 'virtual_cards';

  constructor(private readonly client: SupabaseClient) {}

  private mapRowToCard(row: VirtualCardRow): VirtualCard {
    const props: VirtualCardProps = {
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      cardHolderName: row.card_holder_name,
      cardNumber: row.card_number,
      lastFour: row.last_four,
      expirationDate: row.expiration_date,
      cvv: row.cvv,
      status: row.status as CardStatus,
      createdAt: new Date(row.created_at),
    };
    return new VirtualCard(props);
  }

  async save(card: VirtualCard): Promise<VirtualCard> {
    const row = {
      id: card.id,
      user_id: card.userId,
      account_id: card.accountId,
      card_holder_name: card.cardHolderName,
      card_number: card.cardNumber,
      last_four: card.lastFour,
      expiration_date: card.expirationDate,
      cvv: card.cvv,
      status: card.status,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(
        `Error al guardar la tarjeta virtual: ${error?.message ?? 'Sin datos retornados'}. Verifica que la tabla virtual_cards exista y tenga permisos correctos.`,
        500,
        'DB_ERROR'
      );
    }

    return this.mapRowToCard(data as VirtualCardRow);
  }

  async findById(id: string): Promise<VirtualCard | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToCard(data as VirtualCardRow);
  }

  async findByUserId(userId: string): Promise<VirtualCard[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as VirtualCardRow[]).map(row => this.mapRowToCard(row));
  }

  async findByAccountId(accountId: string): Promise<VirtualCard[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('account_id', accountId);

    if (error || !data) return [];
    return (data as VirtualCardRow[]).map(row => this.mapRowToCard(row));
  }

  async updateStatus(cardId: string, status: string): Promise<VirtualCard> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .update({ status })
      .eq('id', cardId)
      .select()
      .single();

    if (error || !data) {
      const card = await this.findById(cardId);
      if (!card) throw new AppError('Tarjeta no encontrada', 404, 'CARD_NOT_FOUND');
      return card;
    }

    return this.mapRowToCard(data as VirtualCardRow);
  }
}
