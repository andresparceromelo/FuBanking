import request from 'supertest';
import { Application } from 'express';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { VerificationCode } from '../../domain/entities/VerificationCode';
import { createTestApp, TestDeps } from '../helpers/createTestApp';
function buildUser(twoFactorEnabled = false): User {
  return new User({
    id: 'user-456',
    email: new Email('ana@example.com'),
    document: new Document('9876543210'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'García',
    secondLastName: null,
    birthDate: new Date('1995-06-15'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_Segura123!',
    isActive: true,
    twoFactorEnabled,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
function buildVerificationCode(overrides: Partial<{
  used: boolean;
  expiresAt: Date;
  attempts: number;
}> = {}): VerificationCode {
  const future = new Date(Date.now() + 5 * 60 * 1000);
  return new VerificationCode({
    id: 'vc-integration-001',
    userId: 'user-456',
    codeHash: 'hashed_123456',
    expiresAt: overrides.expiresAt ?? future,
    attempts: overrides.attempts ?? 0,
    used: overrides.used ?? false,
    createdAt: new Date(),
  });
}
describe('Integración 2FA — Pruebas de caja blanca (tabla de caminos Frontend↔Backend)', () => {
  let app: Application;
  let deps: TestDeps;
  beforeEach(() => {
    ({ app, deps } = createTestApp());
  });
  test('C1 - usuario no existe: POST /login → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noexiste@example.com', password: 'Segura123!' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
  test('C2 - password incorrecta: POST /login → 401 INVALID_CREDENTIALS', async () => {
    deps.userRepository.seed(buildUser(false));
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@example.com', password: 'Incorrecta999!' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
  test('C3 - login exitoso sin 2FA: POST /login → 200 { token }', async () => {
    deps.userRepository.seed(buildUser(false));
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@example.com', password: 'Segura123!' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      requiresTwoFactor: false,
    });
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    const payload = deps.tokenService.verify(res.body.data.token);
    expect(payload.userId).toBe('user-456');
    expect(payload.email).toBe('ana@example.com');
  });
  test('C4 - token temporal inválido: POST /2fa/verify → 401 TOKEN_INVALID', async () => {
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: 'invalid.token.not.fake', code: '999999' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'TOKEN_INVALID' });
  });
  test('C5 - código no encontrado: POST /2fa/verify → 401 INVALID_OTP', async () => {
    const validToken = deps.tokenService.generate({ userId: 'user-456', email: 'ana@example.com' });
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: validToken, code: '000000' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'INVALID_OTP' });
  });
  test('C6 - código ya usado: POST /2fa/verify → 401 OTP_ALREADY_USED', async () => {
    const validToken = deps.tokenService.generate({ userId: 'user-456', email: 'ana@example.com' });
    deps.verificationCodeRepository.seed(buildVerificationCode({ used: true }));
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: validToken, code: '111111' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'OTP_ALREADY_USED' });
  });
  test('C7 - código expirado: POST /2fa/verify → 401 OTP_EXPIRED', async () => {
    const validToken = deps.tokenService.generate({ userId: 'user-456', email: 'ana@example.com' });
    const past = new Date(Date.now() - 1000);
    deps.verificationCodeRepository.seed(buildVerificationCode({ used: false, expiresAt: past }));
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: validToken, code: '222222' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'OTP_EXPIRED' });
  });
  test('C8 - intentos máximos alcanzados: POST /2fa/verify → 401 MAX_ATTEMPTS_REACHED', async () => {
    const validToken = deps.tokenService.generate({ userId: 'user-456', email: 'ana@example.com' });
    deps.verificationCodeRepository.seed(buildVerificationCode({ used: false, attempts: 5 }));
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: validToken, code: '333333' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'MAX_ATTEMPTS_REACHED' });
  });
  test('C9 - código incorrecto (intentos < max): POST /2fa/verify → 401 INVALID_OTP, incrementa intentos', async () => {
    const validToken = deps.tokenService.generate({ userId: 'user-456', email: 'ana@example.com' });
    deps.verificationCodeRepository.seed(buildVerificationCode({ used: false, attempts: 1 }));
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: validToken, code: '444444' });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'INVALID_OTP' });
    const updatedCode = await deps.verificationCodeRepository.findLatestByUserId('user-456');
    expect(updatedCode!.attempts).toBe(2);
  });
  test('C10 - flujo completo con 2FA exitoso: POST /2fa/verify → 200 { token, user }', async () => {
    const validToken = deps.tokenService.generate({ userId: 'user-456', email: 'ana@example.com' });
    deps.verificationCodeRepository.seed(buildVerificationCode({ used: false, attempts: 0 }));
    deps.userRepository.seed(buildUser(true));
    const res = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken: validToken, code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe('user-456');
    const payload = deps.tokenService.verify(res.body.data.token);
    expect(payload.userId).toBe('user-456');
    expect(payload.email).toBe('ana@example.com');
    const updatedCode = await deps.verificationCodeRepository.findLatestByUserId('user-456');
    expect(updatedCode!.isUsed()).toBe(true);
  });
  test('E2E - login con 2FA + verify: flujo completo sin precargar tokens manualmente', async () => {
    deps.userRepository.seed(buildUser(true));
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@example.com', password: 'Segura123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.requiresTwoFactor).toBe(true);
    const temporaryToken = loginRes.body.data.temporaryToken;
    expect(temporaryToken).toBeDefined();
    expect(deps.emailService.sentTwoFactorCodes).toHaveLength(1);
    const sentCode = deps.emailService.sentTwoFactorCodes[0]!.code;
    expect(sentCode).toMatch(/^\d{6}$/);
    const verifyRes = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ temporaryToken, code: sentCode });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.token).toBeDefined();
    expect(verifyRes.body.data.user.id).toBe('user-456');
  });
});
