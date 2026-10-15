import { expect as assert } from '@assertive-ts/core';
import { describe, it, expect } from 'vitest';
import { getMessage } from '@/shared/utils/getMessage';

describe('getMessage', () => {
  it('should return the server message when present', () => {
    assert(getMessage({ message: 'Mal' }, 'Fallback')).toBeEqual('Mal');
  });

  it('should fall back without message, without object or empty', () => {
    assert(getMessage({ message: '' }, 'Fallback')).toBeEqual('Fallback');
    assert(getMessage({}, 'Fallback')).toBeEqual('Fallback');
    assert(getMessage(null, 'Fallback')).toBeEqual('Fallback');
    assert(getMessage('boom', 'Fallback')).toBeEqual('Fallback');
    assert(getMessage(undefined, 'Fallback')).toBeEqual('Fallback');
  });
});
