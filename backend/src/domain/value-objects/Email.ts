/**
 * Value Object: Email
 *
 * Encapsula la validación del correo electrónico en el dominio.
 * Al ser inmutable, garantiza que cualquier instancia de Email siempre
 * contiene un valor válido y normalizado.
 *
 * Pertenece al dominio: no conoce Express, Supabase ni ninguna librería externa.
 */
export class Email {
  private readonly value: string;

  // Cuantificadores acotados para evitar backtracking super-lineal (ReDoS / S5852).
  // Los límites cubren de sobra un correo válido (RFC 5321: 64 local, 255 dominio).
  private static readonly EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,255}$/;

  constructor(email: string) {
    const normalized = email.toLowerCase().trim();

    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new Error(`"${email}" no es un correo electrónico válido`);
    }

    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
