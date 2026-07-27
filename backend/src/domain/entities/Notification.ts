export enum NotificationType {
  TRANSFERENCIA = 'TRANSFERENCIA',
  PAGO = 'PAGO',
  BOLSILLO = 'BOLSILLO',
  SOLICITUD_DINERO = 'SOLICITUD_DINERO',
  SISTEMA = 'SISTEMA',
}

export interface NotificationProps {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

export class Notification {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _title: string;
  private readonly _message: string;
  private readonly _type: NotificationType;
  private _read: boolean;
  private readonly _createdAt: Date;

  constructor(props: NotificationProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._title = props.title;
    this._message = props.message;
    this._type = props.type;
    this._read = props.read;
    this._createdAt = props.createdAt;
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get title(): string { return this._title; }
  get message(): string { return this._message; }
  get type(): NotificationType { return this._type; }
  get read(): boolean { return this._read; }
  get createdAt(): Date { return this._createdAt; }

  markAsRead(): void {
    this._read = true;
  }
}
