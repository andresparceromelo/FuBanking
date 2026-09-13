import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { TwoFactorController } from '../../../presentation/controllers/TwoFactorController';
import { FakeTokenService } from '../../fakes/FakeTokenService';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

function mockReq(data: Partial<Request> & { body?: unknown; user?: { id: string } }): Request {
  return { body: {}, ...data } as unknown as Request;
}

describe('TwoFactorController', () => {
  const next: NextFunction = vi.fn() as unknown as NextFunction;
  let useCases: Record<'verify' | 'enable' | 'disable' | 'resend', { execute: ReturnType<typeof vi.fn> }>;
  let controller: TwoFactorController;
  let tokenService: FakeTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenService = new FakeTokenService();
    useCases = {
      verify: { execute: vi.fn() },
      enable: { execute: vi.fn() },
      disable: { execute: vi.fn() },
      resend: { execute: vi.fn() },
    };
    controller = new TwoFactorController(
      useCases.verify as never,
      useCases.enable as never,
      useCases.disable as never,
      useCases.resend as never,
    );
  });

  it('should verify with 200', async () => {
    const temporaryToken = tokenService.generate({ userId: 'u1', email: 'a@b.co' });
    const dto = { user: { id: 'u1' }, token: 'jwt' };
    useCases.verify.execute.mockResolvedValue(dto);
    const { res, status, json } = mockRes();

    await controller.verify(mockReq({ body: { temporaryToken, code: '123456' } }), res, next);

    expect(useCases.verify.execute).toHaveBeenCalledWith({ temporaryToken, code: '123456' });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Verificación exitosa. Bienvenido.' }),
    );
  });

  it('should call next on invalid verify body', async () => {
    const { res } = mockRes();

    await controller.verify(mockReq({ body: { code: '12' } }), res, next);

    expect(next).toHaveBeenCalled();
    expect(useCases.verify.execute).not.toHaveBeenCalled();
  });

  it('should enable with the token user id', async () => {
    const user = { id: 'u1', twoFactorEnabled: true };
    useCases.enable.execute.mockResolvedValue(user);
    const { res, status, json } = mockRes();

    await controller.enable(mockReq({ user: { id: 'u1' } }), res, next);

    expect(useCases.enable.execute).toHaveBeenCalledWith('u1');
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { user } }),
    );
  });

  it('should disable with the token user id', async () => {
    const user = { id: 'u1', twoFactorEnabled: false };
    useCases.disable.execute.mockResolvedValue(user);
    const { res, status } = mockRes();

    await controller.disable(mockReq({ user: { id: 'u1' } }), res, next);

    expect(useCases.disable.execute).toHaveBeenCalledWith('u1');
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should resend with 200', async () => {
    const temporaryToken = tokenService.generate({ userId: 'u1', email: 'a@b.co' });
    const dto = { temporaryToken: 'new-fake-token', maskedEmail: 'a***@b.co' };
    useCases.resend.execute.mockResolvedValue(dto);
    const { res, status } = mockRes();

    await controller.resend(mockReq({ body: { temporaryToken } }), res, next);

    expect(useCases.resend.execute).toHaveBeenCalledWith({ temporaryToken });
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should call next when enable/disable/resend throw', async () => {
    useCases.enable.execute.mockRejectedValue(new Error('x'));
    useCases.disable.execute.mockRejectedValue(new Error('x'));
    useCases.resend.execute.mockRejectedValue(new Error('x'));
    const { res } = mockRes();
    const temporaryToken = tokenService.generate({ userId: 'u1', email: 'a@b.co' });

    await controller.enable(mockReq({ user: { id: 'u1' } }), res, next);
    await controller.disable(mockReq({ user: { id: 'u1' } }), res, next);
    await controller.resend(mockReq({ body: { temporaryToken } }), res, next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('should call next when verify throws', async () => {
    const temporaryToken = tokenService.generate({ userId: 'u1', email: 'a@b.co' });
    useCases.verify.execute.mockRejectedValue(new Error('TOKEN_INVALID'));
    const { res } = mockRes();

    await controller.verify(mockReq({ body: { temporaryToken, code: '000000' } }), res, next);

    expect(next).toHaveBeenCalled();
  });
});
