'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useGabrielilloChat } from '../hooks/useGabrielilloChat';
import { GABRIELILLO_QUICK_CHIPS } from '../knowledge/bankingKnowledge';

export function GabrielilloChat() {
  const {
    isOpen,
    toggleOpen,
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    clearChat,
  } = useGabrielilloChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final con cada mensaje nuevo
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div
          data-cy="gabrielillo-modal"
          role="dialog"
          aria-label="Asistente Gabrielillo"
          className="mb-4 w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] bg-card text-card-foreground border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                <Bot size={22} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-primary rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  Gabrielillo
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-normal">
                    IA
                  </span>
                </h3>
                <p className="text-xs text-primary-foreground/80">Asesor Bancario FuBanking</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="Reiniciar conversación"
                className="p-1.5 rounded-lg hover:bg-white/10 text-primary-foreground/80 hover:text-white transition-colors"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={toggleOpen}
                title="Cerrar chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-primary-foreground/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20 text-sm">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border border-border text-foreground rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.actionLink && (
                      <div className="mt-2.5 pt-2 border-t border-border/60">
                        <Link
                          href={msg.actionLink.href}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          {msg.actionLink.label}
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2">
                <Sparkles size={14} className="animate-spin text-primary" />
                <span>Gabrielillo está escribiendo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 border-t border-border bg-card/60 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
            {GABRIELILLO_QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                data-cy="gabrielillo-quick-chip"
                type="button"
                onClick={() => sendMessage(chip.prompt)}
                className="text-xs bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/80 px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-border bg-card flex items-center gap-2"
          >
            <input
              data-cy="gabrielillo-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta a Gabrielillo..."
              className="flex-1 bg-muted/50 border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <button
              data-cy="gabrielillo-send-btn"
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante Launcher */}
      <button
        data-cy="gabrielillo-toggle-btn"
        type="button"
        onClick={toggleOpen}
        aria-label="Abrir asistente Gabrielillo"
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group"
      >
        {isOpen ? <X size={26} /> : <Bot size={28} />}
        {!isOpen && (
          <>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-card rounded-full"></span>
            <span className="absolute right-16 bg-card text-foreground border border-border text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              ¿Dudas? Habla con Gabrielillo
            </span>
          </>
        )}
      </button>
    </div>
  );
}
