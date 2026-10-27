import { describe, it, expect } from 'vitest';
import { matchGabrielilloResponse } from '@/features/chatbot/knowledge/bankingKnowledge';

describe('Gabrielillo — Base de Conocimiento Bancario (FuBanking)', () => {
  it('responde sobre créditos con montos SFC (500k a 30M) y enlace a /loans', () => {
    const res = matchGabrielilloResponse('¿Cuánto puedo pedir en un préstamo o crédito?');
    expect(res.text).toContain('500.000');
    expect(res.text).toContain('30.000.000');
    expect(res.text).toContain('Superintendencia Financiera de Colombia');
    expect(res.actionLink).toBeDefined();
    expect(res.actionLink?.href).toBe('/loans');
  });

  it('responde sobre bolsillos de ahorro y enlace a /pockets', () => {
    const res = matchGabrielilloResponse('¿Cómo crear un bolsillo para ahorrar?');
    expect(res.text).toContain('Bolsillos');
    expect(res.text).toContain('libre de costo');
    expect(res.actionLink?.href).toBe('/pockets');
  });

  it('responde sobre congelar/bloquear tarjetas virtuales y enlace a /cards', () => {
    const res = matchGabrielilloResponse('Quiero bloquear o congelar mi tarjeta virtual');
    expect(res.text).toContain('tarjetas virtuales');
    expect(res.text).toContain('congelar');
    expect(res.actionLink?.href).toBe('/cards');
  });

  it('responde sobre la política de seguridad estricta de 2FA con 1 solo intento', () => {
    const res = matchGabrielilloResponse('¿Por qué el código 2FA solo tiene 1 intento de seguridad?');
    expect(res.text).toContain('1 solo intento');
    expect(res.text).toContain('anulado');
  });

  it('responde a saludos amigablemente', () => {
    const res = matchGabrielilloResponse('Hola, buenos días!');
    expect(res.text).toContain('¡Hola!');
    expect(res.text).toContain('Gabrielillo');
  });

  it('ofrece guía general cuando la consulta no coincide con palabras clave específicas', () => {
    const res = matchGabrielilloResponse('xyz consulta desconocida 12345');
    expect(res.text).toContain('asesor financiero de FuBanking');
    expect(res.text).toContain('Créditos');
    expect(res.text).toContain('Bolsillos');
  });
});
