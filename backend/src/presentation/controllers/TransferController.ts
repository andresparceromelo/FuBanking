import { Request, Response, NextFunction } from 'express';
import { CreateTransfer } from '../../application/use-cases/transfer/CreateTransfer';
import { GetTransfer } from '../../application/use-cases/transfer/GetTransfer';
import { GetTransferHistory } from '../../application/use-cases/transfer/GetTransferHistory';
import { SearchAccountByNumber } from '../../application/use-cases/account/SearchAccountByNumber';
import { SearchUserByEmail } from '../../application/use-cases/user/SearchUserByEmail';
import {
  createTransferSchema,
  searchByAccountNumberSchema,
  searchByEmailSchema,
} from '../validators/transfer.validators';
import { sendSuccess } from '../../shared/utils/response';

/**
 * TransferController — capa de Presentacion.
 *
 * Responsabilidad unica: traducir HTTP a casos de uso y devolver respuesta HTTP.
 * NO contiene logica de negocio.
 */
export class TransferController {
  constructor(
    private readonly createTransferUseCase: CreateTransfer,
    private readonly getTransferUseCase: GetTransfer,
    private readonly getTransferHistoryUseCase: GetTransferHistory,
    private readonly searchAccountByNumberUseCase: SearchAccountByNumber,
    private readonly searchUserByEmailUseCase: SearchUserByEmail,
  ) {}

  /**
   * POST /transfers
   * Crea una transferencia desde la cuenta del usuario autenticado.
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = createTransferSchema.parse(req.body);
      const result = await this.createTransferUseCase.execute({
        userId:                req.user!.id,
        senderAccountId:       dto.senderAccountId,
        receiverAccountNumber: dto.receiverAccountNumber,
        amount:                dto.amount,
        description:           dto.description ?? null,
      });
      sendSuccess(res, result, 'Transferencia realizada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /transfers/:id
   * Obtiene el comprobante de una transferencia.
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getTransferUseCase.execute({
        transactionId: req.params['id'] as string,
        userId:        req.user!.id,
      });
      sendSuccess(res, result, 'Comprobante obtenido');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /accounts/search?accountNumber=...
   * Busca destinatario por numero de cuenta.
   */
  searchByAccountNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountNumber } = searchByAccountNumberSchema.parse(req.query);
      const result = await this.searchAccountByNumberUseCase.execute(
        accountNumber,
        req.user!.id,
      );
      sendSuccess(res, result, 'Destinatario encontrado');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /users/search?email=...
   * Busca destinatario por correo electronico.
   */
  searchByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = searchByEmailSchema.parse(req.query);
      const result = await this.searchUserByEmailUseCase.execute(email, req.user!.id);
      sendSuccess(res, result, 'Destinatario encontrado');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /account/:accountId
   * Obtiene el historial de transacciones de una cuenta especifica.
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getTransferHistoryUseCase.execute({
        accountId: req.params['accountId'] as string,
        userId:    req.user!.id,
      });
      sendSuccess(res, result, 'Historial de transacciones obtenido');
    } catch (error) {
      next(error);
    }
  };
}
