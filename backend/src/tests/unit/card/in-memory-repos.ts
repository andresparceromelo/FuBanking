import { randomUUID } from 'node:crypto';
import { VirtualCard, CardStatus } from '../../../domain/entities/VirtualCard';
import { IVirtualCardRepository } from '../../../domain/repositories/IVirtualCardRepository';
import { Account, AccountType } from '../../../domain/entities/Account';
import {
  InMemoryUserRepo,
  InMemoryAccountRepo,
  InMemoryNotificationRepo,
  createTestUser,
} from '../loan/in-memory-repos';

export { InMemoryUserRepo, InMemoryAccountRepo, InMemoryNotificationRepo, createTestUser };

export class InMemoryVirtualCardRepo implements IVirtualCardRepository {
  private readonly store = new Map<string, VirtualCard>();
  readonly statusUpdates: Array<{ id: string; status: string }> = [];

  async save(card: VirtualCard): Promise<VirtualCard> {
    this.store.set(card.id, card);
    return card;
  }

  async findById(id: string): Promise<VirtualCard | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<VirtualCard[]> {
    return Array.from(this.store.values()).filter((c) => c.userId === userId);
  }

  async findByAccountId(accountId: string): Promise<VirtualCard[]> {
    return Array.from(this.store.values()).filter((c) => c.accountId === accountId);
  }

  async updateStatus(cardId: string, status: string): Promise<VirtualCard> {
    const card = this.store.get(cardId);
    if (!card) throw new Error('Card not found');
    this.store.set(cardId, card);
    this.statusUpdates.push({ id: cardId, status });
    return card;
  }
}

export function buildVirtualCard(
  userId: string,
  accountId: string,
  overrides?: Partial<{
    id: string;
    cardHolderName: string;
    status: CardStatus;
  }>,
): VirtualCard {
  const gen = VirtualCard.generateNumber();
  return new VirtualCard({
    id: overrides?.id ?? randomUUID(),
    userId,
    accountId,
    cardHolderName: overrides?.cardHolderName ?? 'TEST USER',
    cardNumber: gen.cardNumber,
    lastFour: gen.lastFour,
    expirationDate: gen.expirationDate,
    cvv: gen.cvv,
    status: overrides?.status ?? CardStatus.ACTIVA,
    createdAt: new Date(),
  });
}

let testAccountSeq = 0;

export function createTestAccount(
  userId: string,
  overrides?: Partial<{ id: string; accountNumber: string; accountType: AccountType }>,
): Account {
  testAccountSeq += 1;
  return Account.create({
    id: overrides?.id ?? randomUUID(),
    userId,
    accountNumber: overrides?.accountNumber ?? `ACC${String(testAccountSeq).padStart(10, '0')}`,
    accountType: overrides?.accountType ?? AccountType.AHORROS,
  });
}
