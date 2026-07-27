import { Request, Response, NextFunction } from 'express';
import { CreateLoanApplication } from '../../application/use-cases/loan/CreateLoanApplication';
import { SimulateLoan } from '../../application/use-cases/loan/SimulateLoan';
import { createLoanSchema, simulateLoanSchema } from '../validators/loan.validators';
import { sendSuccess } from '../../shared/utils/response';

export class LoanController {
  constructor(
    private readonly createLoanUseCase: CreateLoanApplication,
    private readonly simulateLoanUseCase: SimulateLoan,
  ) {}

  simulate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = simulateLoanSchema.parse(req.body);
      const result = await this.simulateLoanUseCase.execute(input);
      sendSuccess(res, result, 'Simulación de préstamo creada');
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createLoanSchema.parse(req.body);
      const result = await this.createLoanUseCase.execute({
        ...input,
        userId: req.user!.id,
      });
      sendSuccess(res, result, 'Solicitud de préstamo creada', 201);
    } catch (err) {
      next(err);
    }
  };
}
