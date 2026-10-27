import { Application, Router } from 'express';
import { MoneyRequestController } from '../../presentation/controllers/MoneyRequestController';
import { CreateMoneyRequest } from '../../application/use-cases/money-request/CreateMoneyRequest';
import { GetUserMoneyRequests } from '../../application/use-cases/money-request/GetUserMoneyRequests';
import { RespondMoneyRequest } from '../../application/use-cases/money-request/RespondMoneyRequest';
import { authMiddleware } from '../../presentation/middlewares/authMiddleware';
import { mountTestApi } from './mountTestApi';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import {
  InMemoryAccountRepo,
  InMemoryNotificationRepo,
  InMemoryUserRepo,
  createTestUser,
} from '../fakes/loan.in-memory-repos';
import { InMemoryMoneyRequestRepo } from '../fakes/InMemoryMoneyRequestRepo';
import { InMemoryTransactionRepo } from '../fakes/InMemoryTransactionRepo';
import { Account, AccountType } from '../../domain/entities/Account';
import { randomUUID } from 'node:crypto';

export interface MoneyRequestTestDeps {
  moneyRequestRepo: InMemoryMoneyRequestRepo;
  userRepo: InMemoryUserRepo;
  accountRepo: InMemoryAccountRepo;
  transRepo: InMemoryTransactionRepo;
  notifRepo: InMemoryNotificationRepo;
  userToken: string;
  userId: string;
  otherToken: string;
  otherUserId: string;
  otherAccountId: string;
  thirdToken: string;
  thirdUserId: string;
}

export function createMoneyRequestTestApp(): { app: Application; deps: MoneyRequestTestDeps } {
  const user = createTestUser({ email: 'req.user@test.com', document: '1111111111' });
  const otherUser = createTestUser({ email: 'other.req@test.com', document: '2222222222' });
  const thirdUser = createTestUser({ email: 'third.req@test.com', document: '3333333333' });

  const accountRepo = new InMemoryAccountRepo();
  const otherAccount = Account.create({
    id: randomUUID(),
    userId: otherUser.id,
    accountNumber: 'ACC4000000001',
    accountType: AccountType.AHORROS,
  });
  const userAccount = Account.create({
    id: randomUUID(),
    userId: user.id,
    accountNumber: 'ACC4000000002',
    accountType: AccountType.AHORROS,
  });
  accountRepo.save(otherAccount);
  accountRepo.save(userAccount);
  accountRepo.updateBalance(otherAccount.id, 200_000);
  accountRepo.updateBalance(userAccount.id, 50_000);

  const userRepo = new InMemoryUserRepo([user, otherUser, thirdUser]);
  const moneyRequestRepo = new InMemoryMoneyRequestRepo();
  const transRepo = new InMemoryTransactionRepo(accountRepo);
  const notifRepo = new InMemoryNotificationRepo();

  const controller = new MoneyRequestController(
    new CreateMoneyRequest(moneyRequestRepo, userRepo, notifRepo),
    new GetUserMoneyRequests(moneyRequestRepo),
    new RespondMoneyRequest(moneyRequestRepo, userRepo, accountRepo, transRepo, notifRepo),
  );

  const router = Router();
  router.post('/', authMiddleware, controller.create);
  router.get('/me', authMiddleware, controller.getMyRequests);
  router.patch('/:id/respond', authMiddleware, controller.respond);

  const app = mountTestApi(router, '/api/v1/money-requests');
  const tokens = new JwtTokenService();

  return {
    app,
    deps: {
      moneyRequestRepo,
      userRepo,
      accountRepo,
      transRepo,
      notifRepo,
      userToken: tokens.generate({ userId: user.id, email: user.email.toString() }),
      userId: user.id,
      otherToken: tokens.generate({ userId: otherUser.id, email: otherUser.email.toString() }),
      otherUserId: otherUser.id,
      otherAccountId: otherAccount.id,
      thirdToken: tokens.generate({ userId: thirdUser.id, email: thirdUser.email.toString() }),
      thirdUserId: thirdUser.id,
    },
  };
}
