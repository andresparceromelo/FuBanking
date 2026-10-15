import request from 'supertest';
import { createAccountTransferTestApp } from '../helpers/createAccountTransferTestApp';

describe('Transfers HTTP (contrato)', () => {
  it('POST / realiza una transferencia exitosa entre dos cuentas (201)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const acc1 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });
    const acc2 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({ type: 'AHORROS' });

    await request(app)
      .post(`/api/v1/accounts/${acc1.body.data.id}/deposit`)
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 100_000 });

    // Act
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        senderAccountId: acc1.body.data.id,
        receiverAccountNumber: acc2.body.data.accountNumber,
        amount: 40_000,
        description: 'Pago almuerzo',
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.referenceNumber).toBeDefined();
    expect(res.body.data.amount).toBe(40_000);
  });

  it('GET /account/:accountId obtiene el historial de transferencias (200)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const acc1 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });
    const acc2 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({ type: 'AHORROS' });

    await request(app)
      .post(`/api/v1/accounts/${acc1.body.data.id}/deposit`)
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 100_000 });

    await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        senderAccountId: acc1.body.data.id,
        receiverAccountNumber: acc2.body.data.accountNumber,
        amount: 25_000,
      });

    // Act
    const res = await request(app)
      .get(`/api/v1/transfers/account/${acc1.body.data.id}`)
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});
