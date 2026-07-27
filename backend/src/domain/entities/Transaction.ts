import { AppError } from '../../shared/errors/AppError';

/**
 * Tipo de transacción — en español, tal como se almacena en BD.
 */
export enum TransactionType {
  TRANSFERENCIA = 'TRANSFERENCIA',
}

/**
 * Estado de transacción — en español, tal como se almacena en BD.
 */
export enum TransactionStatus {
  PENDIENTE  = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  FALLIDA    = 'FALLIDA',
  CANCELADA  = 'CANCELADA',
}

/**
 * Props necesarias para reconstruir una Transaction desde la base de datos.
 */
export interface TransactionProps {
  id: string;
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceNumber: string;
  description: string | null;
  createdAt: Date;
}

/**
 * Comprobante de transferencia — datos públicos sin información sensible.
 */
export interface TransactionReceipt {
  id: string;
  referenceNumber: string;
  senderAccountMasked: string;
  receiverAccountMasked: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: string;
}

/**
 * Entidad Transaction — capa de Dominio.
 *
 * Encapsula las reglas de negocio de una operación financiera.
 * No conoce Express, Supabase ni ningún framework externo.
 *
 * Reglas:
 * - El monto debe ser mayor que cero.
 * - No se puede transferir a la misma cuenta.
 */
export class Transaction {
  private readonly _id: string;
  private readonly _senderAccountId: string;
  private readonly _receiverAccountId: string;
  private readonly _amount: number;
  private readonly _type: TransactionType;
  private readonly _status: TransactionStatus;
  private readonly _referenceNumber: string;
  private readonly _description: string | null;
  private readonly _createdAt: Date;

  constructor(props: TransactionProps) {
    Transaction.validateAmount(props.amount);
    Transaction.validateDifferentAccounts(props.senderAccountId, props.receiverAccountId);

    this._id                = props.id;
    this._senderAccountId   = props.senderAccountId;
    this._receiverAccountId = props.receiverAccountId;
    this._amount            = props.amount;
    this._type              = props.type;
    this._status            = props.status;
    this._referenceNumber   = props.referenceNumber;
    this._description       = props.description;
    this._createdAt         = props.createdAt;
  }

  // -- Getters --

  get id(): string                 { return this._id; }
  get senderAccountId(): string    { return this._senderAccountId; }
  get receiverAccountId(): string  { return this._receiverAccountId; }
  get amount(): number             { return this._amount; }
  get type(): TransactionType      { return this._type; }
  get status(): TransactionStatus  { return this._status; }
  get referenceNumber(): string    { return this._referenceNumber; }
  get description(): string | null { return this._description; }
  get createdAt(): Date            { return this._createdAt; }

  // -- Reglas de negocio --

  /**
   * Valida que el monto sea un número positivo mayor que cero.
   */
  static validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('El monto debe ser un valor mayor a cero', 400, 'INVALID_AMOUNT');
    }
  }

  /**
   * Valida que el origen y el destino sean cuentas distintas.
   */
  static validateDifferentAccounts(senderId: string, receiverId: string): void {
    if (senderId === receiverId) {
      throw new AppError('No puedes transferir dinero a la misma cuenta', 400, 'SAME_ACCOUNT_TRANSFER');
    }
  }

  /**
   * Genera un número de referencia único para la transferencia.
   * Formato: TRX-XXXXXXXX (8 caracteres hexadecimales en mayúsculas).
   */
  static generateReferenceNumber(): string {
    const hex = Math.floor(Math.random() * 0xFFFFFFFF)
      .toString(16)
      .toUpperCase()
      .padStart(8, '0');
    return `TRX-${hex}`;
  }

  /**
   * Reconstruye una Transaction desde la base de datos.
   */
  static fromPersistence(props: TransactionProps): Transaction {
    return new Transaction(props);
  }
}
