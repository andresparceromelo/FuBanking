import request from 'supertest';
import { createLoanTestApp } from '../helpers/createLoanTestApp';

/**
 * Regresión por contrato HTTP del módulo créditos.
 * Patrón AAA + FIRST (ver ejemplo del profesor: RegressionTesting).
 * App con repos en memoria (sin Supabase, sin red).
 *
 * Ejecutar: npm run test:regression (o npx vitest run src/tests/regression)
 */
describe('Loans HTTP (contrato)', () => {
  it('POST /simulate responde 200 con cuota calculada', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    // Act
    const res = await request(app)
      .post('/api/v1/loans/simulate')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 5_000_000, installments: 24, annualRate: 0.24 });
    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.monthlyPayment).toBeGreaterThan(0);
  });

  it('POST / crea solicitud PENDING (201)', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    // Act
    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000 });
    // Assert
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('POST / duplicado PENDING responde 400 LOAN_ALREADY_PENDING', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    const payload = { amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000 };
    await request(app).post('/api/v1/loans').set('Authorization', `Bearer ${deps.userToken}`).send(payload);
    // Act
    const res = await request(app).post('/api/v1/loans').set('Authorization', `Bearer ${deps.userToken}`).send(payload);
    // Assert
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LOAN_ALREADY_PENDING');
  });

  it('flujo admin: GET /admin + approve crea cuenta CREDITO', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    const created = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000 });
    const loanId = created.body.data.id as string;
    // Act
    const list = await request(app).get('/api/v1/loans/admin').set('Authorization', `Bearer ${deps.adminToken}`);
    const approved = await request(app)
      .patch(`/api/v1/loans/admin/${loanId}/approve`)
      .set('Authorization', `Bearer ${deps.adminToken}`);
    // Assert
    expect(list.status).toBe(200);
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('APPROVED');
  });

  it('PATCH /admin/:id/reject rechaza un PENDING', async () => {
    // Arrange
    const { app, deps } = createLoanTestApp();
    const created = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({ amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000 });
    // Act
    const res = await request(app)
      .patch(`/api/v1/loans/admin/${created.body.data.id}/reject`)
      .set('Authorization', `Bearer ${deps.adminToken}`);
    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REJECTED');
  });
});
