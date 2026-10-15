import express, { Application, Request, Response, Router } from 'express';
import { PocketController } from '../../presentation/controllers/PocketController';
import { CreatePocket } from '../../application/use-cases/pocket/CreatePocket';
import { GetAccountPockets } from '../../application/use-cases/pocket/GetAccountPockets';
import { UpdatePocket } from '../../application/use-cases/pocket/UpdatePocket';
import { DeletePocket } from '../../application/use-cases/pocket/DeletePocket';
import { TransferPocketBalance } from '../../application/use-cases/pocket/TransferPocketBalance';
import { CreateAccount } from '../../application/use-cases/account/CreateAccount';
import { GetUserAccounts } from '../../application/use-cases/account/GetUserAccounts';
import { GetAccountDetails } from '../../application/use-cases/account/GetAccountDetails';
import { DepositMoney } from '../../application/use-cases/account/DepositMoney';
import { WithdrawMoney } from '../../application/use-cases/account/WithdrawMoney';
import { CloseAccount } from '../../application/use-cases/account/CloseAccount';
import { AccountController } from '../../presentation/controllers/AccountController';
import { authMiddleware } from '../../presentation/middlewares/authMiddleware';
import { errorHandler } from '../../presentation/middlewares/errorHandler';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import { InMemoryAccountRepository } from '../fakes/InMemoryAccountRepository';
import { InMemoryPocketRepository } from '../fakes/InMemoryPocketRepository';
import { InMemoryNotificationRepository } from '../fakes/InMemoryNotificationRepository';
import { InMemoryUserRepo, createTestUser } from '../fakes/loan.in-memory-repos';
import { Account, AccountType, AccountStatus } from '../../domain/entities/Account';
import { randomUUID } from 'node:crypto';

export interface PocketTestDeps {
  accountRepository: InMemoryAccountRepository;
  pocketRepository: InMemoryPocketRepository;
  notificationRepository: InMemoryNotificationRepository;
  // Aliases for compatibility
  accountRepo: InMemoryAccountRepository;
  pocketRepo: InMemoryPocketRepository;
  notifRepo: InMemoryNotificationRepository;
  userRepo: InMemoryUserRepo;
  userToken: string;
  userId: string;
  accountId: string;
  otherToken: string;
  otherUserId: string;
  otherAccountId: string;
}

export interface PocketTestApp {
  app: Application;
  deps: PocketTestDeps;
  bearerFor(userId: string): string;
}

export function createPocketTestApp(): PocketTestApp {
  const accountRepository = new InMemoryAccountRepository();
  const pocketRepository = new InMemoryPocketRepository();
  const notificationRepository = new InMemoryNotificationRepository();

  const user = createTestUser({ email: 'pocket.user@test.com', document: '1111111111' });
  const otherUser = createTestUser({ email: 'other.pocket@test.com', document: '2222222222' });

  const account = new Account({
    id: randomUUID(),
    userId: user.id,
    accountNumber: 'ACC1000000001',
    accountType: AccountType.AHORROS,
    balance: 1_000_000,
    status: AccountStatus.ACTIVA,
    createdAt: new Date(),
    details: null,
  });
  const otherAccount = new Account({
    id: randomUUID(),
    userId: otherUser.id,
    accountNumber: 'ACC1000000002',
    accountType: AccountType.AHORROS,
    balance: 1_000_000,
    status: AccountStatus.ACTIVA,
    createdAt: new Date(),
    details: null,
  });

  accountRepository.seed(account, otherAccount);

  const userRepo = new InMemoryUserRepo([user, otherUser]);
  const tokenService = new JwtTokenService();
  const userToken = tokenService.generate({ userId: user.id, email: user.email.toString() });
  const otherToken = tokenService.generate({ userId: otherUser.id, email: otherUser.email.toString() });

  const deps: PocketTestDeps = {
    accountRepository,
    pocketRepository,
    notificationRepository,
    accountRepo: accountRepository,
    pocketRepo: pocketRepository,
    notifRepo: notificationRepository,
    userRepo,
    userToken,
    userId: user.id,
    accountId: account.id,
    otherToken,
    otherUserId: otherUser.id,
    otherAccountId: otherAccount.id,
  };

  const controller = new PocketController(
    new CreatePocket(accountRepository, pocketRepository, notificationRepository),
    new GetAccountPockets(accountRepository, pocketRepository),
    new UpdatePocket(accountRepository, pocketRepository, notificationRepository),
    new DeletePocket(accountRepository, pocketRepository, notificationRepository),
    new TransferPocketBalance(accountRepository, pocketRepository, notificationRepository),
  );

  const pocketRouter = Router();
  pocketRouter.post('/', authMiddleware, controller.create);
  pocketRouter.get('/account/:accountId', authMiddleware, controller.listByAccount);
  pocketRouter.patch('/:pocketId', authMiddleware, controller.update);
  pocketRouter.delete('/:pocketId', authMiddleware, controller.remove);
  pocketRouter.post('/transfer', authMiddleware, controller.transfer);

  const accountController = new AccountController(
    new CreateAccount(accountRepository),
    new GetUserAccounts(accountRepository),
    new GetAccountDetails(accountRepository),
    new DepositMoney(accountRepository, notificationRepository),
    new WithdrawMoney(accountRepository, notificationRepository),
    new CloseAccount(accountRepository),
  );
  const accountRouter = Router();
  accountRouter.post('/:id/deposit', authMiddleware, accountController.deposit);

  const app = express();
  app.use(express.json());
  app.use('/api/v1/pockets', pocketRouter);
  app.use('/api/v1/accounts', accountRouter);
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
  });
  app.use(errorHandler);

  const bearerFor = (userId: string): string =>
    `Bearer ${tokenService.generate({ userId, email: `${userId}@fubank.test` })}`;

  return { app, deps, bearerFor };
}
