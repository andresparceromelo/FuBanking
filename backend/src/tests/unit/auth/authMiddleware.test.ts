import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const { mockVerify } = vi.hoisted(() => ({ mockVerify: vi.fn() }));

vi.mock('../../../infrastructure/services/JwtTokenService', () => ({
  JwtTokenService: class {
    verify = mockVerify;
  },
}));

import { authMiddleware } from '../../../presentation/middlewares/authMiddleware';
import { AuthError } from '../../../shared/errors/AuthError';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

describe('authMiddleware', () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without authorization header', async () => {
    const { res, status, json } = mockRes();

    await authMiddleware({ headers: {} } as unknown as Request, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with a non-Bearer header or empty token', async () => {
    const { res, status } = mockRes();

    await authMiddleware({ headers: { authorization: 'Basic x' } } as unknown as Request, res, next);
    expect(status).toHaveBeenCalledWith(401);

    await authMiddleware({ headers: { authorization: 'Bearer ' } } as unknown as Request, res, next);
    expect(status).toHaveBeenCalledTimes(2);
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next on valid token', async () => {
    mockVerify.mockReturnValue({ userId: 'u1', email: 'a@b.co' });
    const { res } = mockRes();
    const req = { headers: { authorization: 'Bearer tok' } } as unknown as Request;

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'u1', email: 'a@b.co' });
    expect(next).toHaveBeenCalled();
  });

  it('should map AuthError codes from verify', async () => {
    mockVerify.mockImplementation(() => {
      throw new AuthError('El token ha expirado', 'TOKEN_EXPIRED');
    });
    const { res, status, json } = mockRes();

    await authMiddleware({ headers: { authorization: 'Bearer old' } } as unknown as Request, res, next);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }) }),
    );
    expect(status).not.toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return generic 401 on unexpected errors', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('boom');
    });
    const { res, status, json } = mockRes();

    await authMiddleware({ headers: { authorization: 'Bearer x' } } as unknown as Request, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORIZED' }) }),
    );
  });
});
