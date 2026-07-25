/**
 * Entidad VerificationCode — capa de Dominio.
 *
 * Representa un código OTP de 6 dígitos enviado al correo del usuario
 * para el segundo factor de autenticación.
 *
 * No conoce Express, Supabase, Resend ni bcrypt.
 */
export interface VerificationCodeProps {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  used: boolean;
  createdAt: Date;
}

export class VerificationCode {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _codeHash: string;
  private readonly _expiresAt: Date;
  private _attempts: number;
  private _used: boolean;
  private readonly _createdAt: Date;

  constructor(props: VerificationCodeProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._codeHash = props.codeHash;
    this._expiresAt = props.expiresAt;
    this._attempts = props.attempts;
    this._used = props.used;
    this._createdAt = props.createdAt;
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get codeHash(): string { return this._codeHash; }
  get expiresAt(): Date { return this._expiresAt; }
  get attempts(): number { return this._attempts; }
  get used(): boolean { return this._used; }
  get createdAt(): Date { return this._createdAt; }

  // ── Reglas de dominio ────────────────────────────────────────────────────

  /** El código expira si la fecha actual superó expiresAt. */
  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /** El código ya fue utilizado. */
  isUsed(): boolean {
    return this._used;
  }

  /** Se superó el límite máximo de intentos (5). */
  hasExceededAttempts(): boolean {
    return this._attempts >= 5;
  }

  /** Incrementa el contador de intentos fallidos. */
  incrementAttempts(): void {
    this._attempts += 1;
  }

  /** Marca el código como utilizado (single-use). */
  markAsUsed(): void {
    this._used = true;
  }

  // ── Factory ──────────────────────────────────────────────────────────────

  /**
   * Crea un nuevo VerificationCode con expiración de 5 minutos.
   */
  static create(props: {
    id: string;
    userId: string;
    codeHash: string;
  }): VerificationCode {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
    return new VerificationCode({
      id: props.id,
      userId: props.userId,
      codeHash: props.codeHash,
      expiresAt,
      attempts: 0,
      used: false,
      createdAt: new Date(),
    });
  }
}
