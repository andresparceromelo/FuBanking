import request from 'supertest';
import { createNotificationTestApp } from '../helpers/createNotificationTestApp';
import { Notification } from '../../domain/entities/Notification';
import { randomUUID } from 'node:crypto';

describe('Notifications HTTP (contrato)', () => {
  it('GET /me lista las notificaciones del usuario autenticado (200)', async () => {
    // Arrange
    const { app, deps } = createNotificationTestApp();
    const notif = new Notification({
      id: randomUUID(),
      userId: deps.userId,
      title: 'Bienvenido',
      message: 'Cuenta creada con éxito',
      read: false,
      createdAt: new Date(),
    });
    await deps.notifRepo.save(notif);

    // Act
    const res = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Bienvenido');
  });

  it('PATCH /:id/read marca una notificación como leída (200)', async () => {
    // Arrange
    const { app, deps } = createNotificationTestApp();
    const notif = new Notification({
      id: randomUUID(),
      userId: deps.userId,
      title: 'Alerta',
      message: 'Transferencia realizada',
      read: false,
      createdAt: new Date(),
    });
    await deps.notifRepo.save(notif);

    // Act
    const res = await request(app)
      .patch(`/api/v1/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);
  });
});
