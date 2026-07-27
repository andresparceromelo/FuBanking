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
export class SupabaseAccountRepository implements IAccountRepository {
  private readonly TABLE = 'accounts';
  private readonly DETAILS_TABLE = 'account_details';

  constructor(private readonly client: SupabaseClient) {}

  // ── Mapeo BD → Dominio ────────────────────────────────────────────────

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

  // ── Consultas ─────────────────────────────────────────────────────────

  async findById(id: string): Promise<Account | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select(`*, account_details(*)`)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToAccount(data as AccountRow);
  }

  async findByAccountNumber(number: string): Promise<Account | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select(`*, account_details(*)`)
      .eq('account_number', number)
      .single();

    if (error || !data) return null;
    return this.mapRowToAccount(data as AccountRow);
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select(`*, account_details(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as AccountRow[]).map((row) => this.mapRowToAccount(row));
  }

  // ── Mutaciones ────────────────────────────────────────────────────────

  async save(account: Account, details?: AccountDetails | null): Promise<Account> {
    // 1. Insertar en la tabla principal accounts
    const accountRow = {
      id: account.id,
      user_id: account.userId,
      account_number: account.accountNumber,
      account_type: account.accountType,
      balance: account.balance,
      status: account.status,
    };

    const { data: savedAccount, error: accountError } = await this.client
      .from(this.TABLE)
      .insert(accountRow)
      .select()
      .single();

    if (accountError || !savedAccount) {
      throw new AppError(
        `Error al crear la cuenta: ${accountError?.message ?? 'Desconocido'}`,
        500,
        'DB_ERROR',
      );
    }

    // 2. Si hay detalles, insertarlos en account_details
    if (details && this.hasAnyDetail(details)) {
      const detailsRow = {
        account_id: account.id,
        interest_rate: details.interestRate ?? null,
        management_fee: details.managementFee ?? null,
        overdraft_limit: details.overdraftLimit ?? null,
        allows_checkbook: details.allowsCheckbook ?? null,
        company_name: details.companyName ?? null,
      };

      const { error: detailsError } = await this.client
        .from(this.DETAILS_TABLE)
        .insert(detailsRow);

      if (detailsError) {
        throw new AppError(
          `Error al guardar detalles de la cuenta: ${detailsError.message}`,
          500,
          'DB_ERROR',
        );
      }
    }

    // 3. Recuperar la cuenta completa con sus detalles para retornar
    const fullAccount = await this.findById(account.id);
    if (!fullAccount) {
      throw new AppError('Error al recuperar la cuenta creada', 500, 'DB_ERROR');
    }

    return fullAccount;
  }

  async updateBalance(accountId: string, newBalance: number): Promise<Account> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .update({ balance: newBalance })
      .eq('id', accountId)
      .select(`*, account_details(*)`)
      .single();

    if (error || !data) {
      throw new AppError(`Error al actualizar saldo: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
    }

    return this.mapRowToAccount(data as AccountRow);
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
