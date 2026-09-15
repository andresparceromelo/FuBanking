import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from '../../presentation/middlewares/rateLimitMiddleware';
import { RateLimitError } from '../../shared/errors/RateLimitError';

describe('rateLimitMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    vi.useFakeTimers();
    mockRequest = {
      ip: '127.0.0.1',
    };
    mockResponse = {};
    nextFunction = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should allow requests within limit', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });

    limiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenLastCalledWith();

    limiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledTimes(2);
    expect(nextFunction).toHaveBeenLastCalledWith();
  });

  it('should block requests exceeding limit and pass RateLimitError to next()', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 1000 });

    // Primera solicitud (permitida)
    limiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith();

    // Segunda solicitud (bloqueada)
    limiter(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalledTimes(2);
    const errorCall = vi.mocked(nextFunction).mock.calls[1][0] as RateLimitError;
    expect(errorCall).toBeInstanceOf(RateLimitError);
    expect(errorCall.statusCode).toBe(429);
    expect(errorCall.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(errorCall.retryAfterSeconds).toBe(1); // Queda ~1 segundo
  });

  it('should reset limit after windowMs', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 1000 });

    limiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenLastCalledWith();

    // Avanzar el tiempo
    vi.advanceTimersByTime(1001);

    // Debería permitir la solicitud de nuevo
    limiter(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenLastCalledWith();
  });

  it('should separate limits by keyExtractor', () => {
    const limiter = createRateLimiter({
      maxRequests: 1,
      windowMs: 1000,
      keyExtractor: (req) => req.body.token,
    });

    const reqUserA = { body: { token: 'A' } } as Request;
    const reqUserB = { body: { token: 'B' } } as Request;

    limiter(reqUserA, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenLastCalledWith();

    limiter(reqUserB, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenLastCalledWith();

    // Segunda vez para A (bloqueado)
    limiter(reqUserA, mockResponse as Response, nextFunction);
    const errorCall = vi.mocked(nextFunction).mock.calls[2][0];
    expect(errorCall).toBeInstanceOf(RateLimitError);
  });
});
