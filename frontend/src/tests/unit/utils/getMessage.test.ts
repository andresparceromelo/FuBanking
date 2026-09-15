import { describe, it, expect } from 'vitest';
import { getMessage } from '@/shared/utils/getMessage';

describe('getMessage', () => {
  it('should return the server message when present', () => {
    expect(getMessage({ message: 'Mal' }, 'Fallback')).toBe('Mal');
  });

  it('should fall back without message, without object or empty', () => {
    expect(getMessage({ message: '' }, 'Fallback')).toBe('Fallback');
    expect(getMessage({}, 'Fallback')).toBe('Fallback');
    expect(getMessage(null, 'Fallback')).toBe('Fallback');
    expect(getMessage('boom', 'Fallback')).toBe('Fallback');
    expect(getMessage(undefined, 'Fallback')).toBe('Fallback');
  });
});
