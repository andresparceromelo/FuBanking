import { Notification } from '../entities/Notification';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findByUserId(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification>;
}
