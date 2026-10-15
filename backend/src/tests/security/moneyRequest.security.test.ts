import request from 'supertest';
import { createMoneyRequestTestApp } from '../helpers/createMoneyRequestTestApp';

describe('Money Requests HTTP (seguridad)', () => {
  it('GET /me aísla las solicitudes de dinero (un tercero no las ve)', async () => {
    // Arrange
    const { app, deps } = createMoneyRequestTestApp();
    await request(app)
      .post('/api/v1/money-requests')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        requestedUserEmail: 'other.req@test.com',
        amount: 25_000,
      });

    // Act
    const resThird = await request(app)
      .get('/api/v1/money-requests/me')
      .set('Authorization', `Bearer ${deps.thirdToken}`);

    // Assert
    expect(resThird.status).toBe(200);
    expect(resThird.body.data).toHaveLength(0);
  });

  it('no permite responder una solicitud que no le fue dirigida (403/400)', async () => {
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

    // Act: thirdUser intenta responder
    const res = await request(app)
      .patch(`/api/v1/money-requests/${reqId}/respond`)
      .set('Authorization', `Bearer ${deps.thirdToken}`)
      .send({
        accept: true,
        sourceAccountId: deps.otherAccountId,
      });

    // Assert
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('no permite solicitarse dinero a uno mismo (400)', async () => {
    // Arrange
    const { app, deps } = createMoneyRequestTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/money-requests')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        requestedUserEmail: 'req.user@test.com',
        amount: 15_000,
      });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SAME_USER_REQUEST');
  });

  it('401 sin token en rutas de solicitudes de dinero', async () => {
    // Arrange
    const { app } = createMoneyRequestTestApp();

    // Act & Assert
    const postRes = await request(app).post('/api/v1/money-requests').send({});
    expect(postRes.status).toBe(401);
    expect(postRes.body.error.code).toBe('UNAUTHORIZED');

    const getRes = await request(app).get('/api/v1/money-requests/me');
    expect(getRes.status).toBe(401);
  });
});
