import { AppError } from '../../shared/errors/AppError';

export enum CardStatus {
  ACTIVA = 'ACTIVA',
  BLOQUEADA = 'BLOQUEADA',
  CANCELADA = 'CANCELADA',
}

export interface VirtualCardProps {
  id: string;
  userId: string;
  accountId: string;
  cardHolderName: string;
  cardNumber: string; // 16 dígitos
  lastFour: string;
  expirationDate: string; // MM/YY
  cvv: string;
  status: CardStatus;
  createdAt: Date;
}

export interface PublicVirtualCard {
  id: string;
  userId: string;
  accountId: string;
  cardHolderName: string;
  lastFour: string;
  expirationDate: string;
  cvvMasked: string;
  status: CardStatus;
  createdAt: string;
}

export class VirtualCard {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _accountId: string;
  private readonly _cardHolderName: string;
  private readonly _cardNumber: string;
  private readonly _lastFour: string;
  private readonly _expirationDate: string;
  private readonly _cvv: string;
  private _status: CardStatus;
  private readonly _createdAt: Date;

  constructor(props: VirtualCardProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._accountId = props.accountId;
    this._cardHolderName = props.cardHolderName;
    this._cardNumber = props.cardNumber;
    this._lastFour = props.lastFour;
    this._expirationDate = props.expirationDate;
    this._cvv = props.cvv;
    this._status = props.status;
    this._createdAt = props.createdAt;
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get accountId(): string { return this._accountId; }
  get cardHolderName(): string { return this._cardHolderName; }
  get cardNumber(): string { return this._cardNumber; }
  get lastFour(): string { return this._lastFour; }
  get expirationDate(): string { return this._expirationDate; }
  get cvv(): string { return this._cvv; }
  get status(): CardStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }

  toggleLock(): void {
    if (this._status === CardStatus.CANCELADA) {
      throw new AppError('No se puede modificar el estado de una tarjeta cancelada', 400, 'CARD_CANCELLED');
    }
    this._status = this._status === CardStatus.ACTIVA ? CardStatus.BLOQUEADA : CardStatus.ACTIVA;
  }

  toPublic(): PublicVirtualCard {
    return {
      id: this._id,
      userId: this._userId,
      accountId: this._accountId,
      cardHolderName: this._cardHolderName,
      lastFour: this._lastFour,
      expirationDate: this._expirationDate,
      cvvMasked: '***',
      status: this._status,
      createdAt: this._createdAt.toISOString(),
    };
  }

  static generateNumber(): { cardNumber: string; lastFour: string; expirationDate: string; cvv: string } {
    const prefix = '4532'; // Visa Prefix
    const middle = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    const end = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
    const cardNumber = `${prefix}${middle}${end}`;
    const lastFour = end;
    
    const now = new Date();
    const expMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expYear = String((now.getFullYear() + 4) % 100).padStart(2, '0');
    const expirationDate = `${expMonth}/${expYear}`;

    const cvv = String(Math.floor(100 + Math.random() * 900));

    return { cardNumber, lastFour, expirationDate, cvv };
  }
}
