import { expect as assert } from '@assertive-ts/core';
import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '@/features/profile/schemas/profile.schemas';

describe('profile.schemas', () => {
  describe('updateProfileSchema', () => {
    it('should accept a single valid field', () => {
      assert(updateProfileSchema.parse({ firstName: 'Maria' }).firstName).toBeEqual('Maria');
      assert(updateProfileSchema.parse({ phone: '+573001234567' }).phone).toBeEqual('+573001234567');
      assert(updateProfileSchema.parse({ monthlyIncome: 100 }).monthlyIncome).toBeEqual(100);
    });

    it('should require at least one field', () => {
      expect(() => updateProfileSchema.parse({})).toThrow(/al menos un campo/i);
    });

    it('should reject invalid fields', () => {
      expect(() => updateProfileSchema.parse({ firstName: 'A' })).toThrow();
      expect(() => updateProfileSchema.parse({ phone: '123' })).toThrow(/teléfono/i);
      expect(() => updateProfileSchema.parse({ avatarUrl: 'not-a-url' })).toThrow(/avatar/i);
      expect(() => updateProfileSchema.parse({ monthlyIncome: -5 })).toThrow();
    });
  });
});
