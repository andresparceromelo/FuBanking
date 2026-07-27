import { Request, Response, NextFunction } from 'express';
import { CreateServicePayment } from '../../application/use-cases/payment/CreateServicePayment';
import { GetUserPayments } from '../../application/use-cases/payment/GetUserPayments';
import { createPaymentSchema } from '../validators/payment.validators';
import { sendSuccess } from '../../shared/utils/response';

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreateServicePayment,
    private readonly getUserPaymentsUseCase: GetUserPayments,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createPaymentSchema.parse(req.body);
      const result = await this.createPaymentUseCase.execute({
        userId: req.user!.id,
        accountId: input.accountId,
        serviceType: input.serviceType,
        providerReference: input.providerReference,
        amount: input.amount,
      });
      sendSuccess(res, result, 'Pago creado', 201);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await this.getUserPaymentsUseCase.execute(req.user!.id);
      sendSuccess(res, payments, 'Pagos obtenidos');
    } catch (err) {
      next(err);
    }
  };
}
