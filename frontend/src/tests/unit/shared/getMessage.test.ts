import { describe, it, expect } from 'vitest';
import { getMessage } from '@/shared/utils/getMessage';

describe('getMessage — Utilidad de normalización de errores', () => {
  const fallback = 'Error general de fallback';

  it('retorna fallback cuando el error es nulo, indefinido o primitivo', () => {
    expect(getMessage(null, fallback)).toBe(fallback);
    expect(getMessage(undefined, fallback)).toBe(fallback);
    expect(getMessage('string suelta', fallback)).toBe(fallback);
    expect(getMessage(1234, fallback)).toBe(fallback);
  });

  it('extrae mensaje de un Error estándar nativo', () => {
    const error = new Error('Fallo de conexión');
    expect(getMessage(error, fallback)).toBe('Fallo de conexión');
  });

  it('extrae mensaje de respuesta Axios con response.data.message', () => {
    const error = {
      response: {
        data: {
          message: 'Fondos insuficientes en la cuenta',
        },
      },
    };
    expect(getMessage(error, fallback)).toBe('Fondos insuficientes en la cuenta');
  });

  it('extrae mensaje de respuesta API con response.data.error.message', () => {
    const error = {
      response: {
        data: {
          error: {
            message: 'El código 2FA ingresado ha expirado',
          },
        },
      },
    };
    expect(getMessage(error, fallback)).toBe('El código 2FA ingresado ha expirado');
  });

  it('extrae mensaje de objeto con error anidado { error: { message: ... } }', () => {
    const error = {
      error: {
        message: 'Límite de intentos alcanzado',
      },
    };
    expect(getMessage(error, fallback)).toBe('Límite de intentos alcanzado');
  });

  it('retorna fallback si message está vacío o solo contiene espacios', () => {
    expect(getMessage({ message: '   ' }, fallback)).toBe(fallback);
    expect(getMessage({ message: '' }, fallback)).toBe(fallback);
  });
});
