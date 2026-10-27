import { randomBytes, randomInt } from 'node:crypto';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  document: string;
  monthlyIncome: number;
  password: string;
  confirmPassword: string;
}

/**
 * Datos de registro únicos por corrida. Cada escenario crea su propio cliente,
 * así ningún escenario depende de datos que dejó otro. Los correos usan el
 * dominio reservado `.test` y el prefijo `e2e.` para poder limpiarlos luego.
 */
export function uniqueClient(firstName: string): RegistrationData {
  const stamp = `${Date.now().toString(36)}${randomInt(36 ** 4).toString(36)}`;
  const password = `E2e${randomBytes(6).toString('hex')}A1`;

  return {
    firstName,
    lastName: 'Prueba',
    birthDate: '1995-05-10',
    email: `e2e.${stamp}@fubanking.test`,
    document: `E2E${stamp}`.toUpperCase().slice(0, 20),
    monthlyIncome: 3_500_000,
    password,
    confirmPassword: password,
  };
}
