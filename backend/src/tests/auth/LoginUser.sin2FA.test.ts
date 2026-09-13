/**
 *
 * Ejecutar: npx jest src/__tests__/auth/LoginUser.sin2FA.test.ts
 */

import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { InMemoryVerificationCodeRepository } from '../fakes/InMemoryVerificationCodeRepository';
import { FakePasswordService } from '../fakes/FakePasswordService';
import { FakeTokenService } from '../fakes/FakeTokenService';
import { FakeEmailService } from '../fakes/FakeEmailService';



function buildUser(overrides: { isActive?: boolean; twoFactorEnabled?: boolean } = {}): User {
  return new User({
    id: 'user-001',
    email: new Email('ana@mail.com'),
    document: new Document('1234567890'),
    firstName: 'Ana',
    middleName: null,
    lastName: 'Gómez',
    secondLastName: null,
    birthDate: new Date('1995-03-10'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_abc123',
    isActive: overrides.isActive ?? true,
    twoFactorEnabled: overrides.twoFactorEnabled ?? false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}



describe('LoginUser (sin 2FA) — Pruebas de caja blanca (tabla de caminos Backend)', () => {
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


  describe('Camino 1,2,3,9,F — email no registrado', () => {
    it('lanza AuthError INVALID_CREDENTIALS cuando el email no existe en el repositorio', async () => {

      const dto = { email: 'noexiste@mail.com', password: 'abc123' };

      await expect(loginUser.execute(dto)).rejects.toMatchObject({
        message: 'Correo o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS',
      });


      expect(emailService.sentTwoFactorCodes).toHaveLength(0);
    });
  });


  describe('Camino 1,2,4,5,9,F — user existe pero cuenta inactiva', () => {
    it('C2: Falla si el usuario existe pero la cuenta está inactiva', async () => {

      const usuarioInactivo = new User({
        id: 'user-inactivo',
        email: new Email('ana@mail.com'),
        document: new Document('123456789'),
        firstName: 'Ana',
        middleName: null,
        lastName: 'Gómez',
        secondLastName: null,
        birthDate: new Date('1995-03-10'),
        phone: null,
        avatarUrl: null,
        passwordHash: 'hashed_abc123',
        isActive: false, // ¡Usuario inactivo!
        twoFactorEnabled: false,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userRepository.seed(usuarioInactivo);

      const dto = { email: 'ana@mail.com', password: 'abc123' };

      await expect(loginUser.execute(dto)).rejects.toMatchObject({
        message: 'Esta cuenta ha sido desactivada',
        code: 'ACCOUNT_INACTIVE',
      });
    });
  });

  describe('Camino 1,2,4,6,7,9,F — user activo, password no coincide con el hash', () => {
    it('lanza AuthError INVALID_CREDENTIALS cuando la contraseña no coincide', async () => {

      const activeUser = buildUser({ isActive: true });
      userRepository.seed(activeUser);

      const dto = { email: 'ana@mail.com', password: 'wrongpassword' };

      await expect(loginUser.execute(dto)).rejects.toMatchObject({
        message: 'Correo o contraseña incorrectos',
        code: 'INVALID_CREDENTIALS',
      });


      expect(emailService.sentTwoFactorCodes).toHaveLength(0);
    });
  });


  describe('Camino 1,2,4,6,8,9,F — user activo, password correcta (flujo feliz sin 2FA)', () => {
    it('retorna { requiresTwoFactor:false, user, token } con token verificable', async () => {

      const activeUser = buildUser({ isActive: true, twoFactorEnabled: false });
      userRepository.seed(activeUser);

      const dto = { email: 'ana@mail.com', password: 'abc123', rememberMe: false };


      const result = await loginUser.execute(dto);


      expect(result.requiresTwoFactor).toBe(false);
      expect((result as any).token).toBeDefined();
      expect((result as any).user).toBeDefined();


      const payload = tokenService.verify((result as any).token);
      expect(payload.userId).toBe('user-001');
      expect(payload.email).toBe('ana@mail.com');


      expect(emailService.sentTwoFactorCodes).toHaveLength(0);
      expect(verificationCodeRepository.all()).toHaveLength(0);
    });

    it('[caso extra] con rememberMe=true el token contiene el payload correcto', async () => {
      const activeUser = buildUser({ isActive: true, twoFactorEnabled: false });
      userRepository.seed(activeUser);

      const dto = { email: 'ana@mail.com', password: 'abc123', rememberMe: true };

      const result = await loginUser.execute(dto);

      expect(result.requiresTwoFactor).toBe(false);
      const payload = tokenService.verify((result as any).token);
      expect(payload.userId).toBe('user-001');
      expect(payload.email).toBe('ana@mail.com');
    });
  });
});
