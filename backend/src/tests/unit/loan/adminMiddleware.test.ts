import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const { mockVerify, mockFindById } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
  mockFindById: vi.fn(),
}));

vi.mock('../../../infrastructure/services/JwtTokenService', () => ({
  JwtTokenService: class {
    verify = mockVerify;
  },
}));

vi.mock('../../../infrastructure/repositories/SupabaseUserRepository', () => ({
  SupabaseUserRepository: class {
    findById = mockFindById;
  },
}));

vi.mock('../../../infrastructure/database/supabase.client', () => ({
  default: {},
}));

import { adminMiddleware } from '../../../presentation/middlewares/adminMiddleware';
import { createTestUser } from './in-memory-repos';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

describe('adminMiddleware', () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when the authorization header is missing', async () => {
    const { res, status, json } = mockRes();

    await adminMiddleware({ headers: {} } as unknown as Request, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'UNAUTHORIZED' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when the header is not Bearer', async () => {
    const { res, status } = mockRes();

    await adminMiddleware(
      { headers: { authorization: 'Basic abc' } } as unknown as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when the token is empty', async () => {
    const { res, status } = mockRes();

    await adminMiddleware(
      { headers: { authorization: 'Bearer ' } } as unknown as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user for an admin', async () => {
    const admin = createTestUser({ role: 'admin' });
    mockVerify.mockReturnValue({ userId: admin.id, email: 'a@b.co' });
    mockFindById.mockResolvedValue(admin);
    const { res } = mockRes();
    const req = { headers: { authorization: 'Bearer tok' } } as unknown as Request;

    await adminMiddleware(req, res, next);

    expect(req.user).toEqual({ id: admin.id, email: 'a@b.co' });
    expect(next).toHaveBeenCalled();
  });

  it('should return 404 when the user does not exist', async () => {
    mockVerify.mockReturnValue({ userId: 'x', email: 'a@b.co' });
    mockFindById.mockResolvedValue(null);
    const { res, status, json } = mockRes();

    await adminMiddleware(
      { headers: { authorization: 'Bearer tok' } } as unknown as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'USER_NOT_FOUND' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when the user is not admin', async () => {
    mockVerify.mockReturnValue({ userId: 'x', email: 'a@b.co' });
    mockFindById.mockResolvedValue(createTestUser());
    const { res, status, json } = mockRes();

    await adminMiddleware(
      { headers: { authorization: 'Bearer tok' } } as unknown as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FORBIDDEN' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token verification throws', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const { res, status } = mockRes();

    await adminMiddleware(
      { headers: { authorization: 'Bearer bad' } } as unknown as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
