'use client';

import { useCallback, useMemo, useState } from 'react';
import { notificationService } from '../services/notification.service';
import { Notification } from '../types/notification.types';

function getMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}

function isUnread(notification: Notification) {
  if (typeof notification.isRead === 'boolean') return !notification.isRead;
  if (typeof notification.read === 'boolean') return !notification.read;
  return true;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter(isUnread).length, [notifications]);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
      return data;
    } catch (err) {
      setError(getMessage(err, 'No se pudieron cargar las notificaciones.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const notification = await notificationService.markAsRead(notificationId);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? notification : item)));
      return notification;
    } catch (err) {
      setError(getMessage(err, 'No se pudo marcar como leida.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { notifications, unreadCount, isLoading, error, setError, fetchNotifications, markAsRead };
}

