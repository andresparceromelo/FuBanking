import request from 'supertest';
import { createTestApp } from '../helpers/createTestApp';

describe('RegisterUser Integration', () => {
  it('should register a new user successfully', async () => {
    const { app } = createTestApp();
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan.perez@test.com',
        document: 'DOC123456',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        birthDate: '1990-01-01'
      });
    expect(response.status).toBe(201);
  });
});
