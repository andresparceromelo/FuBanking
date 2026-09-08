import { IUserRepository, UpdateUserData } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, User>();
  seed(user: User): void {
    this.store.set(user.id, user);
  }
  clear(): void {
    this.store.clear();
  }
  all(): User[] {
    return Array.from(this.store.values());
  }
  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }
  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email.toString() === email) return user;
    }
    return null;
  }
  async findByDocument(document: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.document.toString() === document) return user;
    }
    return null;
  }
  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }
  async update(id: string, data: UpdateUserData): Promise<User> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`InMemoryUserRepository: usuario ${id} no encontrado`);
    return existing;
  }
  async updatePassword(id: string, newPasswordHash: string): Promise<User> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`InMemoryUserRepository: usuario ${id} no encontrado`);
    (existing as any)._passwordHash = newPasswordHash;
    return existing;
  }
  async updateTwoFactor(id: string, enabled: boolean): Promise<User> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`InMemoryUserRepository: usuario ${id} no encontrado`);
    (existing as any).twoFactorEnabled = enabled;
    return existing;
  }
  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
  async findByRole(role: string): Promise<User[]> {
    return Array.from(this.store.values()).filter((u) => u.role === role);
  }
  getStoredPasswordHash(id: string): string | undefined {
    return (this.store.get(id) as any)?._passwordHash;
  }
}
