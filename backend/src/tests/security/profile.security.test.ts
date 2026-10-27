import request from 'supertest';
import { createProfileTestApp } from '../helpers/createProfileTestApp';

describe('Profile HTTP (seguridad)', () => {
  it('GET / aísla el perfil entre usuarios', async () => {
    // Arrange
    const { app, deps } = createProfileTestApp();

    // Act
    const res1 = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${deps.userToken}`);
    const res2 = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${deps.otherToken}`);

    // Assert
    expect(res1.status).toBe(200);
    expect(res1.body.data.id).toBe(deps.userId);
    expect(res2.status).toBe(200);
    expect(res2.body.data.id).toBe(deps.otherUserId);
  });

  it('401 sin token en GET / y PATCH /', async () => {
    // Arrange
    const { app } = createProfileTestApp();

    // Act & Assert
    const resGet = await request(app).get('/api/v1/profile');
    expect(resGet.status).toBe(401);
    expect(resGet.body.error.code).toBe('UNAUTHORIZED');

    const resPatch = await request(app).patch('/api/v1/profile').send({ firstName: 'Test' });
    expect(resPatch.status).toBe(401);
  });

  it('401 con token inválido', async () => {
    // Arrange
    const { app } = createProfileTestApp();

    // Act
    const res = await request(app).get('/api/v1/profile').set('Authorization', 'Bearer invalid-token');

    // Assert
    expect(res.status).toBe(401);
  });
});
