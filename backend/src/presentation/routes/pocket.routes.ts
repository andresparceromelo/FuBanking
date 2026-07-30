import { Router } from 'express';
import { PocketController } from '../controllers/PocketController';
import { CreatePocket } from '../../application/use-cases/pocket/CreatePocket';
import { GetAccountPockets } from '../../application/use-cases/pocket/GetAccountPockets';
import { UpdatePocket } from '../../application/use-cases/pocket/UpdatePocket';
import { DeletePocket } from '../../application/use-cases/pocket/DeletePocket';
import { TransferPocketBalance } from '../../application/use-cases/pocket/TransferPocketBalance';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabasePocketRepository } from '../../infrastructure/repositories/SupabasePocketRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const accountRepository = new SupabaseAccountRepository(supabaseClient);
const pocketRepository = new SupabasePocketRepository(supabaseClient);
const notificationRepository = new SupabaseNotificationRepository(supabaseClient);

const createPocket = new CreatePocket(accountRepository, pocketRepository, notificationRepository);
const getAccountPockets = new GetAccountPockets(accountRepository, pocketRepository);
const updatePocket = new UpdatePocket(accountRepository, pocketRepository, notificationRepository);
const deletePocket = new DeletePocket(accountRepository, pocketRepository, notificationRepository);
const transferPocketBalance = new TransferPocketBalance(accountRepository, pocketRepository, notificationRepository);

const controller = new PocketController(
  createPocket,
  getAccountPockets,
  updatePocket,
  deletePocket,
  transferPocketBalance,
);

router.post('/', authMiddleware, controller.create);
router.get('/account/:accountId', authMiddleware, controller.listByAccount);
router.patch('/:pocketId', authMiddleware, controller.update);
router.delete('/:pocketId', authMiddleware, controller.remove);
router.post('/transfer', authMiddleware, controller.transfer);

export default router;
