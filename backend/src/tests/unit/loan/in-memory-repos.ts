import { randomUUID } from 'node:crypto';
import { LoanApplication } from '../../../domain/entities/LoanApplication';
import { ILoanApplicationRepository } from '../../../domain/repositories/ILoanApplicationRepository';
import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { Account, AccountStatus, AccountDetails } from '../../../domain/entities/Account';
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { Notification } from '../../../domain/entities/Notification';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';


export class InMemoryLoanRepo implements ILoanApplicationRepository {
  private readonly store = new Map<string, LoanApplication>();
  readonly statusUpdates: Array<{ id: string; status: string }> = [];

  async save(loan: LoanApplication): Promise<LoanApplication> {
    this.store.set(loan.id, loan);
    return loan;
  }

  async findById(id: string): Promise<LoanApplication | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<LoanApplication[]> {
    return Array.from(this.store.values()).filter((l) => l.userId === userId);
  }

  async findAll(): Promise<LoanApplication[]> {
    return Array.from(this.store.values());
  }

  async updateStatus(id: string, status: string): Promise<LoanApplication> {
    const loan = this.store.get(id);
    if (!loan) throw new Error('Loan not found');
    // El use-case ya muto la entidad via approve()/reject(); aqui se persiste
    // la referencia y se registra la llamada para poder asertarla en tests.
    this.store.set(id, loan);
    this.statusUpdates.push({ id, status });
    return loan;
  }
}

export class InMemoryUserRepo implements IUserRepository {
  private readonly store = new Map<string, User>();

  constructor(users: User[] = []) {
    users.forEach((u) => this.store.set(u.id, u));
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    return Array.from(this.store.values()).find(
      (u) => u.email.toString() === normalized,
    ) ?? null;
  }

  async findByDocument(document: string): Promise<User | null> {
    const normalized = document.trim();
    return Array.from(this.store.values()).find(
      (u) => u.document.toString() === normalized,
    ) ?? null;
  }

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }

  async update(id: string, data: any): Promise<User> {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    user.updateProfile(data);
    return user;
  }

  async updatePassword(id: string, hash: string): Promise<User> {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    user.updatePasswordHash(hash);
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
    return Array.from(this.store.values()).filter((u) => u.role === role);
  }
}

export class InMemoryAccountRepo implements IAccountRepository {
  private readonly store = new Map<string, Account>();

  async findById(id: string): Promise<Account | null> {
    return this.store.get(id) ?? null;
  }

  async findByAccountNumber(number: string): Promise<Account | null> {
    return Array.from(this.store.values()).find(
      (a) => a.accountNumber === number,
    ) ?? null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return Array.from(this.store.values()).filter((a) => a.userId === userId);
  }

  async save(account: Account, _details?: AccountDetails | null): Promise<Account> {
    this.store.set(account.id, account);
    return account;
  }

  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    const account = this.store.get(accountId);
    if (!account) throw new Error('Account not found');
    const updated = new Account({
      id: account.id,
      userId: account.userId,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: newBalance,
      status: account.status,
      details: account.details,
      createdAt: account.createdAt,
    });
    this.store.set(accountId, updated);
    return updated;
  }

  async updateStatus(accountId: string, status: AccountStatus): Promise<Account> {
    const account = this.store.get(accountId);
    if (!account) throw new Error('Account not found');
    const updated = new Account({
      id: account.id,
      userId: account.userId,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: account.balance,
      status,
      details: account.details,
      createdAt: account.createdAt,
    });
    this.store.set(accountId, updated);
    return updated;
  }
}

export class InMemoryNotificationRepo implements INotificationRepository {
  private readonly store = new Map<string, Notification>();

  async save(notification: Notification): Promise<Notification> {
    this.store.set(notification.id, notification);
    return notification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.store.values()).filter((n) => n.userId === userId);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notif = this.store.get(id);
    if (!notif) throw new Error('Notification not found');
    notif.markAsRead();
    return notif;
  }

  getAll(): Notification[] {
    return Array.from(this.store.values());
  }
}


export function createTestUser(overrides?: {
  id?: string;
  email?: string;
  document?: string;
  monthlyIncome?: number | null;
  documentVerified?: boolean;
  birthDate?: Date;
  role?: string;
}): User {
  const d = {
    id: randomUUID(),
    email: 'test@example.com',
    document: '1234567890',
    monthlyIncome: 1_800_000,
    documentVerified: true,
    birthDate: new Date('1995-01-01'),
    role: 'user',
    ...overrides,
  };

  if (d.role !== 'user') {
    return new User({
      id: d.id,
      email: new Email(d.email),
      document: new Document(d.document),
      firstName: 'Test',
      middleName: null,
      lastName: 'User',
      secondLastName: null,
      birthDate: d.birthDate,
      phone: null,
      avatarUrl: null,
      passwordHash: 'hash',
      monthlyIncome: d.monthlyIncome,
      documentVerified: d.documentVerified,
      documentVerifiedAt: null,
      isActive: true,
      twoFactorEnabled: false,
      role: d.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return User.create({
    id: d.id,
    email: new Email(d.email),
    document: new Document(d.document),
    firstName: 'Test',
    lastName: 'User',
    birthDate: d.birthDate,
    passwordHash: 'hash',
    monthlyIncome: d.monthlyIncome,
    documentVerified: d.documentVerified,
  });
}


export function buildPendingLoan(
  userId: string,
  overrides?: Partial<{
    id: string;
    amount: number;
    installments: number;
    annualRate: number;
    monthlyIncome: number;
  }>,
): LoanApplication {
  return LoanApplication.create({
    id: overrides?.id ?? randomUUID(),
    userId,
    amount: overrides?.amount ?? 5_000_000,
    installments: overrides?.installments ?? 12,
    annualRate: overrides?.annualRate ?? 24,
    monthlyIncome: overrides?.monthlyIncome ?? 2_000_000,
    documentVerified: true,
    ageVerified: true,
    incomeVerified: true,
    creditHistoryVerified: true,
  });
}
