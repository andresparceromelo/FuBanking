import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import accountRoutes from './account.routes';

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

export default router;
