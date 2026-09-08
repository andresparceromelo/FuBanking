import { IVerificationCodeRepository } from '../../domain/repositories/IVerificationCodeRepository';
import { VerificationCode } from '../../domain/entities/VerificationCode';
export class InMemoryVerificationCodeRepository implements IVerificationCodeRepository {
  private readonly store = new Map<string, VerificationCode>();
  seed(code: VerificationCode): void {
    this.store.set(code.id, code);
  }
  clear(): void {
    this.store.clear();
  }
  all(): VerificationCode[] {
    return Array.from(this.store.values());
  }
  async save(code: VerificationCode): Promise<VerificationCode> {
    this.store.set(code.id, code);
    return code;
  }
  async findLatestByUserId(userId: string): Promise<VerificationCode | null> {
    let latest: VerificationCode | null = null;
    for (const code of this.store.values()) {
      if (code.userId !== userId) continue;
      if (!latest || code.createdAt > latest.createdAt) {
        latest = code;
      }
    }
    return latest;
  }
  async update(code: VerificationCode): Promise<void> {
    if (!this.store.has(code.id)) {
      throw new Error(`InMemoryVerificationCodeRepository: código ${code.id} no encontrado`);
    }
    this.store.set(code.id, code);
  }
  async invalidateAllByUserId(userId: string): Promise<void> {
    for (const [id, code] of this.store.entries()) {
      if (code.userId === userId) {
        this.store.delete(id);
      }
    }
  }
}
