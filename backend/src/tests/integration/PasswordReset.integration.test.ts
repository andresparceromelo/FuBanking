import request from 'supertest';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { createTestApp, TestDeps } from '../helpers/createTestApp';
import { Application } from 'express';
function buildUser(): User {
  return new User({
    id: 'user-int-01',
    email: new Email('ana@example.com'),
    document: new Document('9876543210'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'García',
    secondLastName: null,
    birthDate: new Date('1995-06-15'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_old_pass',
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
describe('Integración Password Reset — Pruebas de caja blanca (Frontend↔Backend)', () => {
  let app: Application;
  let deps: TestDeps;
  beforeEach(() => {
    process.env['CLIENT_URL'] = 'http:
    ({ app, deps } = createTestApp());
  });
  test('C1 — backend rechaza POST /forgot-password por DTO inválido (email malformado): responde 4xx', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'no-es-un-email' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
  test('C2 — POST /forgot-password exitoso (200), pero reset-password falla por token inválido: responde 401', async () => {
    deps.userRepository.seed(buildUser());
    const res1 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ana@example.com' });
    expect(res1.status).toBe(200);
    expect(res1.body.message).toMatch(/si el correo existe/i);
    expect(deps.emailService.sentResetEmails).toHaveLength(1);
    const res2 = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'invalid.token.not.fake',
        newPassword: 'NuevaPass1!',
        confirmPassword: 'NuevaPass1!',
      });
    expect(res2.status).toBe(401);
    expect(res2.body).toMatchObject({ code: 'TOKEN_INVALID' });
  });
  test('C3 — ambas peticiones aceptadas: contraseña restablecida, ambas responden 200', async () => {
    const user = buildUser();
    deps.userRepository.seed(user);
    const res1 = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ana@example.com' });
    expect(res1.status).toBe(200);
    expect(deps.emailService.sentResetEmails).toHaveLength(1);
    const resetLink = deps.emailService.sentResetEmails[0]!.resetLink;
    const tokenInLink = resetLink.split('token=')[1]!;
    const res2 = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: tokenInLink,
        newPassword: 'NuevaPass1!',
        confirmPassword: 'NuevaPass1!',
      });
    expect(res2.status).toBe(200);
    expect(res2.body.message).toMatch(/contraseña actualizada/i);
    const storedHash = deps.userRepository.getStoredPasswordHash('user-int-01');
    expect(storedHash).toBe('hashed_NuevaPass1!');
  });
});
