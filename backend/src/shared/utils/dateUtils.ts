/**
 * Utilidades de manejo de fechas — capa compartida de Backend.
 *
 * Provee helpers para parsear y formatear fechas sin desfases
 * por conversión implícita a UTC.
 */

/**
 * Parsea una cadena "YYYY-MM-DD" como fecha local, sin conversión UTC.
 *
 * Usar `new Date("YYYY-MM-DD")` interpreta la cadena como medianoche UTC,
 * lo que en zonas con offset negativo (ej. UTC-5) resulta en el día anterior.
 * Esta función evita ese desfase construyendo la fecha con sus partes locales.
 *
 * @param dateStr - Cadena de fecha en formato "YYYY-MM-DD".
 * @returns Date construida con año, mes y día locales.
 */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}
