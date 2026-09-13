import { describe, it, expect } from 'vitest';
import { Notification, NotificationType } from '../../../domain/entities/Notification';

describe('Notification — Entity', () => {
  function build(): Notification {
    return new Notification({
      id: 'notif-1',
      userId: 'user-1',
      title: 'Hola',
      message: 'Mensaje',
      type: NotificationType.SISTEMA,
      read: false,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    });
  }

  it('should expose getters and mark as read', () => {
    const notif = build();

    expect(notif.id).toBe('notif-1');
    expect(notif.userId).toBe('user-1');
    expect(notif.title).toBe('Hola');
    expect(notif.message).toBe('Mensaje');
    expect(notif.type).toBe(NotificationType.SISTEMA);
    expect(notif.read).toBe(false);
    expect(notif.createdAt).toBeInstanceOf(Date);

    notif.markAsRead();
    expect(notif.read).toBe(true);
  });

  it('should serialize with toJSON', () => {
    const json = build().toJSON();

    expect(json).toEqual({
      id: 'notif-1',
      userId: 'user-1',
      title: 'Hola',
      message: 'Mensaje',
      type: NotificationType.SISTEMA,
      read: false,
      createdAt: expect.any(Date),
    });
  });
});
