import { Application, Router } from 'express';
import { NotificationController } from '../../presentation/controllers/NotificationController';
import { GetUserNotifications } from '../../application/use-cases/notification/GetUserNotifications';
import { MarkNotificationRead } from '../../application/use-cases/notification/MarkNotificationRead';
import { authMiddleware } from '../../presentation/middlewares/authMiddleware';
import { mountTestApi } from './mountTestApi';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import {
  InMemoryNotificationRepo,
  InMemoryUserRepo,
  createTestUser,
} from '../fakes/loan.in-memory-repos';

export interface NotificationTestDeps {
  notifRepo: InMemoryNotificationRepo;
  userRepo: InMemoryUserRepo;
  userToken: string;
  userId: string;
  otherToken: string;
  otherUserId: string;
}

export function createNotificationTestApp(): { app: Application; deps: NotificationTestDeps } {
  const user = createTestUser({ email: 'notif.user@test.com', document: '1111111111' });
  const otherUser = createTestUser({ email: 'other.user@test.com', document: '2222222222' });
  const notifRepo = new InMemoryNotificationRepo();
  const userRepo = new InMemoryUserRepo([user, otherUser]);

  const controller = new NotificationController(
    new GetUserNotifications(notifRepo),
    new MarkNotificationRead(notifRepo),
  );

  const router = Router();
  router.get('/me', authMiddleware, controller.getMyNotifications);
  router.patch('/:id/read', authMiddleware, controller.markAsRead);

  const app = mountTestApi(router, '/api/v1/notifications');
  const tokens = new JwtTokenService();

  return {
    app,
    deps: {
      notifRepo,
      userRepo,
      userToken: tokens.generate({ userId: user.id, email: user.email.toString() }),
      userId: user.id,
      otherToken: tokens.generate({ userId: otherUser.id, email: otherUser.email.toString() }),
      otherUserId: otherUser.id,
    },
  };
}
