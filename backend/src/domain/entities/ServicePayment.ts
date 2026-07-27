export enum ServiceType {
  ENERGIA = 'ENERGIA',
  AGUA = 'AGUA',
  INTERNET = 'INTERNET',
  CELULAR = 'CELULAR',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface ServicePaymentProps {
  id: string;
  userId: string;
  accountId: string; // cuenta desde la que se realiza el pago
  serviceType: ServiceType;
  providerReference: string; // referencia del servicio (número de contrato, medidor, teléfono)
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  processedAt?: Date | null;
}

export interface CreateServicePaymentProps {
  id: string;
  userId: string;
  accountId: string;
  serviceType: ServiceType;
  providerReference: string;
  amount: number;
}

export interface PublicServicePayment {
  id: string;
  userId: string;
  accountId: string;
  serviceType: ServiceType;
  providerReference: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  processedAt?: string | null;
}

export class ServicePayment {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _accountId: string;
  private readonly _serviceType: ServiceType;
  private readonly _providerReference: string;
  private readonly _amount: number;
  private _status: PaymentStatus;
  private readonly _createdAt: Date;
  private _processedAt: Date | null;

  constructor(props: ServicePaymentProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._accountId = props.accountId;
    this._serviceType = props.serviceType;
    this._providerReference = props.providerReference;
    this._amount = props.amount;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._processedAt = props.processedAt ?? null;
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get accountId(): string { return this._accountId; }
  get serviceType(): ServiceType { return this._serviceType; }
  get providerReference(): string { return this._providerReference; }
  get amount(): number { return this._amount; }
  get status(): PaymentStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get processedAt(): Date | null { return this._processedAt; }

  markPending(): void { this._status = PaymentStatus.PENDING; }
  markSuccess(processedAt?: Date): void {
    this._status = PaymentStatus.SUCCESS;
    this._processedAt = processedAt ?? new Date();
  }
  markFailed(processedAt?: Date): void {
    this._status = PaymentStatus.FAILED;
    this._processedAt = processedAt ?? new Date();
  }

  toPublic(): PublicServicePayment {
    return {
      id: this._id,
      userId: this._userId,
      accountId: this._accountId,
      serviceType: this._serviceType,
      providerReference: this._providerReference,
      amount: this._amount,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      processedAt: this._processedAt ? this._processedAt.toISOString() : null,
    };
  }

  static create(props: CreateServicePaymentProps): ServicePayment {
    return new ServicePayment({
      id: props.id,
      userId: props.userId,
      accountId: props.accountId,
      serviceType: props.serviceType,
      providerReference: props.providerReference,
      amount: props.amount,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      processedAt: null,
    });
  }
}
