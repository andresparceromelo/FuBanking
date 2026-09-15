/**
 * ============================================================================
 *  Pruebas unitarias — Entidad de dominio Pocket
 * ----------------------------------------------------------------------------
 *  La entidad no tiene dependencias externas, así que no requiere dobles:
 *  se prueba de forma totalmente aislada (unidad pura). Patrón AAA + FIRST.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { Pocket } from '../../../domain/entities/Pocket';

const baseProps = {
  id: 'p1',
  accountId: 'acc-1',
  name: 'Ahorros',
  amount: 100_000,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('Pocket (entidad de dominio)', () => {
  describe('Constructor', () => {
    it('construye un bolsillo válido y expone sus getters', () => {
      // Arrange + Act
      const pocket = new Pocket(baseProps);

      // Assert
      expect(pocket.id).toBe('p1');
      expect(pocket.accountId).toBe('acc-1');
      expect(pocket.name).toBe('Ahorros');
      expect(pocket.amount).toBe(100_000);
    });

    it('acepta un monto de cero', () => {
      // Arrange + Act
      const pocket = new Pocket({ ...baseProps, amount: 0 });

      // Assert
      expect(pocket.amount).toBe(0);
    });

    it('rechaza montos negativos', () => {
      // Act + Assert
      expect(() => new Pocket({ ...baseProps, amount: -1 })).toThrowError(
        /mayor o igual a cero/i,
      );
    });

    it('rechaza montos NaN', () => {
      expect(() => new Pocket({ ...baseProps, amount: Number.NaN })).toThrowError(
        /mayor o igual a cero/i,
      );
    });

    it('rechaza montos que no son número', () => {
      // Arrange — se fuerza un tipo inválido para probar la guarda de tipo.
      expect(() => new Pocket({ ...baseProps, amount: '100' as unknown as number })).toThrowError(
        /mayor o igual a cero/i,
      );
    });
  });

  describe('Factory create()', () => {
    it('recorta los espacios del nombre y fija las marcas de tiempo', () => {
      // Act
      const pocket = Pocket.create({
        id: 'p2',
        accountId: 'acc-1',
        name: '   Meta   ',
        amount: 5_000,
      });

      // Assert
      expect(pocket.name).toBe('Meta');
      expect(pocket.createdAt).toBeInstanceOf(Date);
      expect(pocket.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateName()', () => {
    it('cambia el nombre recortando espacios', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act
      pocket.updateName('  Nuevo  ');

      // Assert
      expect(pocket.name).toBe('Nuevo');
    });

    it('rechaza un nombre vacío o de solo espacios', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act + Assert
      expect(() => pocket.updateName('   ')).toThrowError(/no puede estar vacío/i);
    });
  });

  describe('updateAmount()', () => {
    it('actualiza el monto con un valor válido', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act
      pocket.updateAmount(250_000);

      // Assert
      expect(pocket.amount).toBe(250_000);
    });

    it('rechaza un monto negativo', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act + Assert
      expect(() => pocket.updateAmount(-5)).toThrowError(/mayor o igual a cero/i);
    });
  });

  describe('toPublic()', () => {
    it('serializa las fechas como cadenas ISO', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act
      const publicView = pocket.toPublic();

      // Assert
      expect(publicView).toEqual({
        id: 'p1',
        accountId: 'acc-1',
        name: 'Ahorros',
        amount: 100_000,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });
    });
  });
});
