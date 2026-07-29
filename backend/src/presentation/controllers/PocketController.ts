import { Request, Response, NextFunction } from 'express';
import { CreatePocket } from '../../application/use-cases/pocket/CreatePocket';
import { GetAccountPockets } from '../../application/use-cases/pocket/GetAccountPockets';
import { UpdatePocket } from '../../application/use-cases/pocket/UpdatePocket';
import { DeletePocket } from '../../application/use-cases/pocket/DeletePocket';
import { TransferPocketBalance } from '../../application/use-cases/pocket/TransferPocketBalance';
import { createPocketSchema, updatePocketSchema, transferPocketSchema } from '../validators/pocket.validators';
import { sendSuccess } from '../../shared/utils/response';

export class PocketController {
  constructor(
    private readonly createPocketUseCase: CreatePocket,
    private readonly getAccountPocketsUseCase: GetAccountPockets,
    private readonly updatePocketUseCase: UpdatePocket,
    private readonly deletePocketUseCase: DeletePocket,
    private readonly transferPocketBalanceUseCase: TransferPocketBalance,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createPocketSchema.parse(req.body);
      const result = await this.createPocketUseCase.execute({
        userId: req.user!.id,
        accountId: input.accountId,
        name: input.name,
        amount: input.amount,
      });
      sendSuccess(res, result, 'Bolsillo creado', 201);
    } catch (err) {
      next(err);
    }
  };

  listByAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
    const result = await this.getAccountPocketsUseCase.execute({
        userId: req.user!.id,
        accountId,
      });
      sendSuccess(res, result, 'Bolsillos obtenidos');
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updatePocketSchema.parse(req.body);
      const pocketId = Array.isArray(req.params.pocketId) ? req.params.pocketId[0] : req.params.pocketId;
      const result = await this.updatePocketUseCase.execute({
        userId: req.user!.id,
        pocketId,
        name: input.name,
        amount: input.amount,
      });
      sendSuccess(res, result, 'Bolsillo actualizado');
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pocketId = Array.isArray(req.params.pocketId) ? req.params.pocketId[0] : req.params.pocketId;
      const result = await this.deletePocketUseCase.execute({
        userId: req.user!.id,
        pocketId,
      });
      sendSuccess(res, result, 'Bolsillo eliminado');
    } catch (err) {
      next(err);
    }
  };

  transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = transferPocketSchema.parse(req.body);
      const result = await this.transferPocketBalanceUseCase.execute({
        userId: req.user!.id,
        fromPocketId: input.fromPocketId,
        toPocketId: input.toPocketId,
        amount: input.amount,
      });
      sendSuccess(res, result, 'Transferencia entre bolsillos realizada');
    } catch (err) {
      next(err);
    }
  };
}
