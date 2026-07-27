import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';

export class MarkNotificationRead {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string): Promise<Notification> {
    return await this.notificationRepository.markAsRead(notificationId);
  }
}
