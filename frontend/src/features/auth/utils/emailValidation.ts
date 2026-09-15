/**
 * Validación robusta de correos electrónicos (capa de frontend).
 *
 * Rechaza direcciones de correo claramente inválidas:
 *  - Ausencia de exactamente un carácter '@'.
 *  - Parte local (antes del '@') vacía.
 *  - Dominio sin al menos un punto o con punto inicial/final.
 *  - Dominios con puntos consecutivos ('..').
 *  - TLD (extensión final) de menos de 2 caracteres.
 *
 * Acepta:
 *  - Correos con etiquetas (user+tag@domain.com).
 *  - Subdominios (user@sub.domain.co).
 *  - TLDs modernos largos (user@example.technology).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) {
    return false;
  }

  // Debe haber exactamente un '@'
  const atParts = email.split('@');
  if (atParts.length !== 2) {
    return false;
  }

  const [local, domain] = atParts as [string, string];

  // La parte local no puede estar vacía
  if (local.length === 0) {
    return false;
  }

  // El dominio debe tener al menos un punto
  if (!domain.includes('.')) {
    return false;
  }

  // El dominio no puede empezar ni terminar con punto, ni tener puntos consecutivos
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return false;
  }

  // El TLD (parte después del último punto) debe tener al menos 2 caracteres
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return false;
  }

  return true;
}
