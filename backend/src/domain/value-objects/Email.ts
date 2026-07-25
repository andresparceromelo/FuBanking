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

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
