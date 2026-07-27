import { AppError } from '../../shared/errors/AppError';

export interface PocketProps {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePocketProps {
  id: string;
  accountId: string;
  name: string;
  amount: number;
}

export interface PublicPocket {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export class Pocket {
  private readonly _id: string;
  private readonly _accountId: string;
  private _name: string;
  private _amount: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PocketProps) {
    this._id = props.id;
    this._accountId = props.accountId;
    this._name = props.name;
    this._amount = props.amount;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.assertValidAmount(this._amount);
  }

  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get name(): string {
    return this._name;
  }

  get amount(): number {
    return this._amount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateName(name: string): void {
    if (!name.trim()) {
      throw new AppError('El nombre del bolsillo no puede estar vacío', 400, 'INVALID_POCKET_NAME');
    }
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  updateAmount(newAmount: number): void {
    this.assertValidAmount(newAmount);
    this._amount = newAmount;
    this._updatedAt = new Date();
  }

  toPublic(): PublicPocket {
    return {
      id: this._id,
      accountId: this._accountId,
      name: this._name,
      amount: this._amount,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  static create(props: CreatePocketProps): Pocket {
    return new Pocket({
      id: props.id,
      accountId: props.accountId,
      name: props.name.trim(),
      amount: props.amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private assertValidAmount(amount: number): void {
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
      throw new AppError('El monto del bolsillo debe ser un número mayor o igual a cero', 400, 'INVALID_POCKET_AMOUNT');
    }
  }
}
