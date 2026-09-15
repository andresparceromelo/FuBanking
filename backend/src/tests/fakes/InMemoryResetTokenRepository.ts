import { IResetTokenRepository, ResetTokenRecord } from '../../domain/repositories/IResetTokenRepository';

/**
 * Implementación en memoria de IResetTokenRepository para pruebas unitarias.
 *
 * Permite verificar el comportamiento de invalidación y búsqueda de tokens
 * sin depender de Supabase.
 */
export class InMemoryResetTokenRepository implements IResetTokenRepository {
  private readonly store = new Map<string, ResetTokenRecord>();
  private counter = 0;

  seed(record: ResetTokenRecord): void {
    this.store.set(record.tokenHash, record);
  }

  clear(): void {
    this.store.clear();
  }

  all(): ResetTokenRecord[] {
    return Array.from(this.store.values());
  }

  async save(record: Omit<ResetTokenRecord, 'id' | 'createdAt'>): Promise<ResetTokenRecord> {
    this.counter += 1;
    const full: ResetTokenRecord = {
      ...record,
      id: `fake-id-${this.counter}`,
      createdAt: new Date(),
    };
    this.store.set(record.tokenHash, full);
    return full;
  }

  async invalidateAllByUserId(userId: string): Promise<void> {
    for (const record of this.store.values()) {
      if (record.userId === userId && !record.used) {
        this.store.set(record.tokenHash, { ...record, used: true });
      }
    }
  }

  async findByTokenHash(tokenHash: string): Promise<ResetTokenRecord | null> {
    return this.store.get(tokenHash) ?? null;
  }

  async markAsUsed(tokenHash: string): Promise<void> {
    const record = this.store.get(tokenHash);
    if (record) {
      this.store.set(tokenHash, { ...record, used: true });
    }
  }
}
