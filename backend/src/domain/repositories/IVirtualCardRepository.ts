import { VirtualCard } from '../entities/VirtualCard';

export interface IVirtualCardRepository {
  save(card: VirtualCard): Promise<VirtualCard>;
  findById(id: string): Promise<VirtualCard | null>;
  findByUserId(userId: string): Promise<VirtualCard[]>;
  findByAccountId(accountId: string): Promise<VirtualCard[]>;
  updateStatus(cardId: string, status: string): Promise<VirtualCard>;
}
