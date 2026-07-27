import { Request, Response, NextFunction } from 'express';
import { GetUserNotifications } from '../../application/use-cases/notification/GetUserNotifications';
import { MarkNotificationRead } from '../../application/use-cases/notification/MarkNotificationRead';
import { sendSuccess } from '../../shared/utils/response';

export class NotificationController {
  constructor(
    private readonly getUserNotifications: GetUserNotifications,
    private readonly markNotificationRead: MarkNotificationRead,
  ) {}

  getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notifications = await this.getUserNotifications.execute(req.user!.id);
      sendSuccess(res, notifications, 'Notificaciones obtenidas exitosamente');
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const notification = await this.markNotificationRead.execute(id);
      sendSuccess(res, notification, 'Notificación marcada como leída');
    } catch (error) {
      next(error);
    }
  };
}
