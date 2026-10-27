import request from 'supertest';
import { createPaymentTestApp } from '../helpers/createPaymentTestApp';

describe('Payments HTTP (contrato)', () => {
  it('POST / crea y procesa un pago de servicio (201)', async () => {
    // Arrange
    const { app, deps } = createPaymentTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        serviceType: 'ENERGIA',
        providerReference: '12345678',
        amount: 50_000,
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(50_000);
    expect(res.body.data.serviceType).toBe('ENERGIA');
    expect(res.body.data.status).toBe('SUCCESS');
  });

  it('GET /me lista los pagos del usuario (200)', async () => {
    // Arrange
    const { app, deps } = createPaymentTestApp();
    await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        accountId: deps.accountId,
        serviceType: 'AGUA',
        providerReference: '987654',
        amount: 30_000,
      });

    // Act
    const res = await request(app)
      .get('/api/v1/payments/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].providerReference).toBe('987654');
  });
});
