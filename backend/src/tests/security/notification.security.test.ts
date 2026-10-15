import request from 'supertest';
import { createNotificationTestApp } from '../helpers/createNotificationTestApp';
import { Notification } from '../../domain/entities/Notification';
import { randomUUID } from 'node:crypto';

describe('Notifications HTTP (seguridad)', () => {
  it('GET /me lista solo notificaciones propias (aislamiento entre usuarios)', async () => {
    // Arrange
    const { app, deps } = createNotificationTestApp();
    const notifUser1 = new Notification({
      id: randomUUID(),
      userId: deps.userId,
      title: 'Notif 1',
      message: 'Mensaje 1',
      read: false,
      createdAt: new Date(),
    });
    const notifUser2 = new Notification({
      id: randomUUID(),
      userId: deps.otherUserId,
      title: 'Notif 2',
      message: 'Mensaje 2',
      read: false,
      createdAt: new Date(),
    });
    await deps.notifRepo.save(notifUser1);
    await deps.notifRepo.save(notifUser2);

    // Act
    const resUser1 = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${deps.userToken}`);
    const resUser2 = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(resUser1.status).toBe(200);
    expect(resUser1.body.data).toHaveLength(1);
    expect(resUser1.body.data[0].id).toBe(notifUser1.id);

    expect(resUser2.status).toBe(200);
    expect(resUser2.body.data).toHaveLength(1);
    expect(resUser2.body.data[0].id).toBe(notifUser2.id);
  });

  it('401 sin token en GET /me', async () => {
    // Arrange
    const { app } = createNotificationTestApp();

    // Act
    const res = await request(app).get('/api/v1/notifications/me');

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('401 sin token en PATCH /:id/read', async () => {
    // Arrange
    const { app } = createNotificationTestApp();

    // Act
    const res = await request(app).patch('/api/v1/notifications/123/read');

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('401 con token inválido', async () => {
    // Arrange
    const { app } = createNotificationTestApp();

    // Act
    const res = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', 'Bearer invalid-token');

    // Assert
    expect(res.status).toBe(401);
  });
});
