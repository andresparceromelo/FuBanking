import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../interfaces/IPasswordService';
import { ITokenService } from '../../interfaces/ITokenService';
import { RegisterUserDto, RegisterUserResponseDto } from '../../dtos/auth/auth.dtos';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/value-objects/Email';
import { Document } from '../../../domain/value-objects/Document';
import { AuthError } from '../../../shared/errors/AuthError';
import { AppError } from '../../../shared/errors/AppError';
import { randomUUID } from 'crypto';

/**
 * Caso de Uso: Registro de usuario.
 *
 * Orquesta el flujo completo de registro:
 * 1. Valida unicidad de email y documento.
 * 2. Hashea la contraseña.
 * 3. Crea la entidad User.
 * 4. Persiste el usuario.
 * 5. Genera el JWT.
 */
export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: RegisterUserDto): Promise<RegisterUserResponseDto> {
    if (dto.password !== dto.confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
    }

    const email = new Email(dto.email);
    const document = new Document(dto.document);

    const existingByEmail = await this.userRepository.findByEmail(email.toString());
    if (existingByEmail) {
      throw new AuthError('Ya existe una cuenta con este correo electrónico', 'EMAIL_ALREADY_EXISTS');
    }

    const existingByDoc = await this.userRepository.findByDocument(document.toString());
    if (existingByDoc) {
      throw new AuthError('Ya existe una cuenta con este documento', 'DOCUMENT_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = User.create({
      id: randomUUID(),
      email,
      document,
      firstName: dto.firstName.trim(),
      middleName: dto.middleName?.trim() || null,
      lastName: dto.lastName.trim(),
      secondLastName: dto.secondLastName?.trim() || null,
      birthDate: new Date(`${dto.birthDate}T00:00:00`),
      phone: dto.phone ?? null,
      monthlyIncome: dto.monthlyIncome,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    const token = this.tokenService.generate({
      userId: savedUser.id,
      email: savedUser.email.toString(),
    });

    return {
      user: savedUser.toPublic(),
      token,
    };
  }
}
