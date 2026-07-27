import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { GetUserNotifications } from '../../application/use-cases/notification/GetUserNotifications';
import { MarkNotificationRead } from '../../application/use-cases/notification/MarkNotificationRead';
import { SupabaseNotificationRepository } from '../../infrastructure/repositories/SupabaseNotificationRepository';
import supabaseClient from '../../infrastructure/database/supabase.client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

const notificationRepo = new SupabaseNotificationRepository(supabaseClient);
const getUserNotifications = new GetUserNotifications(notificationRepo);
const markNotificationRead = new MarkNotificationRead(notificationRepo);

const controller = new NotificationController(getUserNotifications, markNotificationRead);

router.get('/me', authMiddleware, controller.getMyNotifications);
router.patch('/:id/read', authMiddleware, controller.markAsRead);

export default router;
