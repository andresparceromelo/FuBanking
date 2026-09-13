import { IAccountRepository } from '../../../domain/repositories/IAccountRepository';
import { Account, AccountType, AccountDetails } from '../../../domain/entities/Account';
import { CreateAccountDto, CreateAccountResponseDto } from '../../dtos/account/account.dtos';
import { AppError } from '../../../shared/errors/AppError';
import { randomUUID } from 'crypto';

/**
 * Caso de Uso: Crear una cuenta bancaria.
 *
 * Orquesta el flujo completo de creación:
 * 1. Valida que el tipo de cuenta sea válido.
 * 2. Genera un número de cuenta único.
 * 3. Crea la entidad Account.
 * 4. Persiste la cuenta y sus detalles en Supabase.
 */
export class CreateAccount {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(dto: CreateAccountDto): Promise<CreateAccountResponseDto> {
    if (!Object.values(AccountType).includes(dto.type)) {
      throw new AppError(
        `Tipo de cuenta inválido. Debe ser: ${Object.values(AccountType).join(', ')}`,
        400,
        'INVALID_ACCOUNT_TYPE',
      );
    }

    const accountNumber = await this.generateUniqueAccountNumber();

    const details: AccountDetails | null = this.buildDetails(dto);

    const account = Account.create({
      id: randomUUID(),
      userId: dto.userId,
      accountNumber,
      accountType: dto.type,
      details,
    });

    const savedAccount = await this.accountRepository.save(account, details);

    return savedAccount.toPublic();
  }

  /**
   * Genera un número de cuenta único con formato 'BA' + 10 dígitos.
   * Verifica contra la BD que no exista duplicado.
   */
  private async generateUniqueAccountNumber(): Promise<string> {
    let accountNumber: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      const digits = Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000);
      accountNumber = `BA${digits}`;
      const existing = await this.accountRepository.findByAccountNumber(accountNumber);
      if (!existing) return accountNumber;
      attempts++;
    } while (attempts < maxAttempts);

    throw new AppError('No se pudo generar un número de cuenta único', 500, 'ACCOUNT_NUMBER_GENERATION_FAILED');
  }

  /**
   * Construye los detalles específicos según el tipo de cuenta.
   * Retorna null si no hay datos opcionales relevantes.
   */
  private buildDetails(dto: CreateAccountDto): AccountDetails | null {
    switch (dto.type) {
      case AccountType.AHORROS:
        return {
          interestRate: 0.03, // 3% E.A.
          managementFee: 0,   // Sin cuota de manejo
        };
      case AccountType.CORRIENTE:
        return {
          overdraftLimit: 1000000, // Cupo asignado por el banco
          allowsCheckbook: dto.requestCheckbook ?? false, // Según solicitud del cliente
        };
      case AccountType.NOMINA:
        return {
          managementFee: 0,
          companyName: dto.companyName ?? null, // Dato proporcionado por el cliente
        };
      default:
        return null;
    }
  }
}
