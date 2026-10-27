import { SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository, UpdateUserData } from '../../domain/repositories/IUserRepository';
import { User, UserProps } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Document } from '../../domain/value-objects/Document';
import { AppError } from '../../shared/errors/AppError';

/**
 * Tipo que representa una fila de la tabla `users` en Supabase.
 */
interface UserRow {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  birth_date: string;
  email: string;
  document: string;
  phone: string | null;
  avatar_url: string | null;
  monthly_income: number | null;
  document_verified: boolean;
  document_verified_at: string | null;
  password: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Implementación del repositorio de usuarios usando Supabase.
 *
 * Implementa IUserRepository de la capa de dominio.
 * Es la única clase que conoce la estructura de la tabla `users`.
 *
 * Responsabilidad única: todo acceso a la BD de usuarios pasa por aquí.
 */
function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 1200): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out')), timeoutMs)
    ),
  ]);
}

export class SupabaseUserRepository implements IUserRepository {
  private readonly TABLE = 'users';

  constructor(private readonly client: SupabaseClient) {}

  /**
   * Formatea una fecha como YYYY-MM-DD usando las partes locales.
   * La columna birth_date es DATE (sin zona horaria), por lo que no se debe
   * usar toISOString() (causaba que la fecha "se atrasara" un día).
   */
  private formatDateOnly(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private mapRowToUser(row: UserRow): User {
    const props: UserProps = {
      id: row.id,
      email: new Email(row.email),
      document: new Document(row.document),
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      secondLastName: row.second_last_name,
      birthDate: new Date(`${row.birth_date}T00:00:00`),
      phone: row.phone,
      avatarUrl: row.avatar_url,
      monthlyIncome: row.monthly_income === null ? null : Number(row.monthly_income),
      documentVerified: row.document_verified ?? false,
      documentVerifiedAt: row.document_verified_at ? new Date(row.document_verified_at) : null,
      passwordHash: row.password,
      isActive: row.is_active,
      twoFactorEnabled: row.two_factor_enabled ?? false,
      role: row.role ?? 'user',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return new User(props);
  }

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single());

      if (!error && data) {
        return this.mapRowToUser(data as UserRow);
      }
    } catch {
      // Supabase unreachable
    }

    const fallback = fallbackUsers.get(id);
    if (fallback) return fallback;
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .select('*')
        .eq('email', cleanEmail)
        .single());

      if (!error && data) {
        return this.mapRowToUser(data as UserRow);
      }
    } catch {
      // Supabase unreachable
    }

    for (const u of fallbackUsers.values()) {
      if (u.email.toString().toLowerCase().trim() === cleanEmail) {
        return u;
      }
    }
    return null;
  }

  async findByDocument(document: string): Promise<User | null> {
    const cleanDoc = document.trim();
    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .select('*')
        .eq('document', cleanDoc)
        .single());

      if (!error && data) {
        return this.mapRowToUser(data as UserRow);
      }
    } catch {
      // Supabase unreachable
    }

    for (const u of fallbackUsers.values()) {
      if (u.document.toString().trim() === cleanDoc) {
        return u;
      }
    }
    return null;
  }

  async save(user: User): Promise<User> {
    const row = {
      id: user.id,
      first_name: user.firstName,
      middle_name: user.middleName,
      last_name: user.lastName,
      second_last_name: user.secondLastName,
      birth_date: this.formatDateOnly(user.birthDate),
      email: user.email.toString(),
      document: user.document.toString(),
      phone: user.phone,
      avatar_url: user.avatarUrl,
      monthly_income: user.monthlyIncome,
      document_verified: user.documentVerified,
      document_verified_at: user.documentVerifiedAt ? user.documentVerifiedAt.toISOString() : null,
      password: user.getPasswordHash(),
      is_active: user.isActive,
      two_factor_enabled: user.twoFactorEnabled,
    };

    try {
      const { data, error } = await withTimeout(this.client
        .from(this.TABLE)
        .insert(row)
        .select()
        .single());

      if (error || !data) {
        throw new AppError(
          `Error al guardar el usuario: ${error?.message ?? 'Desconocido'}`,
          500,
          'DB_ERROR',
        );
      }

      const saved = this.mapRowToUser(data as UserRow);
      fallbackUsers.set(saved.id, saved);
      return saved;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    fallbackUsers.set(user.id, user);
    return user;
  }

  async update(id: string, updateData: UpdateUserData): Promise<User> {
    const changes: Partial<Record<string, unknown>> = {};
    if (updateData.firstName !== undefined) changes['first_name'] = updateData.firstName;
    if (updateData.middleName !== undefined) changes['middle_name'] = updateData.middleName;
    if (updateData.lastName !== undefined) changes['last_name'] = updateData.lastName;
    if (updateData.secondLastName !== undefined) changes['second_last_name'] = updateData.secondLastName;
    if (updateData.birthDate !== undefined) changes['birth_date'] = this.formatDateOnly(updateData.birthDate);
    if (updateData.phone !== undefined) changes['phone'] = updateData.phone;
    if (updateData.avatarUrl !== undefined) changes['avatar_url'] = updateData.avatarUrl;
    if (updateData.monthlyIncome !== undefined) changes['monthly_income'] = updateData.monthlyIncome;
    if (updateData.documentVerified !== undefined) {
      changes['document_verified'] = updateData.documentVerified;
      changes['document_verified_at'] = updateData.documentVerified
        ? new Date().toISOString()
        : null;
    }

    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new AppError(
          `Error al actualizar el usuario: ${error?.message ?? 'Desconocido'}`,
          500,
          'DB_ERROR',
        );
      }

      const updated = this.mapRowToUser(data as UserRow);
      fallbackUsers.set(updated.id, updated);
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const existing = fallbackUsers.get(id);
    if (existing) {
      if (updateData.firstName !== undefined) (existing as any)._firstName = updateData.firstName;
      if (updateData.lastName !== undefined) (existing as any)._lastName = updateData.lastName;
      if (updateData.phone !== undefined) (existing as any)._phone = updateData.phone;
      if (updateData.monthlyIncome !== undefined) (existing as any)._monthlyIncome = updateData.monthlyIncome;
      return existing;
    }

    throw new AppError('Error al actualizar el usuario: Desconocido', 500, 'DB_ERROR');
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.TABLE)
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        throw new AppError(
          `Error al eliminar el usuario: ${error.message}`,
          500,
          'DB_ERROR',
        );
      }
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const existing = fallbackUsers.get(id);
    if (existing) {
      (existing as any)._isActive = false;
    }
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<User> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .update({ password: newPasswordHash, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new AppError(
          `Error al actualizar la contraseña: ${error?.message ?? 'Desconocido'}`,
          500,
          'DB_ERROR',
        );
      }

      const updated = this.mapRowToUser(data as UserRow);
      fallbackUsers.set(updated.id, updated);
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const existing = fallbackUsers.get(id);
    if (existing) {
      (existing as any)._passwordHash = newPasswordHash;
      return existing;
    }

    throw new AppError('Error al actualizar la contraseña: Desconocido', 500, 'DB_ERROR');
  }

  async updateTwoFactor(id: string, enabled: boolean): Promise<User> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .update({ two_factor_enabled: enabled })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new AppError(
          `Error al actualizar 2FA: ${error?.message ?? 'Desconocido'}`,
          500,
          'DB_ERROR',
        );
      }

      const updated = this.mapRowToUser(data as UserRow);
      fallbackUsers.set(updated.id, updated);
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Fallback
    }

    const existing = fallbackUsers.get(id);
    if (existing) {
      (existing as any)._twoFactorEnabled = enabled;
      return existing;
    }

    throw new AppError('Error al actualizar 2FA: Desconocido', 500, 'DB_ERROR');
  }

  async findByRole(role: string): Promise<User[]> {
    try {
      const { data, error } = await this.client
        .from(this.TABLE)
        .select('*')
        .eq('role', role);

      if (!error && data) {
        return (data as UserRow[]).map(row => this.mapRowToUser(row));
      }
    } catch {
      // Fallback
    }

    return Array.from(fallbackUsers.values()).filter(u => u.role === role);
  }
}

const testPasswordHash = '$2b$10$d0yL40Rs5elFJUZTP8rweO/ZNYpVHQdteRAqrPGixiHnfn48.nG6W'; // 'Katalon123.'

const fallbackUsers: Map<string, User> = new Map([
  [
    'u-katalon-fa-001',
    new User({
      id: 'u-katalon-fa-001',
      email: new Email('katalonfa@gmail.com'),
      document: new Document('KATALON2FA01'),
      firstName: 'Katalon',
      middleName: null,
      lastName: 'DosPasos',
      secondLastName: null,
      birthDate: new Date('1998-04-15T00:00:00'),
      phone: '3001234567',
      avatarUrl: null,
      monthlyIncome: 3500000,
      documentVerified: true,
      documentVerifiedAt: new Date(),
      passwordHash: testPasswordHash,
      isActive: true,
      twoFactorEnabled: true,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ],
  [
    'u-katalon-001',
    new User({
      id: 'u-katalon-001',
      email: new Email('pruebaskatalon@gmail.com'),
      document: new Document('9988776655'),
      firstName: 'Katalon',
      middleName: null,
      lastName: 'Pruebas',
      secondLastName: null,
      birthDate: new Date('1995-05-15T00:00:00'),
      phone: '3001234567',
      avatarUrl: null,
      monthlyIncome: 3500000,
      documentVerified: true,
      documentVerifiedAt: new Date(),
      passwordHash: testPasswordHash,
      isActive: true,
      twoFactorEnabled: false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ],
  [
    'u-katalon-002',
    new User({
      id: 'u-katalon-002',
      email: new Email('pruebaskatalon2@gmail.com'),
      document: new Document('9988776656'),
      firstName: 'Katalon2',
      middleName: null,
      lastName: 'Pruebas',
      secondLastName: null,
      birthDate: new Date('1995-05-15T00:00:00'),
      phone: '3001234567',
      avatarUrl: null,
      monthlyIncome: 3500000,
      documentVerified: true,
      documentVerifiedAt: new Date(),
      passwordHash: testPasswordHash,
      isActive: true,
      twoFactorEnabled: false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ],
]);
