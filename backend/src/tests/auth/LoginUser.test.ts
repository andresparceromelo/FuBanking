import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../fakes/InMemoryVerificationCodeRepository';
import { FakePasswordService } from '../fakes/FakePasswordService';
import { FakeTokenService } from '../fakes/FakeTokenService';
import { FakeEmailService } from '../fakes/FakeEmailService';
function buildUser(overrides: { twoFactorEnabled?: boolean; isActive?: boolean } = {}): User {
  return new User({
    id: 'user-123',
    email: new Email('juan@example.com'),
    document: new Document('1234567890'),
    firstName: 'Juan',
    middleName: null,
    lastName: 'Pérez',
    secondLastName: null,
    birthDate: new Date('1990-01-01'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_Segura123!',
    isActive: overrides.isActive ?? true,
    twoFactorEnabled: overrides.twoFactorEnabled ?? false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
describe('LoginUser — Pruebas de caja blanca (tabla de caminos Backend)', () => {
  let userRepository: InMemoryUserRepository;
  let verificationCodeRepository: InMemoryVerificationCodeRepository;
  let passwordService: FakePasswordService;
  let tokenService: FakeTokenService;
  let emailService: FakeEmailService;
  let loginUser: LoginUser;
  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    verificationCodeRepository = new InMemoryVerificationCodeRepository();
    passwordService = new FakePasswordService();
    tokenService = new FakeTokenService();
    emailService = new FakeEmailService();
    loginUser = new LoginUser(
      userRepository,
      passwordService,
      tokenService,
      verificationCodeRepository,
      emailService,
    );
  });
  test('C1 - login exitoso sin 2FA: retorna token JWT directamente', async () => {
    const user = buildUser({ twoFactorEnabled: false });
    userRepository.seed(user);
    const dto = { email: 'juan@example.com', password: 'Segura123!' };
    const result = await loginUser.execute(dto);
    expect(result.requiresTwoFactor).toBe(false);
    expect((result as any).token).toBeDefined();
    expect((result as any).user).toBeDefined();
    expect((result as any).user.id).toBe('user-123');
    const payload = tokenService.verify((result as any).token);
    expect(payload.userId).toBe('user-123');
    expect(payload.email).toBe('juan@example.com');
    expect(emailService.sentTwoFactorCodes).toHaveLength(0);
  });
  test('C2 - login con 2FA habilitado: genera OTP, envía correo y retorna temporaryToken', async () => {
    const user = buildUser({ twoFactorEnabled: true });
    userRepository.seed(user);
    const dto = { email: 'juan@example.com', password: 'Segura123!' };
    const result = await loginUser.execute(dto);
    expect(result.requiresTwoFactor).toBe(true);
    expect((result as any).temporaryToken).toBeDefined();
    expect((result as any).maskedEmail).toMatch(/\*{3}@example\.com/);
    expect(emailService.sentTwoFactorCodes).toHaveLength(1);
    expect(emailService.sentTwoFactorCodes[0]!.email).toBe('juan@example.com');
    expect(emailService.sentTwoFactorCodes[0]!.code).toMatch(/^\d{6}$/);
    const savedCode = await verificationCodeRepository.findLatestByUserId('user-123');
    expect(savedCode).not.toBeNull();
    expect(savedCode!.userId).toBe('user-123');
  });
  test('C3 - usuario no encontrado: lanza error INVALID_CREDENTIALS', async () => {
    const dto = { email: 'noexiste@example.com', password: 'cualquier' };
    await expect(loginUser.execute(dto)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });
  test('C4 - contraseña incorrecta: lanza error INVALID_CREDENTIALS', async () => {
    const user = buildUser();
    userRepository.seed(user);
    const dto = { email: 'juan@example.com', password: 'ContraseñaIncorrecta!' };
    await expect(loginUser.execute(dto)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(emailService.sentTwoFactorCodes).toHaveLength(0);
  });
});
