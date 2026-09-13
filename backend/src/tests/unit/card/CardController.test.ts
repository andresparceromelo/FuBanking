import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { CardController } from '../../../presentation/controllers/CardController';
import { CardStatus } from '../../../domain/entities/VirtualCard';
import { buildVirtualCard } from './in-memory-repos';

function mockRes() {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response;
  return { res, status: res.status as ReturnType<typeof vi.fn>, json };
}

function mockReq(data: Partial<Request> & { body?: unknown; params?: unknown; user?: { id: string } }): Request {
  return { body: {}, params: {}, ...data } as unknown as Request;
}

describe('CardController', () => {
  const next: NextFunction = vi.fn() as unknown as NextFunction;
  let useCases: {
    create: { execute: ReturnType<typeof vi.fn> };
    getMine: { execute: ReturnType<typeof vi.fn> };
    toggle: { execute: ReturnType<typeof vi.fn> };
    reveal: { execute: ReturnType<typeof vi.fn> };
  };
  let controller: CardController;

  beforeEach(() => {
    vi.clearAllMocks();
    useCases = {
      create: { execute: vi.fn() },
      getMine: { execute: vi.fn() },
      toggle: { execute: vi.fn() },
      reveal: { execute: vi.fn() },
    };
    controller = new CardController(
      useCases.create as never,
      useCases.getMine as never,
      useCases.toggle as never,
      useCases.reveal as never,
    );
  });

  describe('create', () => {
    it('should return 201 with accountId and userId', async () => {
      const card = buildVirtualCard('user-1', 'acc-1').toPublic();
      useCases.create.execute.mockResolvedValue(card);
      const { res, status, json } = mockRes();

      await controller.create(
        mockReq({ body: { accountId: 'acc-1' }, user: { id: 'user-1' } }),
        res,
        next,
      );

      expect(useCases.create.execute).toHaveBeenCalledWith({ userId: 'user-1', accountId: 'acc-1' });
      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Tarjeta virtual creada exitosamente' }),
      );
    });

    it('should call next when creation throws', async () => {
      useCases.create.execute.mockRejectedValue(new Error('ACCOUNT_NOT_FOUND'));
      const { res } = mockRes();

      await controller.create(
        mockReq({ body: { accountId: 'x' }, user: { id: 'user-1' } }),
        res,
        next,
      );

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMyCards', () => {
    it('should return the user cards', async () => {
      const cards = [buildVirtualCard('user-1', 'acc-1').toPublic()];
      useCases.getMine.execute.mockResolvedValue(cards);
      const { res, status, json } = mockRes();

      await controller.getMyCards(mockReq({ user: { id: 'user-1' } }), res, next);

      expect(useCases.getMine.execute).toHaveBeenCalledWith('user-1');
      expect(status).toHaveBeenCalledWith(200);
      expect((json.mock.calls[0][0] as { data: unknown[] }).data).toHaveLength(1);
    });

    it('should call next on error', async () => {
      useCases.getMine.execute.mockRejectedValue(new Error('boom'));
      const { res } = mockRes();

      await controller.getMyCards(mockReq({ user: { id: 'user-1' } }), res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('toggleLock / revealDetails', () => {
    it('should toggle with string and array param ids', async () => {
      const dto = buildVirtualCard('user-1', 'acc-1').toPublic();
      dto.status = CardStatus.BLOQUEADA;
      useCases.toggle.execute.mockResolvedValue(dto);
      const { res, status } = mockRes();

      await controller.toggleLock(mockReq({ params: { id: 'card-1' }, user: { id: 'user-1' } }), res, next);
      expect(useCases.toggle.execute).toHaveBeenCalledWith({ userId: 'user-1', cardId: 'card-1' });

      await controller.toggleLock(
        mockReq({ params: { id: ['card-2'] }, user: { id: 'user-1' } }),
        res,
        next,
      );
      expect(useCases.toggle.execute).toHaveBeenCalledWith({ userId: 'user-1', cardId: 'card-2' });
      expect(status).toHaveBeenCalledWith(200);
    });

    it('should reveal with string and array param ids', async () => {
      const details = { cardNumber: '4532000000001234', cvv: '123' };
      useCases.reveal.execute.mockResolvedValue(details);
      const { res } = mockRes();

      await controller.revealDetails(mockReq({ params: { id: 'card-1' }, user: { id: 'user-1' } }), res, next);
      expect(useCases.reveal.execute).toHaveBeenCalledWith({ userId: 'user-1', cardId: 'card-1' });

      await controller.revealDetails(
        mockReq({ params: { id: ['card-9'] }, user: { id: 'user-1' } }),
        res,
        next,
      );
      expect(useCases.reveal.execute).toHaveBeenCalledWith({ userId: 'user-1', cardId: 'card-9' });
    });

    it('should call next when toggle or reveal throw', async () => {
      useCases.toggle.execute.mockRejectedValue(new Error('CARD_NOT_FOUND'));
      useCases.reveal.execute.mockRejectedValue(new Error('FORBIDDEN'));
      const { res } = mockRes();

      await controller.toggleLock(mockReq({ params: { id: 'c' }, user: { id: 'u' } }), res, next);
      await controller.revealDetails(mockReq({ params: { id: 'c' }, user: { id: 'u' } }), res, next);

      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});
