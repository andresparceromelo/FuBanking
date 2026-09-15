import { Router } from 'express';
import { CreateVirtualCard } from '../../application/use-cases/card/CreateVirtualCard';
import { DeleteVirtualCard } from '../../application/use-cases/card/DeleteVirtualCard';
import { GetUserCards } from '../../application/use-cases/card/GetUserCards';
import { RevealVirtualCardDetails } from '../../application/use-cases/card/RevealVirtualCardDetails';
import { ToggleCardLock } from '../../application/use-cases/card/ToggleCardLock';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseVirtualCardRepository } from '../../infrastructure/repositories/SupabaseVirtualCardRepository';
import { CardController } from '../controllers/CardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const cardRepo = new SupabaseVirtualCardRepository(supabaseClient);
const accountRepo = new SupabaseAccountRepository(supabaseClient);
const userRepo = new SupabaseUserRepository(supabaseClient);
const notificationRepo = new SupabaseNotificationRepository(supabaseClient);

const createVirtualCard = new CreateVirtualCard(cardRepo, accountRepo, userRepo, notificationRepo);
const getUserCards = new GetUserCards(cardRepo);
const toggleCardLock = new ToggleCardLock(cardRepo, notificationRepo);
const revealVirtualCardDetails = new RevealVirtualCardDetails(cardRepo);
const deleteVirtualCard = new DeleteVirtualCard(cardRepo, notificationRepo);

const controller = new CardController(
  createVirtualCard,
  getUserCards,
  toggleCardLock,
  revealVirtualCardDetails,
  deleteVirtualCard,
);

router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.getMyCards);
router.get('/:id/reveal', authMiddleware, controller.revealDetails);
router.patch('/:id/toggle-lock', authMiddleware, controller.toggleLock);
router.delete('/:id', authMiddleware, controller.remove);

export default router;
