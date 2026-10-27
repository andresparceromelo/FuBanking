import request from 'supertest';
import { createAccountTransferTestApp } from '../helpers/createAccountTransferTestApp';

describe('Accounts HTTP (contrato)', () => {
  it('POST / crea una cuenta de ahorros (201)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountNumber).toBeDefined();
    expect(res.body.data.balance).toBe(0);
  });

  it('GET /me lista las cuentas del usuario (200)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });

    // Act
    const res = await request(app)
      .get('/api/v1/accounts/me')
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /search busca una cuenta por número (200)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const created = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });
    const accNum = created.body.data.accountNumber;

    // Act
    const res = await request(app)
      .get(`/api/v1/accounts/search?accountNumber=${accNum}`)
      .set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountNumber).toContain(accNum.slice(-4));
  });

  it('POST /:id/deposit realiza un depósito y actualiza saldo (200)', async () => {
    // Arrange
    const { app, deps } = createAccountTransferTestApp();
    const created = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ type: 'AHORROS' });
    const accId = created.body.data.id;

    // Act
    const res = await request(app)
      .post(`/api/v1/accounts/${accId}/deposit`)
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 150_000 });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(150_000);
  });
});
