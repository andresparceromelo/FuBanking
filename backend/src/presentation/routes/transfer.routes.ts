import { Router } from 'express';
import { TransferController } from '../controllers/TransferController';
import { CreateTransfer } from '../../application/use-cases/transfer/CreateTransfer';
import { GetTransfer } from '../../application/use-cases/transfer/GetTransfer';
import { GetTransferHistory } from '../../application/use-cases/transfer/GetTransferHistory';
import { SearchAccountByNumber } from '../../application/use-cases/account/SearchAccountByNumber';
import { SearchUserByEmail } from '../../application/use-cases/user/SearchUserByEmail';
import { SupabaseTransactionRepository } from '../../infrastructure/repositories/SupabaseTransactionRepository';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Rutas de Transferencias: /api/v1/transfers
 *
 * Composition Root del modulo de transferencias.
 * Todas las rutas requieren JWT valido.
 */
const router = Router();

// -- Instanciar repositorios --
const transactionRepository    = new SupabaseTransactionRepository(supabaseClient);
const accountRepository        = new SupabaseAccountRepository(supabaseClient);
const userRepository           = new SupabaseUserRepository(supabaseClient);
const notificationRepository   = new SupabaseNotificationRepository(supabaseClient);

// -- Instanciar casos de uso --
const createTransfer         = new CreateTransfer(accountRepository, transactionRepository, userRepository, notificationRepository);
const getTransfer            = new GetTransfer(transactionRepository, accountRepository, userRepository);
const getTransferHistory     = new GetTransferHistory(transactionRepository, accountRepository, userRepository);
const searchAccountByNumber  = new SearchAccountByNumber(accountRepository, userRepository);
const searchUserByEmail      = new SearchUserByEmail(userRepository, accountRepository);

// -- Controlador --
const controller = new TransferController(
  createTransfer,
  getTransfer,
  getTransferHistory,
  searchAccountByNumber,
  searchUserByEmail,
);

// -- Rutas (todas protegidas) --
router.post('/', authMiddleware, controller.create);
router.get('/account/:accountId', authMiddleware, controller.getHistory);
router.get('/search/email', authMiddleware, controller.searchByEmail);
router.get('/:id', authMiddleware, controller.getById);

export default router;
