import { Application, Router } from 'express';
import { PaymentController } from '../../presentation/controllers/PaymentController';
import { CreateServicePayment } from '../../application/use-cases/payment/CreateServicePayment';
import { GetUserPayments } from '../../application/use-cases/payment/GetUserPayments';
import { authMiddleware } from '../../presentation/middlewares/authMiddleware';
import { mountTestApi } from './mountTestApi';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import {
  InMemoryAccountRepo,
  InMemoryNotificationRepo,
  InMemoryUserRepo,
  createTestUser,
} from '../fakes/loan.in-memory-repos';
import { InMemoryServicePaymentRepo } from '../fakes/InMemoryServicePaymentRepo';
import { MockPaymentGateway } from '../../infrastructure/services/MockPaymentGateway';
import { Account, AccountType } from '../../domain/entities/Account';
import { randomUUID } from 'node:crypto';

export interface PaymentTestDeps {
  paymentRepo: InMemoryServicePaymentRepo;
  accountRepo: InMemoryAccountRepo;
  notifRepo: InMemoryNotificationRepo;
  userRepo: InMemoryUserRepo;
  userToken: string;
  userId: string;
  accountId: string;
  otherToken: string;
  otherUserId: string;
}

export function createPaymentTestApp(): { app: Application; deps: PaymentTestDeps } {
  const user = createTestUser({ email: 'pay.user@test.com', document: '1111111111' });
  const otherUser = createTestUser({ email: 'other.pay@test.com', document: '2222222222' });

  const account = Account.create({
    id: randomUUID(),
    userId: user.id,
    accountNumber: 'ACC3000000001',
    accountType: AccountType.AHORROS,
  });

  const accountRepo = new InMemoryAccountRepo();
  accountRepo.save(account);
  accountRepo.updateBalance(account.id, 500_000);

  const paymentRepo = new InMemoryServicePaymentRepo();
  const notifRepo = new InMemoryNotificationRepo();
  const userRepo = new InMemoryUserRepo([user, otherUser]);
  const gateway = new MockPaymentGateway();

  const controller = new PaymentController(
    new CreateServicePayment(paymentRepo, accountRepo, gateway, notifRepo),
    new GetUserPayments(paymentRepo),
  );

  const router = Router();
  router.post('/', authMiddleware, controller.create);
  router.get('/me', authMiddleware, controller.list);

  const app = mountTestApi(router, '/api/v1/payments');
  const tokens = new JwtTokenService();

  return {
    app,
    deps: {
      paymentRepo,
      accountRepo,
      notifRepo,
      userRepo,
      userToken: tokens.generate({ userId: user.id, email: user.email.toString() }),
      userId: user.id,
      accountId: account.id,
      otherToken: tokens.generate({ userId: otherUser.id, email: otherUser.email.toString() }),
      otherUserId: otherUser.id,
    },
  };
}
