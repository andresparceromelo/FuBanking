import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';

export class InMemoryNotificationRepository implements INotificationRepository {
  private readonly store = new Map<string, Notification>();

  all(): Notification[] {
    return Array.from(this.store.values());
  }

  async save(notification: Notification): Promise<Notification> {
    this.store.set(notification.id, notification);
    return notification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.all().filter((n) => n.userId === userId);
  }

  async markAsRead(id: string): Promise<Notification> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`InMemoryNotificationRepository: notificación ${id} no encontrada`);
    existing.markAsRead();
    return existing;
  }
}
