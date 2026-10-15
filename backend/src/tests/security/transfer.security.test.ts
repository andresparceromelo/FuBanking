import request from 'supertest';
import { createAccountTransferTestApp } from '../helpers/createAccountTransferTestApp';

describe('Transfers HTTP (seguridad)', () => {
  it('no permite transferir desde una cuenta ajena (403)', async () => {
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

    // Act: otherUser intenta transferir desde acc1 (que pertenece a user1)
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${deps.otherToken}`)
      .send({
        senderAccountId: acc1.body.data.id,
        receiverAccountNumber: acc2.body.data.accountNumber,
        amount: 10_000,
      });

    // Assert
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('no permite ver historial de transferencias de una cuenta ajena (403)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const acc1 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });

    // Act: otherUser intenta consultar historial de acc1
    const res = await request(app)
      .get(`/api/v1/transfers/account/${acc1.body.data.id}`)
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('401 sin token en POST /transfers', async () => {
    // Arrange
    const { app } = createAccountTransferTestApp();

    // Act
    const res = await request(app).post('/api/v1/transfers').send({});

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('400 al transferir a la misma cuenta', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const acc1 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });

    // Act
    const res = await request(app)
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        senderAccountId: acc1.body.data.id,
        receiverAccountNumber: acc1.body.data.accountNumber,
        amount: 10_000,
      });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SAME_ACCOUNT_TRANSFER');
  });
});
