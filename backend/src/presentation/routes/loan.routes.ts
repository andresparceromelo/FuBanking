import { Router } from 'express';
import { LoanController } from '../controllers/LoanController';
import { CreateLoanApplication } from '../../application/use-cases/loan/CreateLoanApplication';
import { SimulateLoan } from '../../application/use-cases/loan/SimulateLoan';
import { GetAllLoans } from '../../application/use-cases/loan/GetAllLoans';
import { GetUserLoans } from '../../application/use-cases/loan/GetUserLoans';
import { ApproveLoan } from '../../application/use-cases/loan/ApproveLoan';
import { RejectLoan } from '../../application/use-cases/loan/RejectLoan';
import { SupabaseLoanApplicationRepository } from '../../infrastructure/repositories/SupabaseLoanApplicationRepository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

const loanRepo = new SupabaseLoanApplicationRepository(supabaseClient);
const userRepo = new SupabaseUserRepository(supabaseClient);
const notificationRepo = new SupabaseNotificationRepository(supabaseClient);
const accountRepo = new SupabaseAccountRepository(supabaseClient);

const simulateLoan = new SimulateLoan();
const createLoanApplication = new CreateLoanApplication(loanRepo, userRepo, notificationRepo);
const getAllLoans = new GetAllLoans(loanRepo);
const getUserLoans = new GetUserLoans(loanRepo);
const approveLoan = new ApproveLoan(loanRepo, accountRepo, userRepo, notificationRepo);
const rejectLoan = new RejectLoan(loanRepo, notificationRepo);

const controller = new LoanController(
  createLoanApplication,
  simulateLoan,
  getAllLoans,
  getUserLoans,
  approveLoan,
  rejectLoan,
);

router.post('/simulate', authMiddleware, controller.simulate);
router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.getMyLoans);

router.get('/admin', authMiddleware, adminMiddleware, controller.getAll);
router.patch('/admin/:id/approve', authMiddleware, adminMiddleware, controller.approve);
router.patch('/admin/:id/reject', authMiddleware, adminMiddleware, controller.reject);

export default router;
