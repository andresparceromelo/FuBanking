import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGabrielilloChat } from '@/features/chatbot/hooks/useGabrielilloChat';

describe('useGabrielilloChat', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia cerrado con el mensaje de bienvenida de Gabrielillo', () => {
    const { result } = renderHook(() => useGabrielilloChat());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    expect(result.current.messages[0].sender).toBe('gabrielillo');
  });

  it('permite alternar el estado de apertura (toggleOpen)', () => {
    const { result } = renderHook(() => useGabrielilloChat());

    act(() => {
      result.current.toggleOpen();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleOpen();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('envía un mensaje del usuario y recibe respuesta automática de Gabrielillo', () => {
    const { result } = renderHook(() => useGabrielilloChat());

    act(() => {
      result.current.setInput('¿Cómo funcionan los créditos?');
    });

    act(() => {
      result.current.sendMessage();
    });

    // Mensaje del usuario agregado inmediatamente
    expect(result.current.messages.some((m) => m.sender === 'user')).toBe(true);
    expect(result.current.isTyping).toBe(true);

    // Avanzamos el temporizador para la respuesta del bot
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isTyping).toBe(false);
    const lastMsg = result.current.messages[result.current.messages.length - 1];
    expect(lastMsg.sender).toBe('gabrielillo');
    expect(lastMsg.text).toContain('500.000');
  });

  it('limpia la conversación al llamar clearChat', () => {
    const { result } = renderHook(() => useGabrielilloChat());

    act(() => {
      result.current.sendMessage('Hola');
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].sender).toBe('gabrielillo');
  });
});
