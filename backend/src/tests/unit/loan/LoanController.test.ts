import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { LoanController } from '../../../presentation/controllers/LoanController';
import { LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { buildPendingLoan } from './in-memory-repos';

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

describe('LoanController', () => {
  const next: NextFunction = vi.fn() as unknown as NextFunction;
  let useCases: {
    create: { execute: ReturnType<typeof vi.fn> };
    simulate: { execute: ReturnType<typeof vi.fn> };
    getAll: { execute: ReturnType<typeof vi.fn> };
    getMine: { execute: ReturnType<typeof vi.fn> };
    approve: { execute: ReturnType<typeof vi.fn> };
    reject: { execute: ReturnType<typeof vi.fn> };
  };
  let controller: LoanController;

  beforeEach(() => {
    vi.clearAllMocks();
    useCases = {
      create: { execute: vi.fn() },
      simulate: { execute: vi.fn() },
      getAll: { execute: vi.fn() },
      getMine: { execute: vi.fn() },
      approve: { execute: vi.fn() },
      reject: { execute: vi.fn() },
    };
    controller = new LoanController(
      useCases.create as never,
      useCases.simulate as never,
      useCases.getAll as never,
      useCases.getMine as never,
      useCases.approve as never,
      useCases.reject as never,
    );
  });

  describe('simulate', () => {
    it('should return 200 with the simulation', async () => {
      // Arrange
      const dto = { monthlyPayment: 100, totalToPay: 1200, totalInterest: 200 };
      useCases.simulate.execute.mockResolvedValue(dto);
      const { res, status, json } = mockRes();

      // Act
      await controller.simulate(
        mockReq({ body: { amount: 1_000, installments: 12, annualRate: 10 } }),
        res,
        next,
      );

      // Assert
      expect(useCases.simulate.execute).toHaveBeenCalledWith({ amount: 1_000, installments: 12, annualRate: 10 });
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ success: true, message: 'Simulación de préstamo creada', data: dto });
    });

    it('should call next on invalid body', async () => {
      // Arrange
      const { res } = mockRes();

      // Act
      await controller.simulate(mockReq({ body: { amount: -5 } }), res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(useCases.simulate.execute).not.toHaveBeenCalled();
    });

    it('should call next when the use-case throws', async () => {
      // Arrange
      useCases.simulate.execute.mockRejectedValue(new Error('boom'));
      const { res } = mockRes();

      // Act
      await controller.simulate(
        mockReq({ body: { amount: 1_000, installments: 12, annualRate: 10 } }),
        res,
        next,
      );

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('create', () => {
    it('should return 201 with the userId from the token', async () => {
      // Arrange
      const dto = { id: 'l1', status: LoanApplicationStatus.PENDING };
      useCases.create.execute.mockResolvedValue(dto);
      const { res, status, json } = mockRes();

      // Act
      await controller.create(
        mockReq({
          body: { amount: 5_000_000, installments: 12, annualRate: 24, monthlyIncome: 1_800_000 },
          user: { id: 'user-1' },
        }),
        res,
        next,
      );

      expect(useCases.create.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', amount: 5_000_000 }),
      );
      // Assert
      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Solicitud de préstamo creada' }),
      );
    });

    it('should call next on invalid body', async () => {
      // Arrange
      const { res } = mockRes();

      // Act
      await controller.create(mockReq({ body: { amount: 0 }, user: { id: 'user-1' } }), res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMyLoans', () => {
    it('should map loans to public DTOs', async () => {
      // Arrange
      const loan = buildPendingLoan('user-1');
      useCases.getMine.execute.mockResolvedValue([loan]);
      const { res, status } = mockRes();

      // Act
      await controller.getMyLoans(mockReq({ user: { id: 'user-1' } }), res, next);

      // Assert
      expect(useCases.getMine.execute).toHaveBeenCalledWith('user-1');
      expect(status).toHaveBeenCalledWith(200);
    });

    it('should call next when the use-case throws', async () => {
      // Arrange
      useCases.getMine.execute.mockRejectedValue(new Error('boom'));
      const { res } = mockRes();

      // Act
      await controller.getMyLoans(mockReq({ user: { id: 'user-1' } }), res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return all loans as public DTOs', async () => {
      // Arrange
      useCases.getAll.execute.mockResolvedValue([buildPendingLoan('u1'), buildPendingLoan('u2')]);
      const { res, status, json } = mockRes();

      // Act
      await controller.getAll(mockReq({}), res, next);

      // Assert
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Préstamos obtenidos' }),
      );
      expect((json.mock.calls[0][0] as { data: unknown[] }).data).toHaveLength(2);
    });

    it('should call next when getAll throws', async () => {
      // Arrange
      useCases.getAll.execute.mockRejectedValue(new Error('boom'));
      const { res } = mockRes();

      // Act
      await controller.getAll(mockReq({}), res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });

  describe('approve / reject', () => {
    it('should approve with a valid uuid param', async () => {
      // Arrange
      const id = randomUUID();
      const dto = { id, status: LoanApplicationStatus.APPROVED };
      useCases.approve.execute.mockResolvedValue(dto);
      const { res, status } = mockRes();

      // Act
      await controller.approve(mockReq({ params: { id } }), res, next);

      // Assert
      expect(useCases.approve.execute).toHaveBeenCalledWith(id);
      expect(status).toHaveBeenCalledWith(200);
    });

    it('should call next on invalid uuid param', async () => {
      // Arrange
      const { res } = mockRes();

      // Act
      await controller.approve(mockReq({ params: { id: 'no-uuid' } }), res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(useCases.approve.execute).not.toHaveBeenCalled();
    });

    it('should reject with a valid uuid param', async () => {
      // Arrange
      const id = randomUUID();
      const dto = { id, status: LoanApplicationStatus.REJECTED };
      useCases.reject.execute.mockResolvedValue(dto);
      const { res, status } = mockRes();

      // Act
      await controller.reject(mockReq({ params: { id } }), res, next);

      // Assert
      expect(useCases.reject.execute).toHaveBeenCalledWith(id);
      expect(status).toHaveBeenCalledWith(200);
    });

    it('should call next when reject throws', async () => {
      // Arrange
      useCases.reject.execute.mockRejectedValue(new Error('PENDING'));
      const { res } = mockRes();

      // Act
      await controller.reject(mockReq({ params: { id: randomUUID() } }), res, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });
});
