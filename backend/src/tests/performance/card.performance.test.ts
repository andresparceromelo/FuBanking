import { describe, it, expect } from 'vitest';
import { VirtualCard } from '../../domain/entities/VirtualCard';

/**
 * Performance de la generacin de tarjetas virtuales (crypto random).
 * Patrn del ejemplo del profesor: presupuesto explcito + mediana de N repeticiones.
 */
describe('Card - VirtualCard generation performance', () => {

  it('genera nmeros de tarjeta dentro del presupuesto (<20ms, mediana de 5)', () => {
    // Arrange
    const durations: number[] = [];

    // Act
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      
      // Hacemos 1000 generaciones por iteracin para medir mejor
      let lastResult;
      for (let j = 0; j < 1000; j++) {
        lastResult = VirtualCard.generateNumber();
      }
      
      durations.push(performance.now() - start);
      
      // Assert (correctitud de la generacin)
      expect(lastResult).toBeDefined();
      expect(lastResult?.cardNumber).toHaveLength(16);
      expect(lastResult?.lastFour).toHaveLength(4);
      expect(lastResult?.cvv).toHaveLength(3);
      expect(lastResult?.expirationDate).toMatch(/^\d{2}\/\d{2}$/);
    }

    durations.sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;

    // Assert (presupuesto para 1000 generaciones)
    expect(median).toBeLessThan(20);
  });
});
