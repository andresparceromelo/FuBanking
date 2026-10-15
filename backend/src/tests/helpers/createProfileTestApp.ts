import { Application, Router } from 'express';
import { ProfileController } from '../../presentation/controllers/ProfileController';
import { GetProfile } from '../../application/use-cases/profile/GetProfile';
import { UpdateProfile } from '../../application/use-cases/profile/UpdateProfile';
import { UploadDocument } from '../../application/use-cases/profile/UploadDocument';
import { authMiddleware } from '../../presentation/middlewares/authMiddleware';
import { mountTestApi } from './mountTestApi';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import {
  InMemoryUserRepo,
  createTestUser,
} from '../fakes/loan.in-memory-repos';

export interface ProfileTestDeps {
  userRepo: InMemoryUserRepo;
  userToken: string;
  userId: string;
  otherToken: string;
  otherUserId: string;
}

export function createProfileTestApp(): { app: Application; deps: ProfileTestDeps } {
  const user = createTestUser({ email: 'profile.user@test.com', document: '1111111111' });
  const otherUser = createTestUser({ email: 'other.profile@test.com', document: '2222222222' });
  const userRepo = new InMemoryUserRepo([user, otherUser]);

  const fakeSupabaseStorage: any = {
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'uploads/doc.pdf' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage/uploads/doc.pdf' } }),
      }),
    },
  };

  const controller = new ProfileController(
    new GetProfile(userRepo),
    new UpdateProfile(userRepo),
    new UploadDocument(userRepo, fakeSupabaseStorage),
  );

  const router = Router();
  router.use(authMiddleware);
  router.get('/', controller.getMyProfile);
  router.patch('/', controller.updateMyProfile);

  const app = mountTestApi(router, '/api/v1/profile');
  const tokens = new JwtTokenService();

  return {
    app,
    deps: {
      userRepo,
      userToken: tokens.generate({ userId: user.id, email: user.email.toString() }),
      userId: user.id,
      otherToken: tokens.generate({ userId: otherUser.id, email: otherUser.email.toString() }),
      otherUserId: otherUser.id,
    },
  };
}
