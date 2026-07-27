import { User } from '../entities/User';

/**
 * Datos permitidos para actualizar un usuario en la base de datos.
 */
export interface UpdateUserData {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  birthDate?: Date;
  phone?: string | null;
  avatarUrl?: string | null;
}

/**
 * Interfaz del repositorio de usuarios — capa de Dominio.
 *
 * Define el contrato que cualquier implementación de persistencia debe cumplir.
 * El dominio y la capa de aplicación dependen ÚNICAMENTE de esta interfaz,
 * nunca de la implementación concreta (Supabase, Postgres directo, mock, etc.).
 *
 * Principio de Inversión de Dependencias (SOLID - D).
 */
export interface IUserRepository {
  /**
   * Busca un usuario por su ID único.
   * Retorna null si no existe.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por su correo electrónico.
   * Retorna null si no existe.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por su número de documento.
   * Retorna null si no existe.
   */
  findByDocument(document: string): Promise<User | null>;

  /**
   * Persiste un nuevo usuario en la base de datos.
   * Retorna el usuario creado con todos sus campos.
   */
  save(user: User): Promise<User>;

  /**
   * Actualiza los campos permitidos de un usuario existente.
   * Retorna el usuario actualizado.
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * Actualiza el hash de la contraseña de un usuario.
   * Retorna el usuario actualizado.
   */
  updatePassword(id: string, newPasswordHash: string): Promise<User>;

  /**
   * Activa o desactiva el 2FA para un usuario.
   * Retorna el usuario actualizado.
   */
  updateTwoFactor(id: string, enabled: boolean): Promise<User>;

  /**
   * Elimina lógicamente un usuario (soft delete vía is_active = false).
   */
  delete(id: string): Promise<void>;
}
