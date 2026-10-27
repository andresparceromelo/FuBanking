import request from 'supertest';
import { createPocketTestApp } from '../helpers/createPocketTestApp';

describe('Pockets HTTP (seguridad)', () => {
  it('GET /account/:accountId no permite a otro usuario ver bolsillos ajenos (403)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();
    await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId, name: 'Privado', amount: 50_000 });

    // Act
    const res = await request(app)
      .get(`/api/v1/pockets/account/${deps.accountId}`)
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('401 sin token en rutas protegidas de bolsillos', async () => {
    // Arrange
    const { app } = createPocketTestApp();

    // Act & Assert
    const createRes = await request(app).post('/api/v1/pockets').send({});
    expect(createRes.status).toBe(401);
    expect(createRes.body.error.code).toBe('UNAUTHORIZED');

    const getRes = await request(app).get('/api/v1/pockets/account/acc-1');
    expect(getRes.status).toBe(401);

    const deleteRes = await request(app).delete('/api/v1/pockets/poc-1');
    expect(deleteRes.status).toBe(401);
  });

  it('401 con token inválido', async () => {
    // Arrange
    const { app } = createPocketTestApp();

    // Act
    const res = await request(app)
      .get('/api/v1/pockets/account/acc-1')
      .set('Authorization', 'Bearer invalid-token');

    // Assert
    expect(res.status).toBe(401);
  });

  it('400 con monto inválido o negativo', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        name: 'Invalido',
        amount: -10_000,
      });

    // Assert
    expect(res.status).toBe(400);
  });

  it('no permite transferir entre bolsillos si el origen pertenece a otro usuario (403)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();
    const p1 = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId, name: 'Bolsillo User 1', amount: 50_000 });

    const p2 = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({ accountId: deps.otherAccountId, name: 'Bolsillo User 2', amount: 50_000 });

    // Act: otherUser intenta transferir desde el bolsillo del user 1
    const res = await request(app)
      .post('/api/v1/pockets/transfer')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({
        fromPocketId: p1.body.data.id,
        toPocketId: p2.body.data.id,
        amount: 10_000,
      });

    // Assert
    expect(res.status).toBe(400);
  });
});
