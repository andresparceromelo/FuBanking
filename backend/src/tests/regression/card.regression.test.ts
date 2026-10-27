import request from 'supertest';
import { createCardTestApp } from '../helpers/createCardTestApp';

describe('Cards HTTP (contrato)', () => {
  it('POST / crea una tarjeta virtual vinculada a la cuenta (201)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountId).toBe(deps.accountId);
    expect(res.body.data.lastFour).toBeDefined();
    expect(res.body.data.status).toBe('ACTIVA');
  });

  it('GET /me lista las tarjetas del usuario (200)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });

    // Act
    const res = await request(app)
      .get('/api/v1/cards/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /:id/reveal revela número completo y CVV (200)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    const created = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });
    const cardId = created.body.data.id;

    // Act
    const res = await request(app)
      .get(`/api/v1/cards/${cardId}/reveal`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cardNumber).toBeDefined();
    expect(res.body.data.cvv).toBeDefined();
  });

  it('PATCH /:id/toggle-lock alterna el estado bloqueado/desbloqueado (200)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    const created = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });
    const cardId = created.body.data.id;

    // Act: bloquear
    const lockRes = await request(app)
      .patch(`/api/v1/cards/${cardId}/toggle-lock`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(lockRes.status).toBe(200);
    expect(lockRes.body.data.status).toBe('BLOQUEADA');

    // Act: desbloquear
    const unlockRes = await request(app)
      .patch(`/api/v1/cards/${cardId}/toggle-lock`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.data.status).toBe('ACTIVA');
  });

  it('DELETE /:id cancela/elimina la tarjeta virtual (200)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    const created = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });
    const cardId = created.body.data.id;

    // Act
    const res = await request(app)
      .delete(`/api/v1/cards/${cardId}`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
