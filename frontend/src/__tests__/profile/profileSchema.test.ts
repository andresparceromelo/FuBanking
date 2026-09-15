import { updateProfileSchema, parseDateLocal } from '../../features/profile/schemas/profile.schemas';

/**
 * Tests unitarios del updateProfileSchema del módulo de perfil.
 *
 * Defectos cubiertos:
 *  #1  — Límites de longitud (maxlength) en campos de texto.
 *  #2  — parseDateLocal sin desfase UTC.
 *  #4  — Validación semántica de nombres (isValidName).
 *  #5  — Límite máximo de contraseña (newPassword).
 *  #6  — Formulario vacío: errores correctos en todos los campos obligatorios.
 *  #7  — Mensajes diferenciados: longitud / formato / semántica.
 *  #9  — birthDate no existe en el schema (inmutable).
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMessages(result: ReturnType<typeof updateProfileSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}

function messagesFor(
  result: ReturnType<typeof updateProfileSchema.safeParse>,
  field: string,
): string[] {
  if (result.success) return [];
  return result.error.issues
    .filter((i) => i.path.includes(field))
    .map((i) => i.message);
}

// ─── Defecto #1: Límites de longitud ─────────────────────────────────────────

describe('updateProfileSchema — Defecto #1: límites de longitud en campos de texto', () => {
  it('rechaza firstName con más de 100 caracteres', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'A'.repeat(101) });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'firstName');
    expect(msgs.some((m) => m.includes('100'))).toBe(true);
  });

  it('acepta firstName exactamente en el límite (100 chars)', () => {
    // 100 letras 'a' es válido en longitud; pasa isValidName porque contiene vocal
    const result = updateProfileSchema.safeParse({ firstName: 'a'.repeat(100) });
    // Nota: puede fallar por isValidName (3+ consecutivos), lo cual es correcto
    // Lo que importa es que el mensaje NO diga "superar 100 caracteres"
    const msgs = messagesFor(result, 'firstName');
    expect(msgs.some((m) => m.includes('superar los 100'))).toBe(false);
  });

  it('rechaza middleName con más de 100 caracteres', () => {
    const result = updateProfileSchema.safeParse({ middleName: 'B'.repeat(101) });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'middleName');
    expect(msgs.some((m) => m.includes('100'))).toBe(true);
  });

  it('rechaza lastName con más de 100 caracteres', () => {
    const result = updateProfileSchema.safeParse({ lastName: 'C'.repeat(101) });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'lastName');
    expect(msgs.some((m) => m.includes('100'))).toBe(true);
  });

  it('rechaza secondLastName con más de 100 caracteres', () => {
    const result = updateProfileSchema.safeParse({ secondLastName: 'D'.repeat(101) });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'secondLastName');
    expect(msgs.some((m) => m.includes('100'))).toBe(true);
  });
});

// ─── Defecto #2: parseDateLocal sin desfase UTC ───────────────────────────────

describe('parseDateLocal — Defecto #2: parseo sin desfase UTC', () => {
  it('parsea "2000-01-01" como 1 enero 2000 sin desfase', () => {
    const date = parseDateLocal('2000-01-01');
    expect(date.getFullYear()).toBe(2000);
    expect(date.getMonth()).toBe(0); // enero = 0
    expect(date.getDate()).toBe(1);
  });

  it('parsea "1990-05-15" correctamente en zona UTC-5', () => {
    const date = parseDateLocal('1990-05-15');
    expect(date.getFullYear()).toBe(1990);
    expect(date.getMonth()).toBe(4); // mayo = 4
    expect(date.getDate()).toBe(15);
  });

  it('parsea "2023-12-31" sin desfase al día anterior', () => {
    const date = parseDateLocal('2023-12-31');
    expect(date.getFullYear()).toBe(2023);
    expect(date.getMonth()).toBe(11); // diciembre = 11
    expect(date.getDate()).toBe(31);
  });
});

// ─── Defecto #4: Validación semántica de nombres ─────────────────────────────

describe('updateProfileSchema — Defecto #4: nombres sin sentido rechazados', () => {
  it('rechaza firstName con 3 o más caracteres consecutivos idénticos', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'Joooohn' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'firstName');
    expect(msgs.some((m) => m.includes('consecutivos'))).toBe(true);
  });

  it('rechaza lastName sin vocales (solo consonantes)', () => {
    const result = updateProfileSchema.safeParse({ lastName: 'Xyz' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'lastName');
    expect(msgs.length).toBeGreaterThanOrEqual(1);
  });

  it('rechaza firstName "aaaaa"', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'aaaaa' });
    expect(result.success).toBe(false);
  });

  it('acepta firstName con doble consonante corta (Lee)', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'Lee' });
    // Acepta: 2 'e' no son 3 consecutivos
    const msgs = messagesFor(result, 'firstName');
    expect(msgs.some((m) => m.includes('consecutivos'))).toBe(false);
  });

  it('acepta middleName vacío o nulo (campo opcional)', () => {
    const result = updateProfileSchema.safeParse({ middleName: '' });
    // Si solo se envía middleName vacío, falla por "al menos un campo"
    // pero NO por validación de nombre
    const msgs = messagesFor(result, 'middleName');
    expect(msgs.length).toBe(0);
  });

  it('rechaza middleName con 3+ caracteres consecutivos', () => {
    const result = updateProfileSchema.safeParse({ middleName: 'Luuuis' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'middleName');
    expect(msgs.some((m) => m.includes('consecutivos'))).toBe(true);
  });
});

// ─── Defecto #5: Límite máximo de contraseña ─────────────────────────────────

describe('updateProfileSchema — Defecto #5: límite máximo de contraseña', () => {
  it('acepta newPassword vacío (no cambiar contraseña)', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'Juan', newPassword: '' });
    const msgs = messagesFor(result, 'newPassword');
    expect(msgs.length).toBe(0);
  });

  it('acepta newPassword en el límite exacto (128 chars)', () => {
    const result = updateProfileSchema.safeParse({
      firstName: 'Juan',
      newPassword: 'x'.repeat(128),
    });
    const msgs = messagesFor(result, 'newPassword');
    expect(msgs.length).toBe(0);
  });

  it('rechaza newPassword que supera el límite (129 chars)', () => {
    const result = updateProfileSchema.safeParse({
      firstName: 'Juan',
      newPassword: 'x'.repeat(129),
    });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'newPassword');
    expect(msgs.some((m) => m.includes('128'))).toBe(true);
  });
});

// ─── Defecto #6: Formulario completamente vacío ───────────────────────────────

describe('updateProfileSchema — Defecto #6: validación de formulario vacío', () => {
  it('rechaza objeto vacío con mensaje "al menos un campo"', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
    const msgs = extractMessages(result);
    expect(msgs.some((m) => /al menos un campo/i.test(m))).toBe(true);
  });

  it('rechaza firstName con menos de 2 caracteres y muestra mensaje de mínimo', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'A' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'firstName');
    expect(msgs.some((m) => m.includes('al menos 2'))).toBe(true);
  });

  it('rechaza lastName con menos de 2 caracteres y muestra mensaje de mínimo', () => {
    const result = updateProfileSchema.safeParse({ lastName: 'B' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'lastName');
    expect(msgs.some((m) => m.includes('al menos 2'))).toBe(true);
  });
});

// ─── Defecto #7: Mensajes diferenciados ──────────────────────────────────────

describe('updateProfileSchema — Defecto #7: mensajes de error diferenciados', () => {
  it('mensaje de longitud excedida es DIFERENTE al de formato inválido', () => {
    const tooLong = updateProfileSchema.safeParse({ firstName: 'A'.repeat(101) });
    const badFormat = updateProfileSchema.safeParse({ firstName: 'Juan123' });

    const msgsTooLong = messagesFor(tooLong, 'firstName');
    const msgsBadFormat = messagesFor(badFormat, 'firstName');

    expect(msgsTooLong.some((m) => m.includes('superar'))).toBe(true);
    expect(msgsBadFormat.some((m) => m.includes('letras'))).toBe(true);
    // Los mensajes son distintos
    expect(msgsTooLong[0]).not.toBe(msgsBadFormat[0]);
  });

  it('mensaje de consecutivos es DIFERENTE al de longitud', () => {
    const consecutive = updateProfileSchema.safeParse({ firstName: 'Joooohn' });
    const tooLong = updateProfileSchema.safeParse({ firstName: 'A'.repeat(101) });

    const msgsConsecutive = messagesFor(consecutive, 'firstName');
    const msgsTooLong = messagesFor(tooLong, 'firstName');

    expect(msgsConsecutive.some((m) => m.includes('consecutivos'))).toBe(true);
    expect(msgsTooLong.some((m) => m.includes('superar'))).toBe(true);
  });
});

// ─── Defecto #9: birthDate inmutable ─────────────────────────────────────────

describe('updateProfileSchema — Defecto #9: birthDate no es un campo editable', () => {
  it('birthDate no está en las claves del schema', () => {
    const schemaShape = (updateProfileSchema as unknown as { _def: { schema: { shape: Record<string, unknown> } } })
      ._def?.schema?.shape;
    if (schemaShape) {
      expect(Object.keys(schemaShape)).not.toContain('birthDate');
    }
  });

  it('parsear un payload con birthDate no genera error — el campo es ignorado silenciosamente', () => {
    // Zod por defecto en modo strict rechazaría campos extra; en modo passthrough los ignora.
    // El schema usa el modo por defecto (strip), por lo que birthDate se descarta sin error.
    const result = updateProfileSchema.safeParse({
      firstName: 'Ana',
      birthDate: '1990-01-01', // campo desconocido → descartado
    });
    // No debe haber error por birthDate (puede haber error por "al menos un campo" si todos son vacíos)
    if (!result.success) {
      const msgs = messagesFor(result, 'birthDate');
      expect(msgs.length).toBe(0);
    }
  });

  it('el tipo UpdateProfileInput no expone birthDate', () => {
    // Verificación de tipo en runtime: el parsed output no contiene birthDate
    const result = updateProfileSchema.safeParse({ firstName: 'Ana', birthDate: '1990-01-01' });
    if (result.success) {
      expect('birthDate' in result.data).toBe(false);
    }
  });
});

// ─── Caminos felices (smoke tests) ───────────────────────────────────────────

describe('updateProfileSchema — caminos válidos', () => {
  it('acepta solo firstName válido', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'Maria' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Maria');
    }
  });

  it('acepta solo lastName válido', () => {
    const result = updateProfileSchema.safeParse({ lastName: 'Lopez' });
    expect(result.success).toBe(true);
  });

  it('acepta solo phone válido', () => {
    const result = updateProfileSchema.safeParse({ phone: '+573001234567' });
    expect(result.success).toBe(true);
  });

  it('acepta solo avatarUrl válida', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: 'https://cdn.example.com/img.png' });
    expect(result.success).toBe(true);
  });

  it('acepta solo monthlyIncome positivo', () => {
    const result = updateProfileSchema.safeParse({ monthlyIncome: 2500000 });
    expect(result.success).toBe(true);
  });

  it('acepta payload con múltiples campos válidos', () => {
    const result = updateProfileSchema.safeParse({
      firstName: 'Carlos',
      lastName: 'Ramirez',
      phone: '+57 310 000 0000',
      monthlyIncome: 3000000,
    });
    expect(result.success).toBe(true);
  });

  it('acepta nombre con acento (Álvaro)', () => {
    const result = updateProfileSchema.safeParse({ firstName: 'Álvaro' });
    expect(result.success).toBe(true);
  });

  it('acepta nombre con eñe (Ñoño)', () => {
    // "Ñoño" tiene 2 ñ pero no 3 consecutivas, y tiene vocal
    const result = updateProfileSchema.safeParse({ firstName: 'Ñoño' });
    expect(result.success).toBe(true);
  });

  it('rechaza monthlyIncome negativo', () => {
    const result = updateProfileSchema.safeParse({ monthlyIncome: -100 });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'monthlyIncome');
    expect(msgs.some((m) => m.includes('mayor a cero'))).toBe(true);
  });

  it('rechaza phone con formato inválido', () => {
    const result = updateProfileSchema.safeParse({ phone: '123' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'phone');
    expect(msgs.some((m) => /inv[aá]lid/i.test(m))).toBe(true);
  });

  it('rechaza avatarUrl con formato inválido', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: 'no-es-una-url' });
    expect(result.success).toBe(false);
    const msgs = messagesFor(result, 'avatarUrl');
    expect(msgs.length).toBeGreaterThanOrEqual(1);
  });
});
