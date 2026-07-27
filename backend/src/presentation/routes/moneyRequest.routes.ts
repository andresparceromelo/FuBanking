import { Router } from 'express';
import { MoneyRequestController } from '../controllers/MoneyRequestController';
import { CreateMoneyRequest } from '../../application/use-cases/money-request/CreateMoneyRequest';
import { GetUserMoneyRequests } from '../../application/use-cases/money-request/GetUserMoneyRequests';
import { RespondMoneyRequest } from '../../application/use-cases/money-request/RespondMoneyRequest';
import { SupabaseMoneyRequestRepository } from '../../infrastructure/repositories/SupabaseMoneyRequestRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const moneyRequestRepo = new SupabaseMoneyRequestRepository(supabaseClient);
const userRepo = new SupabaseUserRepository(supabaseClient);

const createMoneyRequest = new CreateMoneyRequest(moneyRequestRepo, userRepo);
const getUserMoneyRequests = new GetUserMoneyRequests(moneyRequestRepo);
const respondMoneyRequest = new RespondMoneyRequest(moneyRequestRepo);

const controller = new MoneyRequestController(createMoneyRequest, getUserMoneyRequests, respondMoneyRequest);

router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.getMyRequests);
router.patch('/:id/respond', authMiddleware, controller.respond);

export default router;
