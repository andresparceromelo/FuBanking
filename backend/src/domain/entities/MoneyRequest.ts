import { AppError } from '../../shared/errors/AppError';

export enum MoneyRequestStatus {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
}

export interface MoneyRequestProps {
  id: string;
  requesterUserId: string; // Quien pide el dinero
  requestedUserId: string; // A quien se le pide
  amount: number;
  description: string | null;
  status: MoneyRequestStatus;
  createdAt: Date;
}

export class MoneyRequest {
  private readonly _id: string;
  private readonly _requesterUserId: string;
  private readonly _requestedUserId: string;
  private readonly _amount: number;
  private readonly _description: string | null;
  private _status: MoneyRequestStatus;
  private readonly _createdAt: Date;

  constructor(props: MoneyRequestProps) {
    if (props.amount <= 0) {
      throw new AppError('El monto solicitado debe ser mayor a cero', 400, 'INVALID_AMOUNT');
    }
    if (props.requesterUserId === props.requestedUserId) {
      throw new AppError('No puedes solicitarte dinero a ti mismo', 400, 'SAME_USER_REQUEST');
    }

    this._id = props.id;
    this._requesterUserId = props.requesterUserId;
    this._requestedUserId = props.requestedUserId;
    this._amount = props.amount;
    this._description = props.description;
    this._status = props.status;
    this._createdAt = props.createdAt;
  }

  get id(): string { return this._id; }
  get requesterUserId(): string { return this._requesterUserId; }
  get requestedUserId(): string { return this._requestedUserId; }
  get amount(): number { return this._amount; }
  get description(): string | null { return this._description; }
  get status(): MoneyRequestStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }

  respond(accept: boolean): void {
    if (this._status !== MoneyRequestStatus.PENDIENTE) {
      throw new AppError('Esta solicitud ya fue respondida o cancelada', 400, 'REQUEST_NOT_PENDING');
    }
    this._status = accept ? MoneyRequestStatus.ACEPTADA : MoneyRequestStatus.RECHAZADA;
  }
}
