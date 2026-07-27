import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import accountRoutes from './account.routes';
import paymentRoutes from './payment.routes';
import pocketRoutes from './pocket.routes';
import loanRoutes from './loan.routes';
import transferRoutes from './transfer.routes';
import cardRoutes from './card.routes';
import moneyRequestRoutes from './moneyRequest.routes';
import notificationRoutes from './notification.routes';

/**
 * Router raíz de la API.
 *
 * Registra todos los sub-routers con su prefijo correspondiente.
 * Al agregar nuevos módulos (cuentas, tarjetas, etc.) solo se añaden aquí.
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/accounts', accountRoutes);
router.use('/payments', paymentRoutes);
router.use('/pockets', pocketRoutes);
router.use('/loans', loanRoutes);
router.use('/transfers', transferRoutes);
router.use('/cards', cardRoutes);
router.use('/money-requests', moneyRequestRoutes);
router.use('/notifications', notificationRoutes);

export default router;

