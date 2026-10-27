import request from 'supertest';
import { createPaymentTestApp } from '../helpers/createPaymentTestApp';

describe('Payments HTTP (seguridad)', () => {
  it('GET /me aísla los pagos por usuario', async () => {
    // Arrange
    const { app, deps } = createPaymentTestApp();
    await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        serviceType: 'ENERGIA',
        providerReference: '1111',
        amount: 20_000,
      });

    // Act
    const resUser1 = await request(app)
      .get('/api/v1/payments/me')
      .set('Authorization', `Bearer ${deps.userToken}`);
    const resUser2 = await request(app)
      .get('/api/v1/payments/me')
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(resUser1.status).toBe(200);
    expect(resUser1.body.data).toHaveLength(1);
    expect(resUser2.status).toBe(200);
    expect(resUser2.body.data).toHaveLength(0);
  });

  it('401 sin token en POST / y GET /me', async () => {
    // Arrange
    const { app } = createPaymentTestApp();

    // Act & Assert
    const postRes = await request(app).post('/api/v1/payments').send({});
    expect(postRes.status).toBe(401);
    expect(postRes.body.error.code).toBe('UNAUTHORIZED');

    const getRes = await request(app).get('/api/v1/payments/me');
    expect(getRes.status).toBe(401);
    expect(getRes.body.error.code).toBe('UNAUTHORIZED');
  });

  it('400 con monto inválido o negativo', async () => {
    // Arrange
    const { app, deps } = createPaymentTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        serviceType: 'ENERGIA',
        providerReference: '1111',
        amount: -500,
      });

    // Assert
    expect(res.status).toBe(400);
  });
});
