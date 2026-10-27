/**
 * ============================================================================
 *  Pruebas unitarias — Entidad de dominio Pocket
 * ----------------------------------------------------------------------------
 *  La entidad no tiene dependencias externas, así que no requiere dobles:
 *  se prueba de forma totalmente aislada (unidad pura). Patrón AAA + FIRST
 *  + aserciones fluidas Chai BDD (ver detalle en CreatePocket.test.ts).
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { Pocket } from '../../../domain/entities/Pocket';
import { AppError } from '../../../shared/errors/AppError';

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
      expect(pocket).to.include({ id: 'p1', accountId: 'acc-1', name: 'Ahorros', amount: 100_000 });
    });

    it('acepta un monto de cero', () => {
      // Arrange + Act
      const pocket = new Pocket({ ...baseProps, amount: 0 });

      // Assert
      expect(pocket).to.have.property('amount', 0);
    });

    it('rechaza montos negativos', () => {
      // Act + Assert
      expect(() => new Pocket({ ...baseProps, amount: -1 }))
        .to.throw(AppError, /mayor o igual a cero/i)
        .with.property('code', 'INVALID_POCKET_AMOUNT');
    });

    it('rechaza montos NaN', () => {
      expect(() => new Pocket({ ...baseProps, amount: Number.NaN }))
        .to.throw(AppError, /mayor o igual a cero/i)
        .with.property('code', 'INVALID_POCKET_AMOUNT');
    });

    it('rechaza montos que no son número', () => {
      // Arrange — se fuerza un tipo inválido para probar la guarda de tipo.
      expect(() => new Pocket({ ...baseProps, amount: '100' as unknown as number }))
        .to.throw(AppError, /mayor o igual a cero/i)
        .with.property('code', 'INVALID_POCKET_AMOUNT');
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
      expect(pocket).to.have.property('name', 'Meta');
      expect(pocket.createdAt).to.be.an.instanceOf(Date);
      expect(pocket.updatedAt).to.be.an.instanceOf(Date);
    });
  });

  describe('updateName()', () => {
    it('cambia el nombre recortando espacios', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act
      pocket.updateName('  Nuevo  ');

      // Assert
      expect(pocket).to.have.property('name', 'Nuevo');
    });

    it('rechaza un nombre vacío o de solo espacios', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act + Assert
      expect(() => pocket.updateName('   '))
        .to.throw(AppError, /no puede estar vacío/i)
        .with.property('code', 'INVALID_POCKET_NAME');
    });
  });

  describe('updateAmount()', () => {
    it('actualiza el monto con un valor válido', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act
      pocket.updateAmount(250_000);

      // Assert
      expect(pocket).to.have.property('amount', 250_000);
    });

    it('rechaza un monto negativo', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act + Assert
      expect(() => pocket.updateAmount(-5))
        .to.throw(AppError, /mayor o igual a cero/i)
        .with.property('code', 'INVALID_POCKET_AMOUNT');
    });
  });

  describe('toPublic()', () => {
    it('serializa las fechas como cadenas ISO', () => {
      // Arrange
      const pocket = new Pocket(baseProps);

      // Act
      const publicView = pocket.toPublic();

      // Assert
      expect(publicView).to.deep.equal({
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
