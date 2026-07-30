import { apiClient } from '@/shared/services/api.client';
import { Notification } from '../types/notification.types';

class NotificationService {
  async getMyNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications/me');
    return response.data;
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  }
}

export const notificationService = new NotificationService();

