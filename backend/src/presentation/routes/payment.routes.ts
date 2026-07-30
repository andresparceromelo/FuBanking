import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { CreateServicePayment } from '../../application/use-cases/payment/CreateServicePayment';
import { GetUserPayments } from '../../application/use-cases/payment/GetUserPayments';
import { SupabaseServicePaymentRepository } from '../../infrastructure/repositories/SupabaseServicePaymentRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import { MockPaymentGateway } from '../../infrastructure/services/MockPaymentGateway';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const paymentRepo = new SupabaseServicePaymentRepository(supabaseClient);
const accountRepo = new SupabaseAccountRepository(supabaseClient);
const notificationRepo = new SupabaseNotificationRepository(supabaseClient);
const gateway = new MockPaymentGateway();

const createPayment = new CreateServicePayment(paymentRepo, accountRepo, gateway, notificationRepo);
const getUserPayments = new GetUserPayments(paymentRepo);

const controller = new PaymentController(createPayment, getUserPayments);

router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.list);

export default router;
