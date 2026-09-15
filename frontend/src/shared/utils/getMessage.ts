/**
 * Extrae un mensaje legible de un error desconocido, con fallback.
 * Centraliza el patron repetido en los hooks de loans/admin.
 */
export function getMessage(error: unknown, fallback: string): string {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}
