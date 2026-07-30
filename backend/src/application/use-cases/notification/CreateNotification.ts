import { randomUUID } from 'crypto';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';

interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

export class CreateNotification {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification({
      id: randomUUID(),
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      read: false,
      createdAt: new Date(),
    });

    return this.notificationRepository.save(notification);
  }
}
