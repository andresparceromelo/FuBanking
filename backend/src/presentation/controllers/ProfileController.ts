import { Request, Response, NextFunction } from 'express';
import { GetProfile } from '../../application/use-cases/profile/GetProfile';
import { UpdateProfile } from '../../application/use-cases/profile/UpdateProfile';
import { UploadDocument } from '../../application/use-cases/profile/UploadDocument';
import { updateProfileSchema } from '../validators/profile.validators';
import { sendSuccess } from '../../shared/utils/response';

/**
 * ProfileController — capa de Presentación.
 *
 * Maneja los endpoints de perfil de usuario.
 * req.user siempre está disponible aquí porque las rutas
 * de perfil están protegidas por el authMiddleware.
 */
export class ProfileController {
  constructor(
    private readonly getProfile: GetProfile,
    private readonly updateProfile: UpdateProfile,
    private readonly uploadDocument?: UploadDocument,
  ) {}

  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getProfile.execute(req.user!.id);
      sendSuccess(res, result, 'Perfil obtenido exitosamente');
    } catch (error) {
      next(error);
    }
  };

  updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = updateProfileSchema.parse(req.body);
      const updateDto = {
        ...dto,
        birthDate: dto.birthDate ? new Date(`${dto.birthDate}T00:00:00`) : (dto.birthDate === null || dto.birthDate === '' ? null : undefined),
      };
      const result = await this.updateProfile.execute(req.user!.id, updateDto);
      sendSuccess(res, result, 'Perfil actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  };

  uploadMyDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.uploadDocument) {
        throw new Error('Subida de documento no disponible');
      }
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        throw new Error('No se recibió ningún archivo');
      }
      const result = await this.uploadDocument.execute(req.user!.id, file.buffer, file.originalname);
      sendSuccess(res, result, 'Documento subido y verificado exitosamente');
    } catch (error) {
      next(error);
    }
  };
}
