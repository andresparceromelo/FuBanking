import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '@/features/profile/schemas/profile.schemas';

describe('profile.schemas', () => {
  describe('updateProfileSchema', () => {
    it('should accept a single valid field', () => {
      expect(updateProfileSchema.parse({ firstName: 'Maria' }).firstName).toBe('Maria');
      expect(updateProfileSchema.parse({ phone: '+573001234567' }).phone).toBe('+573001234567');
      expect(updateProfileSchema.parse({ monthlyIncome: 100 }).monthlyIncome).toBe(100);
    });

    it('should require at least one field', () => {
      expect(() => updateProfileSchema.parse({})).toThrow(/al menos un campo/i);
    });

    it('should reject invalid fields', () => {
      expect(() => updateProfileSchema.parse({ firstName: 'A' })).toThrow();
      expect(() => updateProfileSchema.parse({ phone: '123' })).toThrow(/teléfono/i);
      expect(() => updateProfileSchema.parse({ birthDate: '20-20-2020' })).toThrow(/inválido/i);
      expect(() => updateProfileSchema.parse({ birthDate: '2030-01-01' })).toThrow(/futuro/i);
      expect(() => updateProfileSchema.parse({ avatarUrl: 'not-a-url' })).toThrow(/avatar/i);
      expect(() => updateProfileSchema.parse({ monthlyIncome: -5 })).toThrow();
    });

    it('should accept empty and null birthDate', () => {
      expect(updateProfileSchema.parse({ birthDate: '' }).birthDate).toBe('');
      expect(updateProfileSchema.parse({ birthDate: null }).birthDate).toBeNull();
    });
  });
});
