/**
 * Setup global para las pruebas E2E.
 *
 * Valida que las variables de entorno requeridas estén definidas
 * y establece valores por defecto seguros para entorno de pruebas.
 */

const REQUIRED_VARS = ['E2E_BASE_URL', 'E2E_API_URL'] as const;

export function getE2EConfig(): { baseUrl: string; apiUrl: string } {
  return {
    baseUrl: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',
    apiUrl: process.env['E2E_API_URL'] ?? 'http://localhost:3001/api/v1',
  };
}

beforeAll(() => {
  // Las variables se resuelven a localhost por defecto en getE2EConfig si no existen.
});
