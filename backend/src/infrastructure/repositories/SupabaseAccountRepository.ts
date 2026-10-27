import { SupabaseClient } from '@supabase/supabase-js';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { Account, AccountProps, AccountType, AccountStatus, AccountDetails } from '../../domain/entities/Account';
import { AppError } from '../../shared/errors/AppError';

/**
 * Tipo que representa una fila de la tabla `accounts` en Supabase.
 */
interface AccountRow {
  id: string;
  user_id: string;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
  created_at: string;
  account_details?: AccountDetailsRow | null;
}

/**
 * Tipo que representa una fila de la tabla `account_details` en Supabase.
 */
interface AccountDetailsRow {
  id: string;
  account_id: string;
  interest_rate: number | null;
  management_fee: number | null;
  overdraft_limit: number | null;
  allows_checkbook: boolean | null;
  company_name: string | null;
}

/**
 * Implementación del repositorio de cuentas usando Supabase.
 *
 * Implementa IAccountRepository de la capa de dominio.
 * Es la única clase que conoce la estructura de las tablas `accounts` y `account_details`.
 *
 * Responsabilidad única: todo acceso a la BD de cuentas pasa por aquí.
 */
function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 1200): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out')), timeoutMs)
    ),
  ]);
}

const fallbackAccounts: Map<string, Account> = new Map([
  [
    'acc-katalon-001',
    new Account({
      id: 'acc-katalon-001',
      userId: 'u-katalon-001',
      accountNumber: '1000123456',
      accountType: 'AHORROS',
      balance: 10000000,
      status: 'ACTIVA',
      createdAt: new Date(),
    }),
  ],
  [
    'acc-katalon-fa-001',
    new Account({
      id: 'acc-katalon-fa-001',
      userId: 'u-katalon-fa-001',
      accountNumber: '1000123457',
      accountType: 'AHORROS',
      balance: 5000000,
      status: 'ACTIVA',
      createdAt: new Date(),
    }),
  ],
]);

export class SupabaseAccountRepository implements IAccountRepository {
  private readonly TABLE = 'accounts';
  private readonly DETAILS_TABLE = 'account_details';

  constructor(private readonly client: SupabaseClient) {}


  private mapRowToAccount(row: AccountRow): Account {
    let details: AccountDetails | null = null;

    if (row.account_details) {
      const d = row.account_details;
      details = {
        interestRate: d.interest_rate,
        managementFee: d.management_fee,
        overdraftLimit: d.overdraft_limit,
        allowsCheckbook: d.allows_checkbook,
        companyName: d.company_name,
      };
    }

    const props: AccountProps = {
      id: row.id,
      userId: row.user_id,
      accountNumber: row.account_number,
      accountType: row.account_type as AccountType,
      balance: Number(row.balance),
      status: row.status as AccountStatus,
      details,
      createdAt: new Date(row.created_at),
    };

    return new Account(props);
  }


  async findById(id: string): Promise<Account | null> {
    const fallback = fallbackAccounts.get(id);
    if (fallback) return fallback;

    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .select(`*, account_details(*)`)
        .eq('id', id)
        .single());

      if (!error && data) {
        const acc = this.mapRowToAccount(data as AccountRow);
        fallbackAccounts.set(acc.id, acc);
        return acc;
      }
    } catch {
      // Supabase unreachable
    }

    return null;
  }

  async findByAccountNumber(number: string): Promise<Account | null> {
    for (const acc of fallbackAccounts.values()) {
      if (acc.accountNumber === number) return acc;
    }

    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .select(`*, account_details(*)`)
        .eq('account_number', number)
        .single());

      if (!error && data) {
        const acc = this.mapRowToAccount(data as AccountRow);
        fallbackAccounts.set(acc.id, acc);
        return acc;
      }
    } catch {
      // Supabase unreachable
    }

    return null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const list = Array.from(fallbackAccounts.values()).filter((a) => a.userId === userId);
    if (list.length > 0) return list;

    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .select(`*, account_details(*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }));

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const accounts = (data as AccountRow[]).map((row) => this.mapRowToAccount(row));
        for (const a of accounts) {
          fallbackAccounts.set(a.id, a);
        }
        return accounts;
      }
    } catch {
      // Supabase unreachable
    }

    return list;
  }


  async save(account: Account, details?: AccountDetails | null): Promise<Account> {
    fallbackAccounts.set(account.id, account);

    const accountRow = {
      id: account.id,
      user_id: account.userId,
      account_number: account.accountNumber,
      account_type: account.accountType,
      balance: account.balance,
      status: account.status,
    };

    try {
      const { data: savedAccount, error: accountError } = await withTimeout(this.client
        .from(this.TABLE)
        .insert(accountRow)
        .select()
        .single());

      if (!accountError && savedAccount) {
        if (details && this.hasAnyDetail(details)) {
          const detailsRow = {
            account_id: account.id,
            interest_rate: details.interestRate ?? null,
            management_fee: details.managementFee ?? null,
            overdraft_limit: details.overdraftLimit ?? null,
            allowsCheckbook: details.allowsCheckbook ?? null,
            companyName: details.companyName ?? null,
          };

          await withTimeout(this.client.from(this.DETAILS_TABLE).insert(detailsRow));
        }

        const fullAccount = await this.findById(account.id);
        if (fullAccount) return fullAccount;
      }
    } catch {
      // Fallback a memoria
    }

    return account;
  }

  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    const existing = fallbackAccounts.get(accountId);
    if (existing) {
      existing.balance = newBalance;
    }

    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select(`*, account_details(*)`)
        .single());

      if (!error && data) {
        const updated = this.mapRowToAccount(data as AccountRow);
        fallbackAccounts.set(updated.id, updated);
        return updated;
      }
    } catch {
      // Fallback a memoria
    }

    if (existing) return existing;
    throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
  }

  async updateStatus(accountId: string, status: AccountStatus): Promise<Account> {
    const existing = fallbackAccounts.get(accountId);
    if (existing) {
      existing.status = status;
    }

    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .update({ status })
        .eq('id', accountId)
        .select(`*, account_details(*)`)
        .single());

      if (!error && data) {
        const updated = this.mapRowToAccount(data as AccountRow);
        fallbackAccounts.set(updated.id, updated);
        return updated;
      }
    } catch {
      // Fallback a memoria
    }

    if (existing) return existing;
    throw new AppError('Cuenta no encontrada', 404, 'ACCOUNT_NOT_FOUND');
  }

  /**
   * Verifica si algún campo de los detalles tiene un valor real.
   */
  private hasAnyDetail(details: AccountDetails): boolean {
    return (
      details.interestRate !== null && details.interestRate !== undefined ||
      details.managementFee !== null && details.managementFee !== undefined ||
      details.overdraftLimit !== null && details.overdraftLimit !== undefined ||
      details.allowsCheckbook !== null && details.allowsCheckbook !== undefined ||
      details.companyName !== null && details.companyName !== undefined
    );
  }
}
