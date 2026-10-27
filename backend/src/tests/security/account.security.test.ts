import request from 'supertest';
import { createAccountTransferTestApp } from '../helpers/createAccountTransferTestApp';

describe('Accounts HTTP (seguridad)', () => {
  it('GET /me lista solo cuentas del usuario autenticado (aislamiento)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });

    await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({ type: 'CORRIENTE' });

    // Act
    const resUser1 = await request(app)
      .get('/api/v1/accounts/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    const resUser2 = await request(app)
      .get('/api/v1/accounts/me')
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(resUser1.status).toBe(200);
    expect(resUser1.body.data).toHaveLength(1);
    expect(resUser1.body.data[0].accountType).toBe('AHORROS');

    expect(resUser2.status).toBe(200);
    expect(resUser2.body.data).toHaveLength(1);
    expect(resUser2.body.data[0].accountType).toBe('CORRIENTE');
  });

  it('no permite ver detalles de cuenta de otro usuario (403)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const created = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });
    const accId = created.body.data.id;

    // Act: otherUser intenta consultar los detalles de la cuenta de user1
    const res = await request(app)
      .get(`/api/v1/accounts/${accId}`)
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('401 sin token en rutas de cuentas', async () => {
    // Arrange
    const { app } = createAccountTransferTestApp();

    // Act & Assert
    const resMe = await request(app).get('/api/v1/accounts/me');
    expect(resMe.status).toBe(401);
    expect(resMe.body.error.code).toBe('UNAUTHORIZED');

    const resCreate = await request(app).post('/api/v1/accounts').send({});
    expect(resCreate.status).toBe(401);
  });
});
