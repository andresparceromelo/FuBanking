/**
 * Extrae un mensaje legible de un error desconocido, con fallback seguro.
 * Soporta Error nativo, respuestas HTTP de API Express (response.data.message / response.data.error.message),
 * y objetos con propiedad message.
 */
export function getMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const errObj = error as Record<string, unknown>;

  // Estructura Axios / HTTP Response
  const response = errObj.response as { data?: { message?: string; error?: { message?: string } } } | undefined;
  if (response?.data) {
    if (typeof response.data.message === 'string' && response.data.message.trim()) {
      return response.data.message;
    }
    if (typeof response.data.error?.message === 'string' && response.data.error.message.trim()) {
      return response.data.error.message;
    }
  }

  // Objeto con propiedad error anidada { error: { message: '...' } }
  const innerError = errObj.error as { message?: string } | undefined;
  if (innerError && typeof innerError.message === 'string' && innerError.message.trim()) {
    return innerError.message;
  }

  // Error estándar o { message: string }
  if ('message' in errObj && typeof errObj.message === 'string' && errObj.message.trim()) {
    return errObj.message;
  }

  return fallback;
}
