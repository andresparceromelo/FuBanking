import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { GetProfile } from '../../application/use-cases/profile/GetProfile';
import { UpdateProfile } from '../../application/use-cases/profile/UpdateProfile';
import { UploadDocument } from '../../application/use-cases/profile/UploadDocument';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadDocumentMiddleware } from '../middlewares/uploadMiddleware';

/**
 * Rutas de perfil: /api/v1/profile
 *
 * Todas las rutas de perfil requieren autenticación.
 */
const router = Router();

const userRepository = new SupabaseUserRepository(supabaseClient);

const controller = new ProfileController(
  new GetProfile(userRepository),
  new UpdateProfile(userRepository),
  new UploadDocument(userRepository, supabaseClient),
);

router.use(authMiddleware);

router.get('/', controller.getMyProfile);
router.patch('/', controller.updateMyProfile);
router.post('/document', uploadDocumentMiddleware, controller.uploadMyDocument);

export default router;
