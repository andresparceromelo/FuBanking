/**
 * Value Object: Document
 *
 * Representa el número de documento de identidad del usuario
 * (cédula, pasaporte, etc.).
 *
 * Inmutable y autovalidado. No se puede construir un Document vacío o inválido.
 */
export class Document {
  private readonly value: string;

  constructor(document: string) {
    const normalized = document.trim();

    if (!normalized) {
      throw new Error('El documento de identidad es requerido');
    }

    if (normalized.length < 5 || normalized.length > 20) {
      throw new Error('El documento debe tener entre 5 y 20 caracteres');
    }

    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Document): boolean {
    return this.value === other.value;
  }
}
