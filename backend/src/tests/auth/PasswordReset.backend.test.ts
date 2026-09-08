import { RequestPasswordReset } from '../../application/use-cases/auth/RequestPasswordReset';
import { ResetPassword } from '../../application/use-cases/auth/ResetPassword';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { FakePasswordService } from '../fakes/FakePasswordService';
import { FakeTokenService } from '../fakes/FakeTokenService';
import { FakeEmailService } from '../fakes/FakeEmailService';
function buildUser(): User {
  return new User({
    id: 'user-reset-01',
    email: new Email('ana@example.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'García',
    secondLastName: null,
    birthDate: new Date('1995-01-01'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_old_password',
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
describe('RequestPasswordReset — Pruebas de caja blanca (Backend)', () => {
  let userRepository: InMemoryUserRepository;
  let tokenService: FakeTokenService;
  let emailService: FakeEmailService;
  let requestReset: RequestPasswordReset;
  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    tokenService = new FakeTokenService();
    emailService = new FakeEmailService();
    process.env['CLIENT_URL'] = 'http://localhost:3000';
    requestReset = new RequestPasswordReset(userRepository, tokenService, emailService);
  });
  test('C1 — email no corresponde a ningún usuario: retorna sin enviar correo', async () => {
    await requestReset.execute({ email: 'noexiste@example.com' });
    expect(emailService.sentResetEmails).toHaveLength(0);
  });
  test('C2 — usuario existe: genera token y envía correo de recuperación', async () => {
    const user = buildUser();
    userRepository.seed(user);
    await requestReset.execute({ email: 'ana@example.com' });
    expect(emailService.sentResetEmails).toHaveLength(1);
    const sent = emailService.sentResetEmails[0]!;
    expect(sent.email).toBe('ana@example.com');
    expect(sent.resetLink).toContain('reset-password?token=');
    const tokenInLink = sent.resetLink.split('token=')[1];
    expect(tokenInLink).toBeDefined();
    const payload = tokenService.verify(tokenInLink!);
    expect(payload.userId).toBe('user-reset-01');
    expect(payload.email).toBe('ana@example.com');
    expect(payload.type).toBe('reset');
  });
});
describe('ResetPassword — Pruebas de caja blanca (Backend)', () => {
  let userRepository: InMemoryUserRepository;
  let passwordService: FakePasswordService;
  let tokenService: FakeTokenService;
  let resetPassword: ResetPassword;
  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    passwordService = new FakePasswordService();
    tokenService = new FakeTokenService();
    resetPassword = new ResetPassword(userRepository, passwordService, tokenService);
  });
  test('C2 — contraseñas no coinciden: lanza PASSWORDS_DONT_MATCH (400)', async () => {
    const dto = {
      token: 'cualquier-token',
      newPassword: 'NuevaPass1!',
      confirmPassword: 'Diferente2@',
    };
    await expect(resetPassword.execute(dto)).rejects.toMatchObject({
      code: 'PASSWORDS_DONT_MATCH',
      statusCode: 400,
    });
  });
  test('C3 — contraseñas coinciden pero token inválido: lanza TOKEN_INVALID', async () => {
    const dto = {
      token: FakeTokenService.makeInvalidToken(),
      newPassword: 'NuevaPass1!',
      confirmPassword: 'NuevaPass1!',
    };
    await expect(resetPassword.execute(dto)).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
    });
  });
  test('C4 — token válido pero type !== "reset": lanza TOKEN_INVALID por tipo incorrecto', async () => {
    const wrongTypeToken = tokenService.generate({
      userId: 'user-reset-01',
      email: 'ana@example.com',
      type: 'auth',
    });
    const dto = {
      token: wrongTypeToken,
      newPassword: 'NuevaPass1!',
      confirmPassword: 'NuevaPass1!',
    };
    await expect(resetPassword.execute(dto)).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
    });
  });
  test('C5 — todo válido: contraseña hasheada y actualizada en BD', async () => {
    const user = buildUser();
    userRepository.seed(user);
    const validToken = tokenService.generate({
      userId: 'user-reset-01',
      email: 'ana@example.com',
      type: 'reset',
    });
    const dto = {
      token: validToken,
      newPassword: 'NuevaPass1!',
      confirmPassword: 'NuevaPass1!',
    };
    await resetPassword.execute(dto);
    const storedHash = userRepository.getStoredPasswordHash('user-reset-01');
    expect(storedHash).toBe('hashed_NuevaPass1!');
  });
});
