import { randomUUID } from 'node:crypto';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { LoanApplication, LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { Account, AccountType, AccountStatus } from '../../../domain/entities/Account';
import { Notification } from '../../../domain/entities/Notification';
import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { UpdateUserData } from '../../../domain/repositories/IUserRepository';

// ── Repositorios In-Memory ────────────────────────────────────────────────

export class InMemoryLoanRepo implements ILoanApplicationRepository {
  private readonly store = new Map<string, LoanApplication>();

  async save(loan: LoanApplication): Promise<LoanApplication> {
    this.store.set(loan.id, loan);
    return loan;
  }

  async findById(id: string): Promise<LoanApplication | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<LoanApplication[]> {
    return Array.from(this.store.values()).filter(l => l.userId === userId);
  }

  async findAll(): Promise<LoanApplication[]> {
    return Array.from(this.store.values());
  }

  async updateStatus(id: string, status: string): Promise<LoanApplication> {
    const loan = this.store.get(id);
    if (!loan) throw new Error('Loan not found');
    if (status === 'APPROVED') loan.approve();
    else if (status === 'REJECTED') loan.reject();
    return loan;
  }
}

export class InMemoryUserRepo implements IUserRepository {
  private readonly store = new Map<string, User>();

  constructor(users: User[] = []) {
    users.forEach(u => this.store.set(u.id, u));
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailVO = new Email(email);
    return Array.from(this.store.values()).find(u => u.email.equals(emailVO)) ?? null;
  }

  async findByDocument(document: string): Promise<User | null> {
    const docVO = new Document(document);
    return Array.from(this.store.values()).find(u => u.document.equals(docVO)) ?? null;
  }

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    user.updateProfile(data);
    return user;
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<User> {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    user.updatePasswordHash(newPasswordHash);
    return user;
  }

  async updateTwoFactor(id: string, enabled: boolean): Promise<User> {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    if (enabled) user.enableTwoFactor();
    else user.disableTwoFactor();
    return user;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findByRole(role: string): Promise<User[]> {
    return Array.from(this.store.values()).filter(u => u.role === role);
  }
}

export class InMemoryAccountRepo implements IAccountRepository {
  private readonly store = new Map<string, Account>();

  async findById(id: string): Promise<Account | null> {
    return this.store.get(id) ?? null;
  }

  async findByAccountNumber(number: string): Promise<Account | null> {
    return Array.from(this.store.values()).find(a => a.accountNumber === number) ?? null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return Array.from(this.store.values()).filter(a => a.userId === userId);
  }

  async save(account: Account): Promise<Account> {
    this.store.set(account.id, account);
    return account;
  }

  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    const account = this.store.get(accountId);
    if (!account) throw new Error('Account not found');
    return account;
  }

  async updateStatus(accountId: string, status: AccountStatus): Promise<Account> {
    const account = this.store.get(accountId);
    if (!account) throw new Error('Account not found');
    return account;
  }
}

export class InMemoryNotificationRepo implements INotificationRepository {
  private readonly store = new Map<string, Notification>();

  async save(notification: Notification): Promise<Notification> {
    this.store.set(notification.id, notification);
    return notification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.store.values()).filter(n => n.userId === userId);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notif = this.store.get(id);
    if (!notif) throw new Error('Notification not found');
    notif.markAsRead();
    return notif;
  }

  findAll(): Notification[] {
    return Array.from(this.store.values());
  }
}

// ── Builders de prueba ────────────────────────────────────────────────────

export function buildUser(overrides: Partial<{ id: string; email: string; document: string; firstName: string; lastName: string; birthDate: Date; monthlyIncome: number | null; documentVerified: boolean; role: string }> = {}): User {
  return User.create({
    id: overrides.id ?? randomUUID(),
    email: new Email(overrides.email ?? `test-${randomUUID().slice(0, 8)}@example.com`),
    document: new Document(overrides.document ?? `${1000000000 + Math.floor(Math.random() * 9000000000)}`),
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    birthDate: overrides.birthDate ?? new Date('1995-01-01'),
    monthlyIncome: overrides.monthlyIncome ?? 2_000_000,
    documentVerified: overrides.documentVerified ?? true,
    passwordHash: 'hash',
  });
}

export function buildPendingLoan(userId: string, overrides: Partial<{ id: string; amount: number; installments: number; annualRate: number; monthlyIncome: number }> = {}): LoanApplication {
  return LoanApplication.create({
    id: overrides.id ?? randomUUID(),
    userId,
    amount: overrides.amount ?? 5_000_000,
    installments: overrides.installments ?? 12,
    annualRate: overrides.annualRate ?? 24,
    monthlyIncome: overrides.monthlyIncome ?? 2_000_000,
    documentVerified: true,
    ageVerified: true,
    incomeVerified: true,
    creditHistoryVerified: true,
  });
}
