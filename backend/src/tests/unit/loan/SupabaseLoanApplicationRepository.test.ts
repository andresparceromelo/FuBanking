import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseLoanApplicationRepository } from '../../../infrastructure/repositories/SupabaseLoanApplicationRepository';
import { LoanApplicationStatus } from '../../../domain/entities/LoanApplication';
import { AppError } from '../../../shared/errors/AppError';
import { buildPendingLoan } from './in-memory-repos';

function loanRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loan-1',
    user_id: 'user-1',
    amount: 5_000_000,
    installments: 12,
    annual_rate: 24,
    monthly_income: 2_000_000,
    monthly_payment: 480_000,
    total_to_pay: 5_760_000,
    total_interest: 760_000,
    document_verified: true,
    age_verified: true,
    income_verified: true,
    credit_history_verified: true,
    eligibility: { isEligible: true, reasons: [] },
    status: LoanApplicationStatus.PENDING,
    created_at: new Date('2026-08-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function mockClient() {
  const state: { result: { data: unknown; error: unknown } } = {
    result: { data: null, error: null },
  };
  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    then: (resolve: (v: unknown) => void) => void;
  } = {
    from: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    update: vi.fn(),
    single: vi.fn(),
    then: (resolve: (v: unknown) => void) => resolve(state.result),
  } as never;
  for (const k of ['from', 'insert', 'select', 'eq', 'order', 'update'] as const) {
    (builder[k] as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  }
  (builder.single as ReturnType<typeof vi.fn>).mockImplementation(async () => state.result);
  return { builder, state };
}

describe('SupabaseLoanApplicationRepository', () => {
  let client: ReturnType<typeof mockClient>;
  let repo: SupabaseLoanApplicationRepository;

  beforeEach(() => {
    client = mockClient();
    repo = new SupabaseLoanApplicationRepository(client.builder as never);
  });

  describe('save', () => {
    it('should insert and map the row back to an entity', async () => {
      client.state.result = { data: loanRow(), error: null };

      const result = await repo.save(buildPendingLoan('user-1'));

      expect(client.builder.from).toHaveBeenCalledWith('loan_applications');
      expect(client.builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', status: 'PENDING' }),
      );
      expect(result.userId).toBe('user-1');
      expect(result.amount).toBe(5_000_000);
      expect(result.status).toBe(LoanApplicationStatus.PENDING);
    });

    it('should throw DB_ERROR when insert fails', async () => {
      client.state.result = { data: null, error: { message: 'dup', details: 'x' } };

      await expect(repo.save(buildPendingLoan('user-1'))).rejects.toBeInstanceOf(AppError);
      await expect(repo.save(buildPendingLoan('user-1'))).rejects.toMatchObject({ code: 'DB_ERROR' });

      client.state.result = { data: null, error: {} };
      await expect(repo.save(buildPendingLoan('user-1'))).rejects.toThrow('Desconocido');
    });
  });

  describe('findById', () => {
    it('should return the mapped loan', async () => {
      client.state.result = { data: loanRow(), error: null };

      const result = await repo.findById('loan-1');

      expect(result?.id).toBe('loan-1');
      expect(client.builder.eq).toHaveBeenCalledWith('id', 'loan-1');
    });

    it('should return null on error or missing data', async () => {
      client.state.result = { data: null, error: { message: 'x' } };
      await expect(repo.findById('loan-1')).resolves.toBeNull();

      client.state.result = { data: null, error: null };
      await expect(repo.findById('loan-1')).resolves.toBeNull();
    });
  });

  describe('findByUserId / findAll', () => {
    it('should return mapped loans ordered by creation', async () => {
      client.state.result = { data: [loanRow(), loanRow({ id: 'loan-2' })], error: null };

      const result = await repo.findByUserId('user-1');

      expect(result).toHaveLength(2);
      expect(client.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should return [] on error', async () => {
      client.state.result = { data: null, error: { message: 'x' } };

      await expect(repo.findByUserId('user-1')).resolves.toEqual([]);
    });

    it('should return mapped loans on findAll', async () => {
      client.state.result = { data: [loanRow(), loanRow({ id: 'loan-9' })], error: null };

      const result = await repo.findAll();

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('loan-9');
    });

    it('should return [] on findAll error and on null data', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        client.state.result = { data: null, error: { message: 'x', details: 'y' } };
        await expect(repo.findAll()).resolves.toEqual([]);

        client.state.result = { data: null, error: null };
        await expect(repo.findAll()).resolves.toEqual([]);
      } finally {
        errSpy.mockRestore();
      }
    });
  });

  describe('updateStatus', () => {
    it('should update and return the mapped loan', async () => {
      client.state.result = { data: loanRow({ status: LoanApplicationStatus.APPROVED }), error: null };

      const result = await repo.updateStatus('loan-1', LoanApplicationStatus.APPROVED);

      expect(client.builder.update).toHaveBeenCalledWith({ status: LoanApplicationStatus.APPROVED });
      expect(result.status).toBe(LoanApplicationStatus.APPROVED);
    });

    it('should throw when the update fails', async () => {
      client.state.result = { data: null, error: { message: 'x' } };

      await expect(repo.updateStatus('loan-1', 'APPROVED')).rejects.toThrow('Error al actualizar');
    });
  });

  describe('mapRowToLoan eligibility', () => {
    it('should parse string eligibility', async () => {
      client.state.result = {
        data: loanRow({ eligibility: JSON.stringify({ isEligible: false, reasons: ['x'] }) }),
        error: null,
      };

      const result = await repo.findById('loan-1');

      expect(result?.eligibility).toEqual({ isEligible: false, reasons: ['x'] });
    });

    it('should default eligibility when missing', async () => {
      client.state.result = { data: loanRow({ eligibility: null }), error: null };

      const result = await repo.findById('loan-1');

      expect(result?.eligibility).toEqual({ isEligible: true, reasons: [] });
    });
  });
});
