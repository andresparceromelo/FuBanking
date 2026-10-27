import { z } from 'zod';

/** Texto decimal: "1500", "1500.50" o "-5" (el signo lo valida cada regla). */
const DECIMAL_TEXT = /^-?\d+(\.\d+)?$/;

/**
 * Convierte un monto recibido por HTTP sin "type juggling": solo acepta un
 * número JSON o un texto decimal. Booleanos, null, listas, objetos, texto
 * vacío, hexadecimal ("0x10") o notación científica ("1e3") devuelven NaN, que
 * cada caso de uso rechaza como monto inválido.
 *
 * Antes se usaba Number(valor) / z.coerce.number(): Number(true) = 1,
 * Number(null) = 0 y Number([1500]) = 1500 pasaban como montos válidos.
 */
export function parseStrictAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && DECIMAL_TEXT.test(raw.trim())) return Number(raw.trim());
  return Number.NaN;
}

/** Esquema zod de monto estricto (no negativo) con el mensaje de cada módulo. */
export function strictAmount(negativeMessage: string) {
  return z.preprocess(
    (raw) => (typeof raw === 'string' ? parseStrictAmount(raw) : raw),
    z.number({ error: 'El monto debe ser un número' }).min(0, negativeMessage),
  );
}
