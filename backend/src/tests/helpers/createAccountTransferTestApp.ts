import { Application, Router } from 'express';
import { AccountController } from '../../presentation/controllers/AccountController';
import { TransferController } from '../../presentation/controllers/TransferController';
import { CreateAccount } from '../../application/use-cases/account/CreateAccount';
import { GetUserAccounts } from '../../application/use-cases/account/GetUserAccounts';
import { GetAccountDetails } from '../../application/use-cases/account/GetAccountDetails';
import { DepositMoney } from '../../application/use-cases/account/DepositMoney';
import { WithdrawMoney } from '../../application/use-cases/account/WithdrawMoney';
import { CloseAccount } from '../../application/use-cases/account/CloseAccount';
import { SearchAccountByNumber } from '../../application/use-cases/account/SearchAccountByNumber';
import { SearchUserByEmail } from '../../application/use-cases/user/SearchUserByEmail';
import { CreateTransfer } from '../../application/use-cases/transfer/CreateTransfer';
import { GetTransfer } from '../../application/use-cases/transfer/GetTransfer';
import { GetTransferHistory } from '../../application/use-cases/transfer/GetTransferHistory';
import { authMiddleware } from '../../presentation/middlewares/authMiddleware';
import { mountTestApi } from './mountTestApi';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import {
  InMemoryAccountRepo,
  InMemoryNotificationRepo,
  InMemoryUserRepo,
  createTestUser,
} from '../fakes/loan.in-memory-repos';
import { InMemoryTransactionRepo } from '../fakes/InMemoryTransactionRepo';

export interface AccountTransferTestDeps {
  accountRepo: InMemoryAccountRepo;
  userRepo: InMemoryUserRepo;
  transRepo: InMemoryTransactionRepo;
  notifRepo: InMemoryNotificationRepo;
  userToken: string;
  userId: string;
  otherToken: string;
  otherUserId: string;
}

export function createAccountTransferTestApp(): { app: Application; deps: AccountTransferTestDeps } {
  const user = createTestUser({ email: 'acct.user@test.com', document: '1111111111' });
  const otherUser = createTestUser({ email: 'other.acct@test.com', document: '2222222222' });

  const accountRepo = new InMemoryAccountRepo();
  const userRepo = new InMemoryUserRepo([user, otherUser]);
  const transRepo = new InMemoryTransactionRepo(accountRepo);
  const notifRepo = new InMemoryNotificationRepo();

  const createAccount = new CreateAccount(accountRepo);
  const getUserAccounts = new GetUserAccounts(accountRepo);
  const getAccountDetails = new GetAccountDetails(accountRepo);
  const depositMoney = new DepositMoney(accountRepo, notifRepo);
  const withdrawMoney = new WithdrawMoney(accountRepo, notifRepo);
  const searchAccountByNumber = new SearchAccountByNumber(accountRepo, userRepo);
  const closeAccount = new CloseAccount(accountRepo);
  const searchUserByEmail = new SearchUserByEmail(userRepo, accountRepo);
  const createTransfer = new CreateTransfer(accountRepo, transRepo, userRepo, notifRepo);
  const getTransfer = new GetTransfer(transRepo, accountRepo, userRepo);
  const getTransferHistory = new GetTransferHistory(transRepo, accountRepo, userRepo);

  const accountController = new AccountController(
    createAccount,
    getUserAccounts,
    getAccountDetails,
    depositMoney,
    withdrawMoney,
    closeAccount,
  );

  const transferController = new TransferController(
    createTransfer,
    getTransfer,
    getTransferHistory,
    searchAccountByNumber,
    searchUserByEmail,
  );

  const accountRouter = Router();
  accountRouter.get('/search', authMiddleware, transferController.searchByAccountNumber);
  accountRouter.post('/', authMiddleware, accountController.create);
  accountRouter.get('/me', authMiddleware, accountController.getMyAccounts);
  accountRouter.get('/:id', authMiddleware, accountController.getDetails);
  accountRouter.post('/:id/deposit', authMiddleware, accountController.deposit);
  accountRouter.post('/:id/withdraw', authMiddleware, accountController.withdraw);
  accountRouter.delete('/:id', authMiddleware, accountController.close);

  const transferRouter = Router();
  transferRouter.post('/', authMiddleware, transferController.create);
  transferRouter.get('/account/:accountId', authMiddleware, transferController.getHistory);
  transferRouter.get('/search/email', authMiddleware, transferController.searchByEmail);
  transferRouter.get('/:id', authMiddleware, transferController.getById);

  const masterRouter = Router();
  masterRouter.use('/accounts', accountRouter);
  masterRouter.use('/transfers', transferRouter);

  const app = mountTestApi(masterRouter, '/api/v1');
  const tokens = new JwtTokenService();

  return {
    app,
    deps: {
      accountRepo,
      userRepo,
      transRepo,
      notifRepo,
      userToken: tokens.generate({ userId: user.id, email: user.email.toString() }),
      userId: user.id,
      otherToken: tokens.generate({ userId: otherUser.id, email: otherUser.email.toString() }),
      otherUserId: otherUser.id,
    },
  };
}
