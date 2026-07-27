import { Pocket } from '../entities/Pocket';

export interface IPocketRepository {
  findById(id: string): Promise<Pocket | null>;
  findByAccountId(accountId: string): Promise<Pocket[]>;
  save(pocket: Pocket): Promise<Pocket>;
  update(pocket: Pocket): Promise<Pocket>;
  delete(id: string): Promise<void>;
  getTotalAmountByAccountId(accountId: string): Promise<number>;
}
