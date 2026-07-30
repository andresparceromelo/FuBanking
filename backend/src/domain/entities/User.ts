import { Email } from '../value-objects/Email';
import { Document } from '../value-objects/Document';

/**
 * Props necesarias para reconstruir un User desde la base de datos.
 */
export interface UserProps {
  id: string;
  email: Email;
  document: Document;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  birthDate: Date;
  phone: string | null;
  avatarUrl: string | null;
  passwordHash: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props para crear un nuevo User (sin id ni timestamps).
 */
export interface CreateUserProps {
  id: string;
  email: Email;
  document: Document;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  birthDate: Date;
  phone?: string | null;
  avatarUrl?: string | null;
  passwordHash: string;
  twoFactorEnabled?: boolean;
}

/**
 * Representación pública de un usuario — sin datos sensibles.
 * Este es el único formato que se envía al frontend o a otros contextos.
 */
export interface PublicUser {
  id: string;
  email: string;
  document: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  birthDate: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: string;
}

/**
 * Entidad User — capa de Dominio.
 *
 * Contiene únicamente reglas de negocio puras.
 * No conoce Express, Supabase, JWT ni bcrypt.
 */
export class User {
  private readonly _id: string;
  private readonly _email: Email;
  private readonly _document: Document;
  private _firstName: string;
  private _middleName: string | null;
  private _lastName: string;
  private _secondLastName: string | null;
  private _birthDate: Date;
  private _phone: string | null;
  private _avatarUrl: string | null;
  private _passwordHash: string;
  private _isActive: boolean;
  private _twoFactorEnabled: boolean;
  private _role: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._document = props.document;
    this._firstName = props.firstName;
    this._middleName = props.middleName;
    this._lastName = props.lastName;
    this._secondLastName = props.secondLastName;
    this._birthDate = props.birthDate;
    this._phone = props.phone;
    this._avatarUrl = props.avatarUrl;
    this._passwordHash = props.passwordHash;
    this._isActive = props.isActive;
    this._twoFactorEnabled = props.twoFactorEnabled;
    this._role = props.role;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): string { return this._id; }
  get email(): Email { return this._email; }
  get document(): Document { return this._document; }
  get firstName(): string { return this._firstName; }
  get middleName(): string | null { return this._middleName; }
  get lastName(): string { return this._lastName; }
  get secondLastName(): string | null { return this._secondLastName; }
  get birthDate(): Date { return this._birthDate; }
  
  get fullName(): string {
    return [this._firstName, this._middleName, this._lastName, this._secondLastName]
      .filter(Boolean)
      .join(' ');
  }
  get phone(): string | null { return this._phone; }
  get avatarUrl(): string | null { return this._avatarUrl; }
  get isActive(): boolean { return this._isActive; }
  get twoFactorEnabled(): boolean { return this._twoFactorEnabled; }
  get role(): string { return this._role; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * El hash de contraseña nunca se expone directamente.
   * Solo se accede a través de este método explícito,
   * dejando claro en el código que es un dato sensible.
   */
  getPasswordHash(): string {
    return this._passwordHash;
  }

  // ── Métodos de dominio ───────────────────────────────────────────────────

  /**
   * Actualiza el hash de la contraseña.
   */
  updatePasswordHash(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza los campos permitidos del perfil.
   * El documento (ID) nunca se puede cambiar.
   */
  updateProfile(data: {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
    secondLastName?: string | null;
    birthDate?: Date;
    phone?: string | null;
    avatarUrl?: string | null;
  }): void {
    if (data.firstName !== undefined) this._firstName = data.firstName;
    if (data.middleName !== undefined) this._middleName = data.middleName;
    if (data.lastName !== undefined) this._lastName = data.lastName;
    if (data.secondLastName !== undefined) this._secondLastName = data.secondLastName;
    if (data.birthDate !== undefined) this._birthDate = data.birthDate;
    if (data.phone !== undefined) this._phone = data.phone;
    if (data.avatarUrl !== undefined) this._avatarUrl = data.avatarUrl;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  enableTwoFactor(): void {
    this._twoFactorEnabled = true;
    this._updatedAt = new Date();
  }

  disableTwoFactor(): void {
    this._twoFactorEnabled = false;
    this._updatedAt = new Date();
  }

  isAdmin(): boolean {
    return this._role === 'admin';
  }

  /**
   * Retorna la representación pública del usuario.
   * Omite completamente el hash de contraseña.
   */
  toPublic(): PublicUser {
    return {
      id: this._id,
      email: this._email.toString(),
      document: this._document.toString(),
      firstName: this._firstName,
      middleName: this._middleName,
      lastName: this._lastName,
      secondLastName: this._secondLastName,
      fullName: this.fullName,
      birthDate: this._birthDate.toISOString(),
      phone: this._phone,
      avatarUrl: this._avatarUrl,
      isActive: this._isActive,
      twoFactorEnabled: this._twoFactorEnabled,
      role: this._role,
      createdAt: this._createdAt.toISOString(),
    };
  }

  // ── Factory ──────────────────────────────────────────────────────────────

  /**
   * Crea una nueva instancia de User para un usuario recién registrado.
   */
  static create(props: CreateUserProps): User {
    return new User({
      id: props.id,
      email: props.email,
      document: props.document,
      firstName: props.firstName,
      middleName: props.middleName ?? null,
      lastName: props.lastName,
      secondLastName: props.secondLastName ?? null,
      birthDate: props.birthDate,
      phone: props.phone ?? null,
      avatarUrl: props.avatarUrl ?? null,
      passwordHash: props.passwordHash,
      isActive: true,
      twoFactorEnabled: props.twoFactorEnabled ?? false,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
