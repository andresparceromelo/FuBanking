import request from 'supertest';
import { createTestApp } from '../helpers/createTestApp';

describe('Auth HTTP (seguridad)', () => {
  it('401 con credenciales incorrectas en login', async () => {
    // Arrange
    const { app } = createTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user.sec@test.com',
        password: 'Password123!',
        document: '9988776655',
        firstName: 'Sec',
        lastName: 'User',
        birthDate: '1990-01-01',
      });

    // Act
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user.sec@test.com',
        password: 'WrongPassword!',
      });

    // Assert
    expect(res.status).toBe(401);
  });

  it('400 con datos faltantes o inválidos en registro', async () => {
    // Arrange
    const { app } = createTestApp();

    // Act
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'email-invalido',
        password: '123',
      });

    // Assert
    expect(res.status).toBe(400);
  });

  it('400 al registrar email duplicado', async () => {
    // Arrange
    const { app } = createTestApp();
    const payload = {
      email: 'dup@test.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      document: '5544332211',
      firstName: 'Dup',
      lastName: 'User',
      birthDate: '1990-01-01',
      monthlyIncome: 2_000_000,
    };
    await request(app).post('/api/v1/auth/register').send(payload);

    // Act
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    // Assert
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });
});
