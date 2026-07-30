import { Request, Response, NextFunction } from 'express';
import { CreateLoanApplication } from '../../application/use-cases/loan/CreateLoanApplication';
import { SimulateLoan } from '../../application/use-cases/loan/SimulateLoan';
import { GetAllLoans } from '../../application/use-cases/loan/GetAllLoans';
import { GetUserLoans } from '../../application/use-cases/loan/GetUserLoans';
import { ApproveLoan } from '../../application/use-cases/loan/ApproveLoan';
import { RejectLoan } from '../../application/use-cases/loan/RejectLoan';
import { createLoanSchema, simulateLoanSchema, loanIdParamSchema } from '../validators/loan.validators';
import { sendSuccess } from '../../shared/utils/response';

export class LoanController {
  constructor(
    private readonly createLoanUseCase: CreateLoanApplication,
    private readonly simulateLoanUseCase: SimulateLoan,
    private readonly getAllLoansUseCase: GetAllLoans,
    private readonly getUserLoansUseCase: GetUserLoans,
    private readonly approveLoanUseCase: ApproveLoan,
    private readonly rejectLoanUseCase: RejectLoan,
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

  getMyLoans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loans = await this.getUserLoansUseCase.execute(req.user!.id);
      sendSuccess(res, loans.map(loan => loan.toPublic()), 'Tus préstamos');
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loans = await this.getAllLoansUseCase.execute();
      sendSuccess(res, loans.map(loan => loan.toPublic()), 'Préstamos obtenidos');
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = loanIdParamSchema.parse(req.params);
      const result = await this.approveLoanUseCase.execute(id);
      sendSuccess(res, result, 'Préstamo aprobado');
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = loanIdParamSchema.parse(req.params);
      const result = await this.rejectLoanUseCase.execute(id);
      sendSuccess(res, result, 'Préstamo rechazado');
    } catch (err) {
      next(err);
    }
  };
}
