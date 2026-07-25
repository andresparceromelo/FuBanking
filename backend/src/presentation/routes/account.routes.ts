import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { CreateAccount } from '../../application/use-cases/account/CreateAccount';
import { GetUserAccounts } from '../../application/use-cases/account/GetUserAccounts';
import { GetAccountDetails } from '../../application/use-cases/account/GetAccountDetails';
import { SupabaseAccountRepository } from '../../infrastructure/repositories/SupabaseAccountRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

/**
 * Rutas de cuentas: /api/v1/accounts
 *
 * Este archivo actúa como el Composition Root del módulo de cuentas:
 * instancia todas las dependencias y las inyecta en los casos de uso y controller.
 *
 * Todas las rutas están protegidas — requieren JWT válido.
 */
const router = Router();

// ── Instanciar dependencias (Dependency Injection manual) ─────────────────
const accountRepository = new SupabaseAccountRepository(supabaseClient);

// ── Casos de uso ──────────────────────────────────────────────────────────
const createAccount = new CreateAccount(accountRepository);
const getUserAccounts = new GetUserAccounts(accountRepository);
const getAccountDetails = new GetAccountDetails(accountRepository);

// ── Controlador ───────────────────────────────────────────────────────────
const controller = new AccountController(
  createAccount,
  getUserAccounts,
  getAccountDetails,
);

// ── Rutas (todas protegidas con JWT) ─────────────────────────────────────
router.post('/', authMiddleware, controller.create);
router.get('/me', authMiddleware, controller.getMyAccounts);
router.get('/:id', authMiddleware, controller.getDetails);

export default router;
