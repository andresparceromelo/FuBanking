import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { Account, AccountDetails, AccountProps, AccountStatus } from '../../domain/entities/Account';

/**
 * Repositorio de cuentas en memoria con semántica de COPIA (ver
 * InMemoryPocketRepository): guarda filas planas y reconstruye la entidad en
 * cada lectura, así que solo cuenta lo que se persiste explícitamente.
 */
function toRow(account: Account): AccountProps {
  return {
    id: account.id,
    userId: account.userId,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    status: account.status,
    details: account.details ? { ...account.details } : null,
    createdAt: new Date(account.createdAt),
  };
}

function toEntity(row: AccountProps): Account {
  return new Account({ ...row, details: row.details ? { ...row.details } : null });
}

export class InMemoryAccountRepository implements IAccountRepository {
  private readonly rows = new Map<string, AccountProps>();

  seed(...accounts: Account[]): void {
    accounts.forEach((a) => this.rows.set(a.id, toRow(a)));
  }

  async findById(id: string): Promise<Account | null> {
    const row = this.rows.get(id);
    return row ? toEntity(row) : null;
  }

  async findByAccountNumber(number: string): Promise<Account | null> {
    const row = Array.from(this.rows.values()).find((r) => r.accountNumber === number);
    return row ? toEntity(row) : null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.userId === userId)
      .map(toEntity);
  }

  async save(account: Account, details?: AccountDetails | null): Promise<Account> {
    const row = { ...toRow(account), details: details ?? account.details };
    this.rows.set(account.id, row);
    return toEntity(row);
  }

  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    return this.patch(accountId, { balance: newBalance });
  }

  async updateStatus(accountId: string, status: AccountStatus): Promise<Account> {
    return this.patch(accountId, { status });
  }

  private patch(accountId: string, changes: Partial<AccountProps>): Account {
    const current = this.rows.get(accountId);
    if (!current) throw new Error(`InMemoryAccountRepository: cuenta ${accountId} no encontrada`);
    const row = { ...current, ...changes };
    this.rows.set(accountId, row);
    return toEntity(row);
  }
}
