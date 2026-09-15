import { NextFunction, Request, Response } from 'express';
import { CreateVirtualCard } from '../../application/use-cases/card/CreateVirtualCard';
import { DeleteVirtualCard } from '../../application/use-cases/card/DeleteVirtualCard';
import { GetUserCards } from '../../application/use-cases/card/GetUserCards';
import { RevealVirtualCardDetails } from '../../application/use-cases/card/RevealVirtualCardDetails';
import { ToggleCardLock } from '../../application/use-cases/card/ToggleCardLock';
import { sendSuccess } from '../../shared/utils/response';

export class CardController {
  constructor(
    private readonly createVirtualCard: CreateVirtualCard,
    private readonly getUserCards: GetUserCards,
    private readonly toggleCardLock: ToggleCardLock,
    private readonly revealVirtualCardDetails: RevealVirtualCardDetails,
    private readonly deleteVirtualCard: DeleteVirtualCard,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accountId } = req.body;
      const card = await this.createVirtualCard.execute({
        userId: req.user!.id,
        accountId,
      });
      sendSuccess(res, card, 'Tarjeta virtual creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  };

  getMyCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cards = await this.getUserCards.execute(req.user!.id);
      sendSuccess(res, cards, 'Tarjetas obtenidas exitosamente');
    } catch (error) {
      next(error);
    }
  };

  toggleLock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const card = await this.toggleCardLock.execute({
        userId: req.user!.id,
        cardId,
      });
      sendSuccess(res, card, 'Estado de tarjeta actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  revealDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await this.revealVirtualCardDetails.execute({
        userId: req.user!.id,
        cardId,
      });
      sendSuccess(res, details, 'Datos de tarjeta obtenidos exitosamente');
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cardId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const card = await this.deleteVirtualCard.execute({
        userId: req.user!.id,
        cardId,
      });
      sendSuccess(res, card, 'Tarjeta virtual eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  };
}
