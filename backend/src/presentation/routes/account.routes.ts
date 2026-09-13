import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { TransferController } from '../controllers/TransferController';
import { CreateAccount } from '../../application/use-cases/account/CreateAccount';
import { GetUserAccounts } from '../../application/use-cases/account/GetUserAccounts';
import { GetAccountDetails } from '../../application/use-cases/account/GetAccountDetails';
import { DepositMoney } from '../../application/use-cases/account/DepositMoney';
import { WithdrawMoney } from '../../application/use-cases/account/WithdrawMoney';
import { SearchAccountByNumber } from '../../application/use-cases/account/SearchAccountByNumber';
import { CloseAccount } from '../../application/use-cases/account/CloseAccount';
import { SearchUserByEmail } from '../../application/use-cases/user/SearchUserByEmail';
import { CreateTransfer } from '../../application/use-cases/transfer/CreateTransfer';
import { GetTransfer } from '../../application/use-cases/transfer/GetTransfer';
import { GetTransferHistory } from '../../application/use-cases/transfer/GetTransferHistory';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseTransactionRepository } from '../../infrastructure/repositories/SupabaseTransactionRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Rutas de cuentas: /api/v1/accounts
 *
 * Este archivo actúa como el Composition Root del módulo de cuentas:
 * instancia todas las dependencias y las inyecta en los casos de uso y controller.
 *
 * Todas las rutas están protegidas — requieren JWT válido.
 */
const router = Router();

const accountRepository       = new SupabaseAccountRepository(supabaseClient);
const userRepository          = new SupabaseUserRepository(supabaseClient);
const transactionRepository   = new SupabaseTransactionRepository(supabaseClient);
const notificationRepository  = new SupabaseNotificationRepository(supabaseClient);

const createAccount        = new CreateAccount(accountRepository);
const getUserAccounts      = new GetUserAccounts(accountRepository);
const getAccountDetails    = new GetAccountDetails(accountRepository);
const depositMoney         = new DepositMoney(accountRepository, transactionRepository, notificationRepository);
const withdrawMoney        = new WithdrawMoney(accountRepository, notificationRepository);
const searchAccountByNumber = new SearchAccountByNumber(accountRepository, userRepository);
const closeAccount          = new CloseAccount(accountRepository);
const searchUserByEmail    = new SearchUserByEmail(userRepository, accountRepository);
const createTransfer       = new CreateTransfer(accountRepository, transactionRepository, userRepository, notificationRepository);
const getTransfer          = new GetTransfer(transactionRepository, accountRepository, userRepository);
const getTransferHistory   = new GetTransferHistory(transactionRepository, accountRepository, userRepository);

const controller = new AccountController(
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

router.get('/search', authMiddleware, transferController.searchByAccountNumber);
router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.getMyAccounts);
router.get('/:id', authMiddleware, controller.getDetails);
router.post('/:id/deposit', authMiddleware, controller.deposit);
router.post('/:id/withdraw', authMiddleware, controller.withdraw);
router.delete('/:id', authMiddleware, controller.close);

export default router;

