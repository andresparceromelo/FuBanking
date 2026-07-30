import { SupabaseClient } from '@supabase/supabase-js';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification, NotificationProps, NotificationType } from '../../domain/entities/Notification';
import { AppError } from '../../shared/errors/AppError';

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export class SupabaseNotificationRepository implements INotificationRepository {
  private readonly TABLE = 'notifications';

  constructor(private readonly client: SupabaseClient) {}

  private mapRowToNotification(row: NotificationRow): Notification {
    const props: NotificationProps = {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type as NotificationType,
      read: row.read,
      createdAt: new Date(row.created_at),
    };
    return new Notification(props);
  }

  async save(notification: Notification): Promise<Notification> {
    const row = {
      id: notification.id,
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      console.error('Error al guardar notificación:', error?.message, error?.details);
      throw new AppError(`Error al guardar notificación: ${error?.message ?? 'Desconocido'}`, 500, 'DB_ERROR');
    }

    return this.mapRowToNotification(data as NotificationRow);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as NotificationRow[]).map(row => this.mapRowToNotification(row));
  }

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al actualizar notificación');
    }

    return this.mapRowToNotification(data as NotificationRow);
  }
}
