import request from 'supertest';
import { createProfileTestApp } from '../helpers/createProfileTestApp';

describe('Profile HTTP (contrato)', () => {
  it('GET / obtiene los datos del perfil del usuario (200)', async () => {
    // Arrange
    const { app, deps } = createProfileTestApp();

    // Act
    const res = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${deps.userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(deps.userId);
  });

  it('PATCH / actualiza los datos personales del usuario (200)', async () => {
    // Arrange
    const { app, deps } = createProfileTestApp();

    // Act
    const res = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${deps.userToken}`)
      .send({
        firstName: 'Carlos',
        phone: '3001234567',
      });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe('Carlos');
  });
});
