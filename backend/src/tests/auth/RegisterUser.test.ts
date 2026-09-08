import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { FakePasswordService } from '../fakes/FakePasswordService';
import { FakeTokenService } from '../fakes/FakeTokenService';

function buildUser(): User {
  return new User({
    id: 'existing-user-001',
    email: new Email('existing@test.com'),
    document: new Document('ABC12345'),
    firstName: 'Existing',
    middleName: null,
    lastName: 'User',
    secondLastName: null,
    birthDate: new Date('1990-01-01'),
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed_Password123',
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const BASE_DTO = {
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: '1990-01-01',
  email: 'juan@test.com',
  document: 'XYZ98765',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('RegisterUser — Pruebas de caja blanca (tabla de caminos Backend)', () => {
  let userRepository: InMemoryUserRepository;
  let passwordService: FakePasswordService;
  let tokenService: FakeTokenService;
  let registerUser: RegisterUser;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    passwordService = new FakePasswordService();
    tokenService = new FakeTokenService();
    registerUser = new RegisterUser(userRepository, passwordService, tokenService);
  });

  describe('N1→N2→N4→N5→N7→N8→N10→N11', () => {
    it('N1→N2→N4→N5→N7→N8→N10→N11', async () => {
      const result = await registerUser.execute(BASE_DTO);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('juan@test.com');
      expect(result.user.firstName).toBe('Juan');
      expect(userRepository.all()).toHaveLength(1);

      const payload = tokenService.verify(result.token);
      expect(payload.email).toBe('juan@test.com');
    });
  });

  describe('N1→N2→N3', () => {
    it('N1→N2→N3', async () => {
      const dto = { ...BASE_DTO, confirmPassword: 'OtraPassword456' };

      await expect(registerUser.execute(dto)).rejects.toMatchObject({
        code: 'PASSWORDS_DONT_MATCH',
        statusCode: 400,
      });

      expect(userRepository.all()).toHaveLength(0);
    });
  });

  describe('N1→N2→N4→N5→N6', () => {
    it('N1→N2→N4→N5→N6', async () => {
      userRepository.seed(buildUser());

      const dto = { ...BASE_DTO, email: 'existing@test.com' };

      await expect(registerUser.execute(dto)).rejects.toMatchObject({
        code: 'EMAIL_ALREADY_EXISTS',
      });

      expect(userRepository.all()).toHaveLength(1);
    });
  });

  describe('N1→N2→N4→N5→N7→N8→N9', () => {
    it('N1→N2→N4→N5→N7→N8→N9', async () => {
      userRepository.seed(buildUser());

      const dto = { ...BASE_DTO, document: 'ABC12345' };

      await expect(registerUser.execute(dto)).rejects.toMatchObject({
        code: 'DOCUMENT_ALREADY_EXISTS',
      });

      expect(userRepository.all()).toHaveLength(1);
    });
  });
});
