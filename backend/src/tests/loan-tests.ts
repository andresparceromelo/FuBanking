import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { CreateLoanApplication } from '../application/use-cases/loan/CreateLoanApplication';
import { SimulateLoan } from '../application/use-cases/loan/SimulateLoan';
import { LoanApplication, LoanApplicationStatus } from '../domain/entities/LoanApplication';
import { ILoanApplicationRepository } from '../domain/repositories/ILoanApplicationRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { User } from '../domain/entities/User';
import { Email } from '../domain/value-objects/Email';
import { Document } from '../domain/value-objects/Document';

class InMemoryLoanRepo implements ILoanApplicationRepository {
  private readonly store = new Map<string, LoanApplication>();

  async save(loan: LoanApplication) {
    this.store.set(loan.id, loan);
    return loan;
  }

  async findByUserId(userId: string) {
    return Array.from(this.store.values()).filter((loan) => loan.userId === userId);
  }
}

class InMemoryUserRepo implements IUserRepository {
  private readonly store = new Map<string, User>();

  constructor(users: User[]) {
    users.forEach((user) => this.store.set(user.id, user));
  }

  async findById(id: string) {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string) {
    const emailValueObj = new Email(email);
    return Array.from(this.store.values()).find((user) => user.email.equals(emailValueObj)) ?? null;
  }

  async findByDocument(document: string) {
    const documentValueObj = new Document(document);
    return Array.from(this.store.values()).find((user) => user.document.equals(documentValueObj)) ?? null;
  }

  async save(user: User) {
    this.store.set(user.id, user);
    return user;
  }

  async update(id: string, data: any) {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user;
  }

  async updateTwoFactor(id: string, enabled: boolean) {
    const user = this.store.get(id);
    if (!user) throw new Error('User not found');
    (user as any).twoFactorEnabled = enabled;
    return user;
  }

  async delete(id: string) {
    this.store.delete(id);
  }
}

export async function runLoanTests() {
  const user = User.create({
    id: randomUUID(),
    firstName: 'Camilo',
    lastName: 'Torres',
    email: new Email('camilo@example.com'),
    passwordHash: 'hash',
    document: new Document('1234567890'),
    birthDate: new Date('1995-01-01'),
  });

  const userRepo = new InMemoryUserRepo([user]);
  const loanRepo = new InMemoryLoanRepo();

  const simulateLoan = new SimulateLoan();
  const simulateResult = await simulateLoan.execute({
    amount: 5000000,
    installments: 12,
    annualRate: 24,
  });

  assert(simulateResult.monthlyPayment > 0, 'La cuota mensual debe calcularse');
  assert(simulateResult.totalToPay > simulateResult.amount, 'El total pagado debe incluir intereses');
  assert(simulateResult.totalInterest > 0, 'Debe calcularse el total de intereses');

  const createLoan = new CreateLoanApplication(loanRepo as any, userRepo as any);
  const created = await createLoan.execute({
    userId: user.id,
    amount: 5000000,
    installments: 12,
    annualRate: 24,
    monthlyIncome: 1800000,
    documentVerified: true,
    ageVerified: true,
    incomeVerified: true,
    creditHistoryVerified: true,
  } as any);

  assert(created.status === LoanApplicationStatus.PENDING, 'El préstamo debe quedar pendiente tras crear la solicitud');
  assert(created.eligibility.isEligible === true, 'El usuario debe ser elegible con los datos completos');
  assert(created.monthlyPayment > 0, 'Debe existir una cuota mensual estimada');

  try {
    await createLoan.execute({
      userId: user.id,
      amount: 4000000,
      installments: 10,
      annualRate: 20,
      monthlyIncome: 1000000,
      documentVerified: true,
      ageVerified: true,
      incomeVerified: false,
      creditHistoryVerified: true,
    } as any);
    throw new Error('El préstamo debería haber sido rechazado por requisitos incompletos');
  } catch (err: any) {
    assert(/requisitos/i.test(err.message), 'Debe lanzar un error de requisitos incompletos');
  }

  console.log('All loan tests passed');
}
