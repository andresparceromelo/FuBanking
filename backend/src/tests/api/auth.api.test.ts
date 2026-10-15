import request from 'supertest';
import { createTestApp } from '../helpers/createTestApp';

describe('Auth HTTP (contrato)', () => {
  it('POST /register registra un nuevo usuario exitosamente (201)', async () => {
    // Arrange
    const { app } = createTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'nuevo.usuario@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        document: '1098765432',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: '1995-05-15',
        monthlyIncome: 2_500_000,
      });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('nuevo.usuario@test.com');
  });

  it('POST /login autentica credenciales válidas (200)', async () => {
    // Arrange
    const { app, deps } = createTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'login.test@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        document: '1122334455',
        firstName: 'Ana',
        lastName: 'Gomez',
        birthDate: '1992-03-10',
        monthlyIncome: 2_000_000,
      });

    // Act
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login.test@test.com',
        password: 'Password123!',
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
