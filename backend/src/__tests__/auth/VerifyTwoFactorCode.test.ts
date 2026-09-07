import { VerifyTwoFactorCode } from '../../application/use-cases/auth/VerifyTwoFactorCode';
import { VerificationCode } from '../../domain/entities/VerificationCode';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../fakes/InMemoryVerificationCodeRepository';
import { FakePasswordService } from '../fakes/FakePasswordService';
import { FakeTokenService } from '../fakes/FakeTokenService';
function buildUser(): User {
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
    passwordHash: 'hashed_password',
    isActive: true,
    twoFactorEnabled: true,
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
    id: 'vc-001',
    userId: 'user-123',
    codeHash: 'hashed_123456',
    expiresAt: overrides.expiresAt ?? future,
    attempts: overrides.attempts ?? 0,
    used: overrides.used ?? false,
    createdAt: new Date(),
  });
}
describe('VerifyTwoFactorCode — Pruebas de caja blanca (tabla de caminos Backend)', () => {
  let verificationCodeRepository: InMemoryVerificationCodeRepository;
  let userRepository: InMemoryUserRepository;
  let passwordService: FakePasswordService;
  let tokenService: FakeTokenService;
  let verifyTwoFactor: VerifyTwoFactorCode;
  let validTempToken: string;
  beforeEach(() => {
    verificationCodeRepository = new InMemoryVerificationCodeRepository();
    userRepository = new InMemoryUserRepository();
    passwordService = new FakePasswordService();
    tokenService = new FakeTokenService();
    verifyTwoFactor = new VerifyTwoFactorCode(
      verificationCodeRepository,
      userRepository,
      passwordService,
      tokenService,
    );
    validTempToken = tokenService.generate({ userId: 'user-123', email: 'juan@example.com' });
  });
  test('C5 - token temporal inválido: lanza error TOKEN_INVALID', async () => {
    const dto = { temporaryToken: FakeTokenService.makeInvalidToken(), code: '123456' };
    await expect(verifyTwoFactor.execute(dto)).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
    });
    expect(verificationCodeRepository.all()).toHaveLength(0);
  });
  test('C6 - código de verificación no encontrado: lanza error INVALID_OTP', async () => {
    const dto = { temporaryToken: validTempToken, code: '654321' };
    await expect(verifyTwoFactor.execute(dto)).rejects.toMatchObject({
      code: 'INVALID_OTP',
    });
  });
  test('C7 - código ya utilizado: lanza error OTP_ALREADY_USED', async () => {
    const usedCode = buildVerificationCode({ used: true });
    verificationCodeRepository.seed(usedCode);
    const dto = { temporaryToken: validTempToken, code: '111111' };
    await expect(verifyTwoFactor.execute(dto)).rejects.toMatchObject({
      code: 'OTP_ALREADY_USED',
    });
  });
  test('C8 - código expirado: lanza error OTP_EXPIRED', async () => {
    const past = new Date(Date.now() - 1);
    const expiredCode = buildVerificationCode({ used: false, expiresAt: past });
    verificationCodeRepository.seed(expiredCode);
    const dto = { temporaryToken: validTempToken, code: '222222' };
    await expect(verifyTwoFactor.execute(dto)).rejects.toMatchObject({
      code: 'OTP_EXPIRED',
    });
  });
  test('C9 - intentos ≥ máximo (5): lanza error MAX_ATTEMPTS_REACHED', async () => {
    const maxedCode = buildVerificationCode({ used: false, attempts: 5 });
    verificationCodeRepository.seed(maxedCode);
    const dto = { temporaryToken: validTempToken, code: '333333' };
    await expect(verifyTwoFactor.execute(dto)).rejects.toMatchObject({
      code: 'MAX_ATTEMPTS_REACHED',
    });
  });
  test('C10 - código incorrecto (intentos < max): incrementa intentos y lanza INVALID_OTP', async () => {
    const activeCode = buildVerificationCode({ used: false, attempts: 2 });
    verificationCodeRepository.seed(activeCode);
    const dto = { temporaryToken: validTempToken, code: '444444' };
    await expect(verifyTwoFactor.execute(dto)).rejects.toMatchObject({
      code: 'INVALID_OTP',
    });
    const updatedCode = await verificationCodeRepository.findLatestByUserId('user-123');
    expect(updatedCode!.attempts).toBe(3);
  });
  test('C2 - código correcto: marca como usado, genera JWT definitivo y retorna user+token', async () => {
    const validCode = buildVerificationCode({ used: false, attempts: 0 });
    verificationCodeRepository.seed(validCode);
    userRepository.seed(buildUser());
    const dto = { temporaryToken: validTempToken, code: '123456' };
    const result = await verifyTwoFactor.execute(dto);
    const updatedCode = await verificationCodeRepository.findLatestByUserId('user-123');
    expect(updatedCode!.isUsed()).toBe(true);
    expect(result.token).toBeDefined();
    const payload = tokenService.verify(result.token);
    expect(payload.userId).toBe('user-123');
    expect(payload.email).toBe('juan@example.com');
    expect(result.user).toBeDefined();
    expect(result.user.id).toBe('user-123');
  });
});
