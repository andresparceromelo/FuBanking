import request from 'supertest';
import { createPocketTestApp } from '../helpers/createPocketTestApp';

describe('Pockets HTTP (contrato)', () => {
  it('POST / crea un bolsillo con monto inicial (201)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        name: 'Vacaciones',
        amount: 200_000,
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Vacaciones');
    expect(res.body.data.amount).toBe(200_000);
  });

  it('GET /account/:accountId lista los bolsillos de la cuenta (200)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();
    await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        name: 'Ahorro Carro',
        amount: 100_000,
      });

    // Act
    const res = await request(app)
      .get(`/api/v1/pockets/account/${deps.accountId}`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Ahorro Carro');
  });

  it('PATCH /:pocketId actualiza el nombre o monto del bolsillo (200)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();
    const created = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        name: 'Original',
        amount: 50_000,
      });
    const pocketId = created.body.data.id;

    // Act
    const res = await request(app)
      .patch(`/api/v1/pockets/${pocketId}`)
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        name: 'Renombrado',
        amount: 70_000,
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Renombrado');
    expect(res.body.data.amount).toBe(70_000);
  });

  it('DELETE /:pocketId elimina un bolsillo reintegrando saldo (200)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();
    const created = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        name: 'Para borrar',
        amount: 50_000,
      });
    const pocketId = created.body.data.id;

    // Act
    const res = await request(app)
      .delete(`/api/v1/pockets/${pocketId}`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /transfer transfiere saldo entre bolsillos (200)', async () => {
    // Arrange
    const { app, deps } = createPocketTestApp();
    const p1 = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId, name: 'Bolsillo A', amount: 100_000 });
    const p2 = await request(app)
      .post('/api/v1/pockets')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ accountId: deps.accountId, name: 'Bolsillo B', amount: 50_000 });

    // Act
    const res = await request(app)
      .post('/api/v1/pockets/transfer')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        fromPocketId: p1.body.data.id,
        toPocketId: p2.body.data.id,
        amount: 30_000,
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
