import { AppError } from '../../shared/errors/AppError';

/**
 * Enum de tipos de cuenta — en español, tal como se almacena en BD.
 */
export enum AccountType {
  AHORROS = 'AHORROS',
  CORRIENTE = 'CORRIENTE',
  NOMINA = 'NOMINA',
  CREDITO = 'CREDITO',
}

/**
 * Enum de estados de cuenta — en español, tal como se almacena en BD.
 */
export enum AccountStatus {
  ACTIVA = 'ACTIVA',
  BLOQUEADA = 'BLOQUEADA',
  CERRADA = 'CERRADA',
}

/**
 * Detalles opcionales específicos por tipo de cuenta.
 */
export interface AccountDetails {
  interestRate?: number | null;    // Tasa de interés (Ahorros)
  managementFee?: number | null;   // Cuota de manejo (Ahorros)
  overdraftLimit?: number | null;  // Límite de sobregiro (Corriente)
  allowsCheckbook?: boolean | null;// Permite chequera (Corriente)
  companyName?: string | null;     // Empresa asociada (Nómina)
  loanId?: string | null;          // Préstamo asociado (Crédito)
  installments?: number | null;    // Cuotas del crédito (Crédito)
}

/**
 * Props para reconstruir una Account desde la base de datos.
 */
export interface AccountProps {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  details?: AccountDetails | null;
  createdAt: Date;
}

/**
 * Props para crear una nueva Account (sin id ni timestamps).
 */
export interface CreateAccountProps {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  details?: AccountDetails | null;
}

/**
 * Representación pública de una cuenta — sin datos sensibles.
 */
export interface PublicAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  details: AccountDetails | null;
  createdAt: string;
}

/**
 * Entidad Account — capa de Dominio.
 *
 * Encapsula las reglas de negocio de una cuenta bancaria.
 * No conoce Express, Supabase ni ningún framework externo.
 *
 * Reglas:
 * - El saldo no puede ser negativo.
 * - Una cuenta CERRADA no puede operar.
 * - Una cuenta BLOQUEADA no puede operar.
 */
export class Account {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _accountNumber: string;
  private readonly _accountType: AccountType;
  private _balance: number;
  private _status: AccountStatus;
  private _details: AccountDetails | null;
  private readonly _createdAt: Date;

  constructor(props: AccountProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._accountNumber = props.accountNumber;
    this._accountType = props.accountType;
    this._balance = props.balance;
    this._status = props.status;
    this._details = props.details ?? null;
    this._createdAt = props.createdAt;
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get accountNumber(): string { return this._accountNumber; }
  get accountType(): AccountType { return this._accountType; }
  get balance(): number { return this._balance; }
  get status(): AccountStatus { return this._status; }
  get details(): AccountDetails | null { return this._details; }
  get createdAt(): Date { return this._createdAt; }

  // ── Reglas de negocio ────────────────────────────────────────────────────

  /**
   * Verifica si la cuenta está operativa (activa).
   */
  isOperational(): boolean {
    return this._status === AccountStatus.ACTIVA;
  }

  /**
   * Verifica que la cuenta pertenezca al usuario dado.
   * Lanza error si no coincide — seguridad a nivel de dominio.
   */
  assertBelongsTo(userId: string): void {
    if (this._userId !== userId) {
      throw new AppError('No tienes permiso para acceder a esta cuenta', 403, 'FORBIDDEN');
    }
  }

  /**
   * Bloquea la cuenta.
   */
  block(): void {
    if (this._status === AccountStatus.CERRADA) {
      throw new AppError('No se puede bloquear una cuenta cerrada', 400, 'ACCOUNT_CLOSED');
    }
    this._status = AccountStatus.BLOQUEADA;
  }

  /**
   * Cierra la cuenta permanentemente.
   */
  close(): void {
    this._status = AccountStatus.CERRADA;
  }

  /**
   * Retorna la representación pública de la cuenta.
   */
  toPublic(): PublicAccount {
    return {
      id: this._id,
      userId: this._userId,
      accountNumber: this._accountNumber,
      accountType: this._accountType,
      balance: this._balance,
      status: this._status,
      details: this._details,
      createdAt: this._createdAt.toISOString(),
    };
  }

  // ── Factory ──────────────────────────────────────────────────────────────

  /**
   * Crea una nueva instancia de Account para una cuenta recién creada.
   * El saldo inicial siempre es 0 y el estado siempre es ACTIVA.
   */
  static create(props: CreateAccountProps): Account {
    return new Account({
      id: props.id,
      userId: props.userId,
      accountNumber: props.accountNumber,
      accountType: props.accountType,
      balance: 0,
      status: AccountStatus.ACTIVA,
      details: props.details ?? null,
      createdAt: new Date(),
    });
  }
}
