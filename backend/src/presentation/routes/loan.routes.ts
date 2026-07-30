import { Router } from 'express';
import { LoanController } from '../controllers/LoanController';
import { CreateLoanApplication } from '../../application/use-cases/loan/CreateLoanApplication';
import { SimulateLoan } from '../../application/use-cases/loan/SimulateLoan';
import { SupabaseLoanApplicationRepository } from '../../infrastructure/repositories/SupabaseLoanApplicationRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const loanRepo = new SupabaseLoanApplicationRepository(supabaseClient);
const userRepo = new SupabaseUserRepository(supabaseClient);
const notificationRepo = new SupabaseNotificationRepository(supabaseClient);

const simulateLoan = new SimulateLoan();
const createLoanApplication = new CreateLoanApplication(loanRepo, userRepo, notificationRepo);
const controller = new LoanController(createLoanApplication, simulateLoan);

router.post('/simulate', authMiddleware, controller.simulate);
router.post('/', authMiddleware, controller.create);

export default router;
