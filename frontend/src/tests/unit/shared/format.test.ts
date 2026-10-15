import { expect as assert } from '@assertive-ts/core';
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/shared/utils/format';

describe('formatCurrency', () => {
  it('should format zero as COP currency', () => {
    assert(formatCurrency(0)).toBeEqual('$\xa00');
  });

  it('should format positive amounts with COP symbol', () => {
    assert(formatCurrency(5000)).toBeEqual('$\xa05.000');
    assert(formatCurrency(1800000)).toBeEqual('$\xa01.800.000');
    assert(formatCurrency(5000000)).toBeEqual('$\xa05.000.000');
  });

  it('should format large amounts correctly', () => {
    assert(formatCurrency(100000000)).toBeEqual('$\xa0100.000.000');
  });

  it('should use Colombian number format (dots as thousand separator)', () => {
    const result = formatCurrency(1234567);
    assert(result).toBeEqual('$\xa01.234.567');
  });

  it('should not include decimal places', () => {
    const result = formatCurrency(1500.7);
    assert(result).toBeEqual('$\xa01.501');
  });

  it('should handle small amounts', () => {
    assert(formatCurrency(100)).toBeEqual('$\xa0100');
    assert(formatCurrency(999)).toBeEqual('$\xa0999');
  });
});
