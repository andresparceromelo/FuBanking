import { AccountType, AccountStatus, AccountDetails } from '../../../domain/entities/Account';

/**
 * DTOs del módulo de Cuentas.
 *
 * Los DTOs son contratos de datos entre capas.
 * Son simples interfaces (sin lógica) que garantizan que
 * los datos que entran y salen de los casos de uso tienen la forma correcta.
 */

// ── Crear Cuenta ──────────────────────────────────────────────────────────

export interface CreateAccountDto {
  userId: string;
  type: AccountType;
  /** El usuario solo puede solicitar chequera para cuenta corriente, o indicar empresa para nómina */
  requestCheckbook?: boolean;
  companyName?: string;
}

export interface CreateAccountResponseDto {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  details: AccountDetails | null;
  createdAt: string;
}

// ── Consultar Cuentas ─────────────────────────────────────────────────────

export interface GetUserAccountsDto {
  userId: string;
}

export interface AccountSummaryDto {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  details: AccountDetails | null;
  createdAt: string;
}

// ── Detalle de Cuenta ─────────────────────────────────────────────────────

export interface GetAccountDetailsDto {
  accountId: string;
  userId: string;
}

export interface AccountDetailResponseDto {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  details: AccountDetails | null;
  createdAt: string;
}
