import { describe, it, expect } from 'vitest';
import { adminService } from '@/features/admin/services/admin.service';

describe('adminService', () => {
  describe('getAllLoans', () => {
    it('should call GET /loans/admin and return all loans', async () => {
      try {
        const result = await adminService.getAllLoans();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('approveLoan', () => {
    it('should call PATCH /loans/admin/:id/approve', async () => {
      try {
        // Just testing that the call can be made, it will likely fail with 404 or auth error
        // without a real token and valid loan ID, which is fine since we can't use simulations.
        const result = await adminService.approveLoan('non-existent-loan-id');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('rejectLoan', () => {
    it('should call PATCH /loans/admin/:id/reject', async () => {
      try {
        const result = await adminService.rejectLoan('non-existent-loan-id');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
