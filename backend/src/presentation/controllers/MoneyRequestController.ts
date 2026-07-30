import { Request, Response, NextFunction } from 'express';
import { CreateMoneyRequest } from '../../application/use-cases/money-request/CreateMoneyRequest';
import { GetUserMoneyRequests } from '../../application/use-cases/money-request/GetUserMoneyRequests';
import { RespondMoneyRequest } from '../../application/use-cases/money-request/RespondMoneyRequest';
import { sendSuccess } from '../../shared/utils/response';

export class MoneyRequestController {
  constructor(
    private readonly createMoneyRequest: CreateMoneyRequest,
    private readonly getUserMoneyRequests: GetUserMoneyRequests,
    private readonly respondMoneyRequest: RespondMoneyRequest,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { requestedUserEmail, amount, description } = req.body;
      const request = await this.createMoneyRequest.execute({
        requesterUserId: req.user!.id,
        requestedUserEmail,
        amount: Number(amount),
        description,
      });
      sendSuccess(res, request, 'Solicitud de dinero enviada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  getMyRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requests = await this.getUserMoneyRequests.execute(req.user!.id);
      sendSuccess(res, requests, 'Solicitudes de dinero obtenidas exitosamente');
    } catch (error) {
      next(error);
    }
  };

  respond = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { accept, accountId } = req.body;
      const updatedRequest = await this.respondMoneyRequest.execute({
        userId: req.user!.id,
        requestId,
        accept: Boolean(accept),
        accountId,
      });
      sendSuccess(res, updatedRequest, 'Respuesta a la solicitud registrada exitosamente');
    } catch (error) {
      next(error);
    }
  };
}
