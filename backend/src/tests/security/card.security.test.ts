import request from 'supertest';
import { createCardTestApp } from '../helpers/createCardTestApp';

describe('Cards HTTP (seguridad)', () => {
  it('GET /me lista solo las tarjetas del usuario autenticado (aislamiento)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });

    await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({ accountId: deps.otherAccountId });

    // Act
    const resUser1 = await request(app)
      .get('/api/v1/cards/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    const resUser2 = await request(app)
      .get('/api/v1/cards/me')
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(resUser1.status).toBe(200);
    expect(resUser1.body.data).toHaveLength(1);
    expect(resUser1.body.data[0].accountId).toBe(deps.accountId);

    expect(resUser2.status).toBe(200);
    expect(resUser2.body.data).toHaveLength(1);
    expect(resUser2.body.data[0].accountId).toBe(deps.otherAccountId);
  });

  it('no permite revelar detalles de tarjeta ajena (403/404)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    const created = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });
    const cardId = created.body.data.id;

    // Act: otherUser intenta ver la tarjeta de user
    const res = await request(app)
      .get(`/api/v1/cards/${cardId}/reveal`)
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert: debe rechazar acceso no autorizado a los datos sensibles
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('no permite bloquear tarjeta ajena (403/404)', async () => {
    // Arrange
    const { app, deps } = createCardTestApp();
    const created = await request(app)
      .post('/api/v1/cards')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId });
    const cardId = created.body.data.id;

    // Act
    const res = await request(app)
      .patch(`/api/v1/cards/${cardId}/toggle-lock`)
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('401 sin token en rutas de tarjetas', async () => {
    // Arrange
    const { app } = createCardTestApp();

    // Act & Assert
    const createRes = await request(app).post('/api/v1/cards').send({});
    expect(createRes.status).toBe(401);
    expect(createRes.body.error.code).toBe('UNAUTHORIZED');

    const listRes = await request(app).get('/api/v1/cards/me');
    expect(listRes.status).toBe(401);

    const revealRes = await request(app).get('/api/v1/cards/123/reveal');
    expect(revealRes.status).toBe(401);
  });
});
