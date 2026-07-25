/**
 * Tipos del módulo de Cuentas — frontend.
 *
 * Se replican aquí los enums en español para que el frontend
 * no dependa de los tipos del backend directamente.
 */

export enum AccountType {
  AHORROS = 'AHORROS',
  CORRIENTE = 'CORRIENTE',
  NOMINA = 'NOMINA',
}

export enum AccountStatus {
  ACTIVA = 'ACTIVA',
  BLOQUEADA = 'BLOQUEADA',
  CERRADA = 'CERRADA',
}

export interface AccountDetails {
  interestRate?: number | null;
  managementFee?: number | null;
  overdraftLimit?: number | null;
  allowsCheckbook?: boolean | null;
  companyName?: string | null;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  details: AccountDetails | null;
  createdAt: string;
}

export interface CreateAccountPayload {
  type: AccountType;
  requestCheckbook?: boolean;
  companyName?: string;
}

/** Labels en español para mostrar en la UI */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.AHORROS]: 'Cuenta de Ahorros',
  [AccountType.CORRIENTE]: 'Cuenta Corriente',
  [AccountType.NOMINA]: 'Cuenta Nómina',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  [AccountStatus.ACTIVA]: 'Activa',
  [AccountStatus.BLOQUEADA]: 'Bloqueada',
  [AccountStatus.CERRADA]: 'Cerrada',
};
