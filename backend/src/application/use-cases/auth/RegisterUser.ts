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
    // 1. Validar que las contraseñas coincidan
    if (dto.password !== dto.confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORDS_DONT_MATCH');
    }

    // 2. Crear y validar Value Objects
    const email = new Email(dto.email);
    const document = new Document(dto.document);

    // 3. Verificar unicidad del email
    const existingByEmail = await this.userRepository.findByEmail(email.toString());
    if (existingByEmail) {
      throw new AuthError('Ya existe una cuenta con este correo electrónico', 'EMAIL_ALREADY_EXISTS');
    }

    // 4. Verificar unicidad del documento
    const existingByDoc = await this.userRepository.findByDocument(document.toString());
    if (existingByDoc) {
      throw new AuthError('Ya existe una cuenta con este documento', 'DOCUMENT_ALREADY_EXISTS');
    }

    // 5. Hashear contraseña
    const passwordHash = await this.passwordService.hash(dto.password);

    // 6. Crear entidad User
    const user = User.create({
      id: randomUUID(),
      email,
      document,
      firstName: dto.firstName.trim(),
      middleName: dto.middleName?.trim() || null,
      lastName: dto.lastName.trim(),
      secondLastName: dto.secondLastName?.trim() || null,
      birthDate: new Date(dto.birthDate),
      phone: dto.phone ?? null,
      passwordHash,
    });

    // 7. Persistir
    const savedUser = await this.userRepository.save(user);

    // 8. Generar JWT
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
