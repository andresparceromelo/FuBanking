import request from 'supertest';
import { createMoneyRequestTestApp } from '../helpers/createMoneyRequestTestApp';

describe('Money Requests HTTP (contrato)', () => {
  it('POST / crea una solicitud de dinero (201)', async () => {
    // Arrange
    const { app, deps } = createMoneyRequestTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/money-requests')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        requestedUserEmail: 'other.req@test.com',
        amount: 35_000,
        description: 'Almuerzo compartido',
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(35_000);
    expect(res.body.data.status).toBe('PENDIENTE');
  });

  it('GET /me lista las solicitudes de dinero del usuario (200)', async () => {
    // Arrange
    const { app, deps } = createMoneyRequestTestApp();
    await request(app)
      .post('/api/v1/money-requests')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        requestedUserEmail: 'other.req@test.com',
        amount: 20_000,
      });

    // Act
    const res = await request(app)
      .get('/api/v1/money-requests/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('PATCH /:id/respond permite al destinatario aceptar o rechazar (200)', async () => {
    // Arrange
    const { app, deps } = createMoneyRequestTestApp();
    const created = await request(app)
      .post('/api/v1/money-requests')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        requestedUserEmail: 'other.req@test.com',
        amount: 15_000,
      });
    const reqId = created.body.data.id;

    // Act: otherUser responde aceptando
    const res = await request(app)
      .patch(`/api/v1/money-requests/${reqId}/respond`)
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({
        accept: true,
        accountId: deps.otherAccountId,
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACEPTADA');
  });
});
