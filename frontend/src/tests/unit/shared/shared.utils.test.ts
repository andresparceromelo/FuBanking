import { describe, it, expect, vi } from 'vitest';
import { parseDateLocal } from '@/shared/utils/dateUtils';
import { secureRandom } from '@/shared/utils/secureRandom';

describe('shared utils (dateUtils + secureRandom)', () => {
  it('parseDateLocal construye la fecha local sin desfase UTC', () => {
    // Arrange
    const input = '2026-03-15';
    // Act
    const result = parseDateLocal(input);
    // Assert
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });

  it('secureRandom devuelve un número en [0, 1)', () => {
    // Arrange
    const getRandomValues = vi.spyOn(crypto, 'getRandomValues');
    // Act
    const result = secureRandom();
    // Assert
    expect(getRandomValues).toHaveBeenCalled();
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });
});
