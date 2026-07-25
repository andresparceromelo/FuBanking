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
  password: string;
  is_active: boolean;
  two_factor_enabled: boolean;
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
export class SupabaseUserRepository implements IUserRepository {
  private readonly TABLE = 'users';

  constructor(private readonly client: SupabaseClient) {}

  // ── Mapeo BD → Dominio ────────────────────────────────────────────────

  private mapRowToUser(row: UserRow): User {
    const props: UserProps = {
      id: row.id,
      email: new Email(row.email),
      document: new Document(row.document),
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      secondLastName: row.second_last_name,
      birthDate: new Date(row.birth_date),
      phone: row.phone,
      avatarUrl: row.avatar_url,
      passwordHash: row.password,
      isActive: row.is_active,
      twoFactorEnabled: row.two_factor_enabled ?? false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    return new User(props);
  }

  // ── Consultas ─────────────────────────────────────────────────────────

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToUser(data as UserRow);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) return null;
    return this.mapRowToUser(data as UserRow);
  }

  async findByDocument(document: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('document', document.trim())
      .single();

    if (error || !data) return null;
    return this.mapRowToUser(data as UserRow);
  }

  // ── Mutaciones ────────────────────────────────────────────────────────

  async save(user: User): Promise<User> {
    const row = {
      id: user.id,
      first_name: user.firstName,
      middle_name: user.middleName,
      last_name: user.lastName,
      second_last_name: user.secondLastName,
      birth_date: user.birthDate.toISOString(),
      email: user.email.toString(),
      document: user.document.toString(),
      phone: user.phone,
      avatar_url: user.avatarUrl,
      password: user.getPasswordHash(),
      is_active: user.isActive,
    };

    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(row)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(
        `Error al guardar el usuario: ${error?.message ?? 'Desconocido'}`,
        500,
        'DB_ERROR',
      );
    }

    return this.mapRowToUser(data as UserRow);
  }

  async update(id: string, updateData: UpdateUserData): Promise<User> {
    // Construir solo los campos que se van a actualizar
    const changes: Partial<Record<string, unknown>> = {};
    if (updateData.firstName !== undefined) changes['first_name'] = updateData.firstName;
    if (updateData.middleName !== undefined) changes['middle_name'] = updateData.middleName;
    if (updateData.lastName !== undefined) changes['last_name'] = updateData.lastName;
    if (updateData.secondLastName !== undefined) changes['second_last_name'] = updateData.secondLastName;
    if (updateData.birthDate !== undefined) changes['birth_date'] = updateData.birthDate.toISOString();
    if (updateData.phone !== undefined) changes['phone'] = updateData.phone;
    if (updateData.avatarUrl !== undefined) changes['avatar_url'] = updateData.avatarUrl;

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

    return this.mapRowToUser(data as UserRow);
  }

  async delete(id: string): Promise<void> {
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
  }

  async updateTwoFactor(id: string, enabled: boolean): Promise<User> {
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

    return this.mapRowToUser(data as UserRow);
  }
}
