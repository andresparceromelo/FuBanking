import assert from 'assert';
import { CreateServicePayment } from '../application/use-cases/payment/CreateServicePayment';
import { MockPaymentGateway } from '../infrastructure/services/MockPaymentGateway';
import { IServicePaymentRepository } from '../domain/repositories/IServicePaymentRepository';
import { IAccountRepository } from '../domain/repositories/IAccountRepository';
import { IPocketRepository } from '../domain/repositories/IPocketRepository';
import { ServicePayment, ServiceType } from '../domain/entities/ServicePayment';
import { Account, AccountType } from '../domain/entities/Account';
import { Pocket } from '../domain/entities/Pocket';
import { CreatePocket } from '../application/use-cases/pocket/CreatePocket';
import { GetAccountPockets } from '../application/use-cases/pocket/GetAccountPockets';
import { UpdatePocket } from '../application/use-cases/pocket/UpdatePocket';
import { TransferPocketBalance } from '../application/use-cases/pocket/TransferPocketBalance';
import { randomUUID } from 'crypto';
import { runLoanTests } from './loan-tests';

// --- Mocks en memoria --------------------------------------------------
class InMemoryPaymentRepo implements IServicePaymentRepository {
  private store = new Map<string, ServicePayment>();
  async save(payment: ServicePayment) {
    this.store.set(payment.id, payment);
    return payment;
  }
  async findById(id: string) { return this.store.get(id) ?? null; }
  async findByUserId(userId: string) { return Array.from(this.store.values()).filter(p => p.userId === userId); }
  async update(payment: ServicePayment) { this.store.set(payment.id, payment); return payment; }
}

class InMemoryAccountRepo implements IAccountRepository {
  private store = new Map<string, Account>();
  async findById(id: string) { return this.store.get(id) ?? null; }
  async findByAccountNumber(number: string) { return null; }
  async findByUserId(userId: string) { return Array.from(this.store.values()).filter(a => a.userId === userId); }
  async save(account: Account) { this.store.set(account.id, account); return account; }
  async updateBalance(accountId: string, newBalance: number) {
    const acc = this.store.get(accountId); if (!acc) throw new Error('Account not found');
    const props = {
      id: acc.id,
      userId: acc.userId,
      accountNumber: acc.accountNumber,
      accountType: acc.accountType,
      balance: newBalance,
      status: acc.status,
      details: acc.details,
      createdAt: acc.createdAt,
    } as any;
    // @ts-ignore use constructor
    const updatedAcc = new (Account as any)(props);
    this.store.set(accountId, updatedAcc);
    return updatedAcc;
  }
}

class InMemoryPocketRepo implements IPocketRepository {
  private store = new Map<string, Pocket>();

  async findById(id: string) {
    return this.store.get(id) ?? null;
  }

  async findByAccountId(accountId: string) {
    return Array.from(this.store.values()).filter((p) => p.accountId === accountId);
  }

  async save(pocket: Pocket) {
    this.store.set(pocket.id, pocket);
    return pocket;
  }

  async update(pocket: Pocket) {
    this.store.set(pocket.id, pocket);
    return pocket;
  }

  async delete(id: string) {
    this.store.delete(id);
  }

  async getTotalAmountByAccountId(accountId: string) {
    return Array.from(this.store.values())
      .filter((p) => p.accountId === accountId)
      .reduce((sum, p) => sum + p.amount, 0);
  }
}

async function run() {
  const paymentRepo = new InMemoryPaymentRepo();
  const accountRepo = new InMemoryAccountRepo();
  const gateway = new MockPaymentGateway();

  // Crear cuenta con saldo
  const acc = Account.create({ id: randomUUID(), userId: 'user1', accountNumber: 'BA123456789', accountType: AccountType.AHORROS });
  await accountRepo.save(acc);
  await accountRepo.updateBalance(acc.id, 1000);

  const createPayment = new CreateServicePayment(paymentRepo as any, accountRepo as any, gateway);

  // Caso: pago exitoso
  const dto = { userId: 'user1', accountId: acc.id, serviceType: ServiceType.ENERGIA, providerReference: 'REF123', amount: 200 };
  const res = await createPayment.execute(dto as any);
  assert(res.amount === 200, 'Monto debe ser 200');
  const updatedAcc = await accountRepo.findById(acc.id);
  if (!updatedAcc) throw new Error('Cuenta no encontrada');
  assert((updatedAcc as any).balance === 800, 'Saldo debe descontarse a 800');

  // Caso: saldo insuficiente
  try {
    await createPayment.execute({ userId: 'user1', accountId: acc.id, serviceType: ServiceType.AGUA, providerReference: 'REF2', amount: 2000 } as any);
    throw new Error('Debería haber fallado por saldo insuficiente');
  } catch (err: any) {
    if (!/Saldo insuficiente/.test(err.message)) throw err;
  }

  // Caso: pasarela falla
  try {
    await createPayment.execute({ userId: 'user1', accountId: acc.id, serviceType: ServiceType.INTERNET, providerReference: 'FAIL_ME', amount: 50 } as any);
    throw new Error('Debería haber fallado por rechazo de pasarela');
  } catch (err: any) {
    if (!/Pago rechazado/.test(err.message)) throw err;
  }

  // --- Tests de bolsillos ------------------------------------------------
  const pocketRepo = new InMemoryPocketRepo();
  const createPocket = new CreatePocket(accountRepo as any, pocketRepo as any);
  const getAccountPockets = new GetAccountPockets(accountRepo as any, pocketRepo as any);
  const updatePocket = new UpdatePocket(accountRepo as any, pocketRepo as any);
  const transferPocketBalance = new TransferPocketBalance(accountRepo as any, pocketRepo as any);

  const pocketA = await createPocket.execute({ userId: 'user1', accountId: acc.id, name: 'Vacaciones', amount: 300 });
  assert(pocketA.amount === 300, 'El monto del bolsillo A debe ser 300');
  assert(pocketA.name === 'Vacaciones', 'El nombre del bolsillo A debe ser Vacaciones');

  const pocketB = await createPocket.execute({ userId: 'user1', accountId: acc.id, name: 'Laptop', amount: 200 });
  assert(pocketB.amount === 200, 'El monto del bolsillo B debe ser 200');

  const pockets = await getAccountPockets.execute({ userId: 'user1', accountId: acc.id });
  assert(pockets.length === 2, 'Debe haber 2 bolsillos en la cuenta');

  const updatedB = await updatePocket.execute({ userId: 'user1', pocketId: pocketB.id, amount: 300 });
  assert(updatedB.amount === 300, 'El bolso B debe actualizarse a 300');

  try {
    await updatePocket.execute({ userId: 'user1', pocketId: pocketB.id, amount: 700 });
    throw new Error('Debería haber fallado al exceder saldo disponible');
  } catch (err: any) {
    if (!/No tienes saldo disponible suficiente/.test(err.message)) throw err;
  }

  const transferResult = await transferPocketBalance.execute({ userId: 'user1', fromPocketId: pocketA.id, toPocketId: pocketB.id, amount: 200 });
  assert(transferResult.fromPocket.amount === 100, 'El bolsillo A debe quedar con 100');
  assert(transferResult.toPocket.amount === 500, 'El bolsillo B debe quedar con 500');

  console.log('All pocket tests passed');
  console.log('All payment tests passed');

  await runLoanTests();
}

run().catch((err) => { console.error(err); process.exit(1); });
