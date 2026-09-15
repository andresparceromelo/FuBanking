import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../presentation/controllers/AuthController';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

function mockReq(data: Omit<Partial<Request>, 'user'> & { body?: unknown; user?: { id: string; email?: string } }): Request {
  return { body: {}, ...data } as unknown as Request;
}

describe('AuthController', () => {
  const next: NextFunction = vi.fn() as unknown as NextFunction;
  let useCases: Record<'register' | 'login' | 'logout' | 'forgot' | 'reset' | 'verifyResetToken', { execute: ReturnType<typeof vi.fn> }>;
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    useCases = {
      register: { execute: vi.fn() },
      login: { execute: vi.fn() },
      logout: { execute: vi.fn() },
      forgot: { execute: vi.fn() },
      reset: { execute: vi.fn() },
      verifyResetToken: { execute: vi.fn() },
    };
    controller = new AuthController(
      useCases.register as never,
      useCases.login as never,
      useCases.logout as never,
      useCases.forgot as never,
      useCases.reset as never,
      useCases.verifyResetToken as never,
    );
  });

  const validRegister = {
    firstName: 'Ana',
    lastName: 'Garcia',
    email: 'ana@example.com',
    document: '1234567890',
    birthDate: '1995-06-15',
    monthlyIncome: 1_800_000,
    password: 'Segura123',
    confirmPassword: 'Segura123',
  };

  it('should register with 201', async () => {
    const dto = { user: { id: 'u1' }, token: 't' };
    useCases.register.execute.mockResolvedValue(dto);
    const { res, status, json } = mockRes();

    await controller.register(mockReq({ body: validRegister }), res, next);

    expect(useCases.register.execute).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Usuario registrado exitosamente' }),
    );
  });

  it('should call next on invalid register body', async () => {
    const { res } = mockRes();

    await controller.register(mockReq({ body: { email: 'bad' } }), res, next);

    expect(next).toHaveBeenCalled();
    expect(useCases.register.execute).not.toHaveBeenCalled();
  });

  it('should login with 200', async () => {
    const dto = { user: { id: 'u1' }, token: 't', requiresTwoFactor: false };
    useCases.login.execute.mockResolvedValue(dto);
    const { res, status } = mockRes();

    await controller.login(
      mockReq({ body: { email: 'ana@example.com', password: 'Segura123' } }),
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(200);
  });

  it('should call next on invalid login body', async () => {
    const { res } = mockRes();

    await controller.login(mockReq({ body: { email: 'no-es-email' } }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should logout with the token user id', async () => {
    useCases.logout.execute.mockResolvedValue(undefined);
    const { res, status } = mockRes();

    await controller.logout(mockReq({ user: { id: 'u1' } }), res, next);

    expect(useCases.logout.execute).toHaveBeenCalledWith('u1');
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should request password reset', async () => {
    useCases.forgot.execute.mockResolvedValue(undefined);
    const { res, status } = mockRes();

    await controller.forgotPassword(mockReq({ body: { email: 'ana@example.com' } }), res, next);

    expect(useCases.forgot.execute).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should reset password with 200', async () => {
    useCases.reset.execute.mockResolvedValue(undefined);
    const { res, status } = mockRes();

    await controller.resetPassword(
      mockReq({ body: { token: 'tok', newPassword: 'Segura123', confirmPassword: 'Segura123' } }),
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(200);
  });

  it('should call next when logout throws', async () => {
    useCases.logout.execute.mockRejectedValue(new Error('x'));
    const { res } = mockRes();

    await controller.logout(mockReq({ user: { id: 'u1' } }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next when a use-case throws', async () => {
    useCases.login.execute.mockRejectedValue(new Error('INVALID_CREDENTIALS'));
    const { res } = mockRes();

    await controller.login(
      mockReq({ body: { email: 'ana@example.com', password: 'Segura123' } }),
      res,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  it('should verify reset token with 200', async () => {
    useCases.verifyResetToken.execute.mockResolvedValue(undefined);
    const { res, status } = mockRes();

    await controller.verifyResetToken(
      { query: { token: 'tok' } } as unknown as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(200);
    expect(useCases.verifyResetToken.execute).toHaveBeenCalled();
  });

  it('should call next if verifyResetToken throws', async () => {
    useCases.verifyResetToken.execute.mockRejectedValue(new Error('TOKEN_EXPIRED'));
    const { res } = mockRes();

    await controller.verifyResetToken(
      { query: { token: 'tok' } } as unknown as Request,
      res,
      next,
    );

    expect(next).toHaveBeenCalled();
  });
});
