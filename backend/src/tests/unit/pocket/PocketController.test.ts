import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { PocketController } from '../../../presentation/controllers/PocketController';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

function mockReq(
  data: Omit<Partial<Request>, 'user'> & { body?: unknown; params?: unknown; user?: { id: string; email?: string } },
): Request {
  return { body: {}, params: {}, ...data } as unknown as Request;
}

describe('PocketController', () => {
  const next: NextFunction = vi.fn() as unknown as NextFunction;
  let useCases: Record<'create' | 'list' | 'update' | 'remove' | 'transfer', { execute: ReturnType<typeof vi.fn> }>;
  let controller: PocketController;
  const accountId = randomUUID();
  const pocketId = randomUUID();

  beforeEach(() => {
    vi.clearAllMocks();
    useCases = {
      create: { execute: vi.fn() },
      list: { execute: vi.fn() },
      update: { execute: vi.fn() },
      remove: { execute: vi.fn() },
      transfer: { execute: vi.fn() },
    };
    controller = new PocketController(
      useCases.create as never,
      useCases.list as never,
      useCases.update as never,
      useCases.remove as never,
      useCases.transfer as never,
    );
  });

  it('should create with 201', async () => {
    const dto = { id: pocketId };
    useCases.create.execute.mockResolvedValue(dto);
    const { res, status, json } = mockRes();

    await controller.create(
      mockReq({ body: { accountId, name: 'Viaje', amount: 50000 }, user: { id: 'u1' } }),
      res,
      next,
    );

    expect(useCases.create.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', accountId, name: 'Viaje' }),
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Bolsillo creado' }),
    );
  });

  it('should call next on invalid create body', async () => {
    const { res } = mockRes();

    await controller.create(mockReq({ body: { name: '' }, user: { id: 'u1' } }), res, next);

    expect(next).toHaveBeenCalled();
    expect(useCases.create.execute).not.toHaveBeenCalled();
  });

  it('should list by account with string and array params', async () => {
    useCases.list.execute.mockResolvedValue([]);
    const { res, status } = mockRes();

    await controller.listByAccount(mockReq({ params: { accountId }, user: { id: 'u1' } }), res, next);
    expect(useCases.list.execute).toHaveBeenCalledWith({ userId: 'u1', accountId });

    await controller.listByAccount(
      mockReq({ params: { accountId: [accountId] }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(useCases.list.execute).toHaveBeenCalledWith({ userId: 'u1', accountId });
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should update with string and array pocketIds', async () => {
    useCases.update.execute.mockResolvedValue({ id: pocketId });
    const { res, status } = mockRes();

    await controller.update(
      mockReq({ body: { name: 'Nuevo' }, params: { pocketId }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(useCases.update.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', pocketId, name: 'Nuevo' }),
    );

    await controller.update(
      mockReq({ body: { amount: 10 }, params: { pocketId: [pocketId] }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should call next on empty update body', async () => {
    const { res } = mockRes();

    await controller.update(mockReq({ body: {}, params: { pocketId }, user: { id: 'u1' } }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should remove with string and array pocketIds', async () => {
    useCases.remove.execute.mockResolvedValue({ id: pocketId });
    const { res, status } = mockRes();

    await controller.remove(mockReq({ params: { pocketId }, user: { id: 'u1' } }), res, next);
    expect(useCases.remove.execute).toHaveBeenCalledWith({ userId: 'u1', pocketId });

    await controller.remove(
      mockReq({ params: { pocketId: [pocketId] }, user: { id: 'u1' } }),
      res,
      next,
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should transfer with 200', async () => {
    useCases.transfer.execute.mockResolvedValue({ ok: true });
    const { res, status } = mockRes();
    const toPocketId = randomUUID();

    await controller.transfer(
      mockReq({
        body: { fromPocketId: pocketId, toPocketId, amount: 1000 },
        user: { id: 'u1' },
      }),
      res,
      next,
    );

    expect(useCases.transfer.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', fromPocketId: pocketId, amount: 1000 }),
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it('should call next when list, update or remove throw', async () => {
    useCases.list.execute.mockRejectedValue(new Error('x'));
    useCases.update.execute.mockRejectedValue(new Error('x'));
    useCases.remove.execute.mockRejectedValue(new Error('x'));
    const { res } = mockRes();

    await controller.listByAccount(mockReq({ params: { accountId }, user: { id: 'u1' } }), res, next);
    await controller.update(
      mockReq({ body: { name: 'N' }, params: { pocketId }, user: { id: 'u1' } }),
      res,
      next,
    );
    await controller.remove(mockReq({ params: { pocketId }, user: { id: 'u1' } }), res, next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('should call next when a use-case throws', async () => {
    useCases.transfer.execute.mockRejectedValue(new Error('FONDOS'));
    const { res } = mockRes();

    await controller.transfer(
      mockReq({
        body: { fromPocketId: pocketId, toPocketId: randomUUID(), amount: 1000 },
        user: { id: 'u1' },
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalled();
  });
});
