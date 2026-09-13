import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '../../../presentation/validators/profile.validators';

describe('profile.validators', () => {
  it('should accept each field in isolation', () => {
    expect(updateProfileSchema.parse({ middleName: 'Luis' }).middleName).toBe('Luis');
    expect(updateProfileSchema.parse({ avatarUrl: 'https://x.com/a.png' }).avatarUrl).toBe(
      'https://x.com/a.png',
    );
    expect(updateProfileSchema.parse({ lastName: 'Perez' }).lastName).toBe('Perez');
    expect(updateProfileSchema.parse({ secondLastName: 'G' }).secondLastName).toBe('G');
    expect(updateProfileSchema.parse({ birthDate: '1995-03-20' }).birthDate).toBe('1995-03-20');
    expect(updateProfileSchema.parse({ phone: '+573001234567' }).phone).toBe('+573001234567');
    expect(updateProfileSchema.parse({ monthlyIncome: 100 }).monthlyIncome).toBe(100);
  });

  it('should require at least one field', () => {
    expect(() => updateProfileSchema.parse({})).toThrow(/al menos un campo/i);
  });
});
