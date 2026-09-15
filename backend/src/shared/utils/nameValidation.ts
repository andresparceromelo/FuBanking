/**
 * Validación semántica de nombres y apellidos (capa de backend).
 *
 * Rechaza cadenas que representen nombres claramente inválidos:
 *  - Tres o más caracteres idénticos consecutivos (ej. "aaaaa", "xxxxx").
 *  - Cadenas que no contengan ninguna vocal (incluye vocales con tilde).
 *  - Cadenas compuestas únicamente de caracteres no alfabéticos.
 *
 * Acepta:
 *  - Nombres con acentos, diéresis, eñes.
 *  - Guiones y apóstrofes válidos en nombres (ej. "O'Brien", "Anne-Marie").
 *  - Nombres con doble consonante corta (ej. "Lee", "Ann").
 */

/** Vocales válidas, incluyendo variantes con tilde y diéresis. */
const VOWELS = /[aeiouáéíóúàèìòùäëïöüâêîôûAEIOUÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛ]/;

/** Detecta 3 o más ocurrencias del mismo carácter seguidas (case-insensitive). */
const THREE_OR_MORE_CONSECUTIVE = /(.)\1{2,}/i;

/**
 * Verifica que un nombre o apellido sea semánticamente válido.
 *
 * @param value - El valor a validar. Puede ser undefined o vacío (campos opcionales).
 * @returns `true` si es válido o está vacío; `false` si contiene patrones inválidos.
 */
export function isValidName(value: string | undefined): boolean {
  if (!value || value.trim().length === 0) {
    return true; // Los campos opcionales vacíos son válidos.
  }

  const trimmed = value.trim();

  // Rechazar: 3 o más caracteres idénticos consecutivos.
  if (THREE_OR_MORE_CONSECUTIVE.test(trimmed)) {
    return false;
  }

  // Rechazar: ninguna vocal en todo el nombre.
  if (!VOWELS.test(trimmed)) {
    return false;
  }

  return true;
}
