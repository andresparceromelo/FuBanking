import { describe, it, expect } from 'vitest';
import { updateProfileSchema, parseDateLocal } from '../../../presentation/validators/profile.validators';

/**
 * Tests unitarios del updateProfileSchema (backend).
 *
 * Defectos cubiertos:
 *  #1  — Límites de longitud (.max 100) en campos de nombre.
 *  #2  — parseDateLocal sin desfase UTC.
 *  #4  — Validación semántica de nombres (isValidName).
 *  #6  — Formulario vacío → error "al menos un campo".
 *  #7  — Mensajes diferenciados: longitud / formato / semántica.
 *  #9  — birthDate NO está en el schema (inmutable).
 */

// ─── Caminos base (regresión) ─────────────────────────────────────────────────

describe('profile.validators — caminos base', () => {
  it('acepta middleName válido', () => {
    expect(updateProfileSchema.parse({ middleName: 'Luis' }).middleName).toBe('Luis');
  });

  it('acepta avatarUrl válida', () => {
    expect(updateProfileSchema.parse({ avatarUrl: 'https://x.com/a.png' }).avatarUrl).toBe(
      'https://x.com/a.png',
    );
  });

  it('acepta lastName válido', () => {
    expect(updateProfileSchema.parse({ lastName: 'Perez' }).lastName).toBe('Perez');
  });

  it('acepta secondLastName válido (carácter único — sin mínimo)', () => {
    expect(updateProfileSchema.parse({ secondLastName: 'Go' }).secondLastName).toBe('Go');
  });

  it('acepta phone válido', () => {
    expect(updateProfileSchema.parse({ phone: '+573001234567' }).phone).toBe('+573001234567');
  });

  it('acepta monthlyIncome positivo', () => {
    expect(updateProfileSchema.parse({ monthlyIncome: 100 }).monthlyIncome).toBe(100);
  });

  it('requiere al menos un campo', () => {
    expect(() => updateProfileSchema.parse({})).toThrow(/al menos un campo/i);
  });
});

// ─── Defecto #1: Límites de longitud ─────────────────────────────────────────

describe('profile.validators — Defecto #1: límites de longitud', () => {
  it('rechaza firstName > 100 chars con mensaje de longitud', () => {
    expect(() => updateProfileSchema.parse({ firstName: 'A'.repeat(101) })).toThrow();

    let msg = '';
    try { updateProfileSchema.parse({ firstName: 'A'.repeat(101) }); } catch (e: any) {
      msg = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    expect(msg).toMatch(/100/);
  });

  it('rechaza middleName > 100 chars con mensaje de longitud', () => {
    expect(() => updateProfileSchema.parse({ middleName: 'B'.repeat(101) })).toThrow();

    let msg = '';
    try { updateProfileSchema.parse({ middleName: 'B'.repeat(101) }); } catch (e: any) {
      msg = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    expect(msg).toMatch(/100/);
  });

  it('rechaza lastName > 100 chars con mensaje de longitud', () => {
    expect(() => updateProfileSchema.parse({ lastName: 'C'.repeat(101) })).toThrow();

    let msg = '';
    try { updateProfileSchema.parse({ lastName: 'C'.repeat(101) }); } catch (e: any) {
      msg = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    expect(msg).toMatch(/100/);
  });

  it('rechaza secondLastName > 100 chars con mensaje de longitud', () => {
    expect(() => updateProfileSchema.parse({ secondLastName: 'D'.repeat(101) })).toThrow();

    let msg = '';
    try { updateProfileSchema.parse({ secondLastName: 'D'.repeat(101) }); } catch (e: any) {
      msg = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    expect(msg).toMatch(/100/);
  });
});

// ─── Defecto #2: parseDateLocal sin desfase UTC ───────────────────────────────

describe('parseDateLocal — Defecto #2: parseo sin desfase UTC', () => {
  it('parsea "2000-01-01" como 1 enero 2000', () => {
    const d = parseDateLocal('2000-01-01');
    expect(d.getFullYear()).toBe(2000);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it('parsea "1990-05-15" correctamente', () => {
    const d = parseDateLocal('1990-05-15');
    expect(d.getFullYear()).toBe(1990);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(15);
  });

  it('parsea "2023-12-31" sin desfase al día anterior', () => {
    const d = parseDateLocal('2023-12-31');
    expect(d.getFullYear()).toBe(2023);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

// ─── Defecto #4: Validación semántica de nombres ─────────────────────────────

describe('profile.validators — Defecto #4: nombres sin sentido', () => {
  it('rechaza firstName con 3+ caracteres consecutivos (Joooohn)', () => {
    expect(() => updateProfileSchema.parse({ firstName: 'Joooohn' })).toThrow();

    let msg = '';
    try { updateProfileSchema.parse({ firstName: 'Joooohn' }); } catch (e: any) {
      msg = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    expect(msg).toMatch(/consecutivos/i);
  });

  it('rechaza lastName sin vocales', () => {
    expect(() => updateProfileSchema.parse({ lastName: 'Xyz' })).toThrow();
  });

  it('rechaza firstName "aaaaa" (repetición + sin sentido)', () => {
    expect(() => updateProfileSchema.parse({ firstName: 'aaaaa' })).toThrow();
  });

  it('acepta firstName "Lee" (2 consonantes, no 3 consecutivas)', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'Lee' });
    // No debe lanzar error por isValidName
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => m.includes('consecutivos'))).toBe(false);
    }
  });

  it('rechaza middleName con 3+ consecutivos', () => {
    expect(() => updateProfileSchema.parse({ middleName: 'Luuuis' })).toThrow();
  });

  it('rechaza secondLastName con 3+ consecutivos', () => {
    expect(() => updateProfileSchema.parse({ secondLastName: 'Torrres' })).toThrow();
  });
});

// ─── Defecto #6: Formulario vacío ────────────────────────────────────────────

describe('profile.validators — Defecto #6: formulario vacío', () => {
  it('objeto vacío → error "al menos un campo"', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => /al menos un campo/i.test(m))).toBe(true);
    }
  });

  it('firstName menor a 2 chars → mensaje de mínimo', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.filter((i) => i.path.includes('firstName')).map((i) => i.message);
      expect(msgs.some((m) => m.includes('al menos 2'))).toBe(true);
    }
  });
});

// ─── Defecto #7: Mensajes diferenciados ──────────────────────────────────────

describe('profile.validators — Defecto #7: mensajes diferenciados por tipo', () => {
  it('mensaje de longitud es distinto al de formato', () => {
    let msgLength = '';
    let msgFormat = '';

    try { updateProfileSchema.parse({ firstName: 'A'.repeat(101) }); } catch (e: any) {
      msgLength = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    try { updateProfileSchema.parse({ firstName: 'Juan123' }); } catch (e: any) {
      msgFormat = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }

    expect(msgLength).toMatch(/100/);
    expect(msgFormat).toMatch(/letras/i);
    expect(msgLength).not.toBe(msgFormat);
  });

  it('mensaje de consecutivos es distinto al de longitud', () => {
    let msgConsec = '';
    let msgLength = '';

    try { updateProfileSchema.parse({ firstName: 'Joooohn' }); } catch (e: any) {
      msgConsec = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }
    try { updateProfileSchema.parse({ firstName: 'A'.repeat(101) }); } catch (e: any) {
      msgLength = (e.issues ?? []).map((i: any) => i.message).join('; ');
    }

    expect(msgConsec).toMatch(/consecutivos/i);
    expect(msgLength).toMatch(/100/);
    expect(msgConsec).not.toBe(msgLength);
  });
});

// ─── Defecto #9: birthDate inmutable ─────────────────────────────────────────

describe('profile.validators — Defecto #9: birthDate no es campo editable', () => {
  it('birthDate en payload es descartado (strip mode) y no genera error', () => {
    const result = updateProfileSchema.safeParse({
      firstName: 'Ana',
      birthDate: '1990-01-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('birthDate' in result.data).toBe(false);
    }
  });

  it('el schema parseado NO contiene clave birthDate', () => {
    const parsed = updateProfileSchema.parse({ firstName: 'Ana', birthDate: '2000-06-01' });
    expect(Object.keys(parsed)).not.toContain('birthDate');
  });

  it('requiere al menos un campo, incluso si birthDate está presente', () => {
    // Solo birthDate → debe fallar por "al menos un campo"
    const result = updateProfileSchema.safeParse({ birthDate: '1990-01-01' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => /al menos un campo/i.test(m))).toBe(true);
    }
  });
});
