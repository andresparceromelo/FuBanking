import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/shared/utils/format';

describe('formatCurrency', () => {
  it('should format zero as COP currency', () => {
    expect(formatCurrency(0)).toBe('$\xa00');
  });

  it('should format positive amounts with COP symbol', () => {
    expect(formatCurrency(5000)).toBe('$\xa05.000');
    expect(formatCurrency(1800000)).toBe('$\xa01.800.000');
    expect(formatCurrency(5000000)).toBe('$\xa05.000.000');
  });

  it('should format large amounts correctly', () => {
    expect(formatCurrency(100000000)).toBe('$\xa0100.000.000');
  });

  it('should use Colombian number format (dots as thousand separator)', () => {
    const result = formatCurrency(1234567);
    expect(result).toBe('$\xa01.234.567');
  });

  it('should not include decimal places', () => {
    const result = formatCurrency(1500.7);
    expect(result).toBe('$\xa01.501');
  });

  it('should handle small amounts', () => {
    expect(formatCurrency(100)).toBe('$\xa0100');
    expect(formatCurrency(999)).toBe('$\xa0999');
  });
});
