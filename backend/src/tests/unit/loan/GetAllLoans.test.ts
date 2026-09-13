import { describe, it, expect, beforeEach } from 'vitest';
import { GetAllLoans } from '../../../application/use-cases/loan/GetAllLoans';
import { InMemoryLoanRepo, createTestUser, buildPendingLoan } from './in-memory-repos';

describe('GetAllLoans', () => {
  let loanRepo: InMemoryLoanRepo;
  let useCase: GetAllLoans;

  beforeEach(() => {
    loanRepo = new InMemoryLoanRepo();
    useCase = new GetAllLoans(loanRepo);
  });

  it('should return an empty array when there are no loans', async () => {
    await expect(useCase.execute()).resolves.toEqual([]);
  });

  it('should return all loans from every user', async () => {
    const userA = createTestUser();
    const userB = createTestUser({ email: 'b@example.com', document: '2222222222' });
    await loanRepo.save(buildPendingLoan(userA.id));
    await loanRepo.save(buildPendingLoan(userB.id));

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result.map((l) => l.userId).sort()).toEqual([userA.id, userB.id].sort());
  });

  it('should propagate repository errors', async () => {
    loanRepo.findAll = async () => {
      throw new Error('DB down');
    };

    await expect(useCase.execute()).rejects.toThrow('DB down');
  });
});
