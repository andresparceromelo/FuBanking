import { AppError } from '../../shared/errors/AppError';

export enum LoanApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface LoanEligibility {
  isEligible: boolean;
  reasons: string[];
}

export interface LoanApplicationProps {
  id: string;
  userId: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome: number;
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  documentVerified: boolean;
  ageVerified: boolean;
  incomeVerified: boolean;
  creditHistoryVerified: boolean;
  eligibility: LoanEligibility;
  status: LoanApplicationStatus;
  createdAt: Date;
}

export interface CreateLoanApplicationProps {
  id: string;
  userId: string;
  amount: number;
  installments: number;
  annualRate: number;
  monthlyIncome: number;
  documentVerified: boolean;
  ageVerified: boolean;
  incomeVerified: boolean;
  creditHistoryVerified: boolean;
}

export class LoanApplication {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _amount: number;
  private readonly _installments: number;
  private readonly _annualRate: number;
  private readonly _monthlyIncome: number;
  private readonly _monthlyPayment: number;
  private readonly _totalToPay: number;
  private readonly _totalInterest: number;
  private readonly _documentVerified: boolean;
  private readonly _ageVerified: boolean;
  private readonly _incomeVerified: boolean;
  private readonly _creditHistoryVerified: boolean;
  private readonly _eligibility: LoanEligibility;
  private readonly _status: LoanApplicationStatus;
  private readonly _createdAt: Date;

  constructor(props: LoanApplicationProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._amount = props.amount;
    this._installments = props.installments;
    this._annualRate = props.annualRate;
    this._monthlyIncome = props.monthlyIncome;
    this._monthlyPayment = props.monthlyPayment;
    this._totalToPay = props.totalToPay;
    this._totalInterest = props.totalInterest;
    this._documentVerified = props.documentVerified;
    this._ageVerified = props.ageVerified;
    this._incomeVerified = props.incomeVerified;
    this._creditHistoryVerified = props.creditHistoryVerified;
    this._eligibility = props.eligibility;
    this._status = props.status;
    this._createdAt = props.createdAt;
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get amount(): number { return this._amount; }
  get installments(): number { return this._installments; }
  get annualRate(): number { return this._annualRate; }
  get monthlyIncome(): number { return this._monthlyIncome; }
  get monthlyPayment(): number { return this._monthlyPayment; }
  get totalToPay(): number { return this._totalToPay; }
  get totalInterest(): number { return this._totalInterest; }
  get documentVerified(): boolean { return this._documentVerified; }
  get ageVerified(): boolean { return this._ageVerified; }
  get incomeVerified(): boolean { return this._incomeVerified; }
  get creditHistoryVerified(): boolean { return this._creditHistoryVerified; }
  get eligibility(): LoanEligibility { return this._eligibility; }
  get status(): LoanApplicationStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }

  static create(props: CreateLoanApplicationProps): LoanApplication {
    const monthlyRate = props.annualRate / 100 / 12;
    const installments = Math.max(props.installments, 1);
    let monthlyPayment = props.amount / installments;

    if (monthlyRate > 0) {
      monthlyPayment = (props.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
    }

    const totalToPay = monthlyPayment * installments;
    const totalInterest = totalToPay - props.amount;

    const reasons: string[] = [];

    if (!props.documentVerified) reasons.push('Cédula de ciudadanía vigente requerida');
    if (!props.ageVerified) reasons.push('Debe ser mayor de edad');
    if (!props.incomeVerified) reasons.push('Se requieren ingresos fijos demostrables');
    if (!props.creditHistoryVerified) reasons.push('No se permite historial crediticio negativo');

    const eligibility = {
      isEligible: reasons.length === 0,
      reasons,
    };

    if (!eligibility.isEligible) {
      throw new AppError('No cumples con los requisitos mínimos para el préstamo', 400, 'LOAN_ELIGIBILITY_FAILED');
    }

    return new LoanApplication({
      id: props.id,
      userId: props.userId,
      amount: props.amount,
      installments,
      annualRate: props.annualRate,
      monthlyIncome: props.monthlyIncome,
      monthlyPayment,
      totalToPay,
      totalInterest,
      documentVerified: props.documentVerified,
      ageVerified: props.ageVerified,
      incomeVerified: props.incomeVerified,
      creditHistoryVerified: props.creditHistoryVerified,
      eligibility,
      status: LoanApplicationStatus.PENDING,
      createdAt: new Date(),
    });
  }
}
