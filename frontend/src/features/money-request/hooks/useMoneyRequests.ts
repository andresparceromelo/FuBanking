'use client';

import { useCallback, useState } from 'react';
import { moneyRequestService } from '../services/money-request.service';
import { CreateMoneyRequestPayload, MoneyRequest } from '../types/money-request.types';

function getMessage(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || fallback)
    : fallback;
}

export function useMoneyRequests() {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await moneyRequestService.getMyRequests();
      setRequests(data);
      return data;
    } catch (err) {
      setError(getMessage(err, 'No se pudieron cargar las solicitudes.'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (payload: CreateMoneyRequestPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await moneyRequestService.createRequest(payload);
      setRequests((current) => [request, ...current]);
      return request;
    } catch (err) {
      setError(getMessage(err, 'No se pudo enviar la solicitud.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respond = useCallback(async (requestId: string, accept: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const request = await moneyRequestService.respond(requestId, accept);
      setRequests((current) => current.map((item) => (item.id === request.id ? request : item)));
      return request;
    } catch (err) {
      setError(getMessage(err, 'No se pudo responder la solicitud.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { requests, isLoading, error, setError, fetchRequests, createRequest, respond };
}

