import { Router } from 'express';
import { CardController } from '../controllers/CardController';
import { CreateVirtualCard } from '../../application/use-cases/card/CreateVirtualCard';
import { GetUserCards } from '../../application/use-cases/card/GetUserCards';
import { ToggleCardLock } from '../../application/use-cases/card/ToggleCardLock';
import { SupabaseVirtualCardRepository } from '../../infrastructure/repositories/SupabaseVirtualCardRepository';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const cardRepo = new SupabaseVirtualCardRepository(supabaseClient);
const accountRepo = new SupabaseAccountRepository(supabaseClient);
const userRepo = new SupabaseUserRepository(supabaseClient);

const createVirtualCard = new CreateVirtualCard(cardRepo, accountRepo, userRepo);
const getUserCards = new GetUserCards(cardRepo);
const toggleCardLock = new ToggleCardLock(cardRepo);

const controller = new CardController(createVirtualCard, getUserCards, toggleCardLock);

router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.getMyCards);
router.patch('/:id/toggle-lock', authMiddleware, controller.toggleLock);

export default router;
