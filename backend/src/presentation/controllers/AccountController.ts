import { Request, Response, NextFunction } from 'express';
import { CreateAccount } from '../../application/use-cases/account/CreateAccount';
import { GetUserAccounts } from '../../application/use-cases/account/GetUserAccounts';
import { GetAccountDetails } from '../../application/use-cases/account/GetAccountDetails';
import { DepositMoney } from '../../application/use-cases/account/DepositMoney';
import { WithdrawMoney } from '../../application/use-cases/account/WithdrawMoney';
import { createAccountSchema } from '../validators/account.validators';
import { sendSuccess } from '../../shared/utils/response';

/**
 * AccountController — capa de Presentación.
 *
 * Responsabilidad única: traducir HTTP → Use Case → HTTP.
 *
 * NO contiene lógica de negocio. Solo:
 * 1. Parsea y valida el body con Zod.
 * 2. Extrae el userId del token JWT (req.user, inyectado por authMiddleware).
 * 3. Llama al caso de uso correspondiente.
 * 4. Envía la respuesta HTTP.
 */
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccount,
    private readonly getUserAccountsUseCase: GetUserAccounts,
    private readonly getAccountDetailsUseCase: GetAccountDetails,
    private readonly depositMoneyUseCase: DepositMoney,
    private readonly withdrawMoneyUseCase: WithdrawMoney,
  ) {}

  /**
   * POST /accounts
   * Crea una nueva cuenta bancaria para el usuario autenticado.
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createAccountSchema.parse(req.body);
      const result = await this.createAccountUseCase.execute({
        userId: req.user!.id,
        type: input.type,
        requestCheckbook: input.requestCheckbook,
        companyName: input.companyName,
      });
      sendSuccess(res, result, 'Cuenta creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /accounts/me
   * Retorna todas las cuentas del usuario autenticado.
   */
  getMyAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accounts = await this.getUserAccountsUseCase.execute(req.user!.id);
      sendSuccess(res, accounts, 'Cuentas obtenidas exitosamente');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /accounts/:id
   * Retorna el detalle de una cuenta específica.
   * Verifica que la cuenta pertenezca al usuario autenticado.
   */
  getDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const account = await this.getAccountDetailsUseCase.execute({
        accountId,
        userId: req.user!.id,
      });
      sendSuccess(res, account, 'Detalle de cuenta obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /accounts/:id/deposit
   * Deposita dinero en la cuenta del usuario.
   */
  deposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { amount, description } = req.body;
      const updatedAccount = await this.depositMoneyUseCase.execute({
        userId: req.user!.id,
        accountId,
        amount: Number(amount),
        description,
      });
      sendSuccess(res, updatedAccount.toPublic(), 'Depósito realizado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /accounts/:id/withdraw
   * Retira dinero de la cuenta del usuario.
   */
  withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { amount, description } = req.body;
      const updatedAccount = await this.withdrawMoneyUseCase.execute({
        userId: req.user!.id,
        accountId,
        amount: Number(amount),
        description,
      });
      sendSuccess(res, updatedAccount.toPublic(), 'Retiro realizado exitosamente');
    } catch (error) {
      next(error);
    }
  };
}

