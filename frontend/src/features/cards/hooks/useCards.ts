'use client';

import { useCallback, useState } from 'react';
import { cardService } from '../services/card.service';
import { VirtualCard } from '../types/card.types';

function getMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}

export function useCards() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cardService.getMyCards();
      setCards(data);
      return data;
    } catch (err) {
      setError(getMessage(err, 'No se pudieron cargar las tarjetas.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCard = useCallback(async (accountId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const card = await cardService.createCard(accountId);
      setCards((current) => [card, ...current]);
      return card;
    } catch (err) {
      setError(getMessage(err, 'No se pudo crear la tarjeta.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleLock = useCallback(async (cardId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const card = await cardService.toggleLock(cardId);
      setCards((current) => current.map((item) => (item.id === card.id ? card : item)));
      return card;
    } catch (err) {
      setError(getMessage(err, 'No se pudo actualizar la tarjeta.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { cards, isLoading, error, setError, fetchCards, createCard, toggleLock };
}

