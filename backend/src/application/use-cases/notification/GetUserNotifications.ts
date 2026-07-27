import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

export class GetUserNotifications {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.findByUserId(userId);
  }
}
