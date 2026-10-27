'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/chatbot.types';
import {
  GABRIELILLO_INITIAL_MESSAGES,
  matchGabrielilloResponse,
} from '../knowledge/bankingKnowledge';

const STORAGE_KEY = 'fubank_gabrielillo_messages';

export function useGabrielilloChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(GABRIELILLO_INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Cargar historial previo de sessionStorage si existe
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignorar fallas de lectura de storage
    }
  }, []);

  // Guardar en sessionStorage ante cambios de mensajes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignorar fallas de escritura de storage
    }
  }, [messages]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    (textToSend?: string) => {
      const messageText = (textToSend ?? input).trim();
      if (!messageText) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: messageText,
        timestamp: new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      // Respuesta inteligente de Gabrielillo
      setTimeout(() => {
        const botAnswer = matchGabrielilloResponse(messageText);
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'gabrielillo',
          text: botAnswer.text,
          timestamp: new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          actionLink: botAnswer.actionLink,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 400);
    },
    [input],
  );

  const clearChat = useCallback(() => {
    setMessages(GABRIELILLO_INITIAL_MESSAGES);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar
    }
  }, []);

  return {
    isOpen,
    toggleOpen,
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    clearChat,
  };
}
