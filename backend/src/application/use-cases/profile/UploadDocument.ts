import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../../shared/errors/AppError';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { PublicUser } from '../../../domain/entities/User';

/**
 * Caso de Uso: Subir documento de verificación (PDF).
 *
 * 1. Sube el PDF al bucket 'documents' de Supabase Storage.
 * 2. Marca documentVerified = true en el perfil del usuario.
 *
 * Por ahora no se valida el contenido del PDF, solo su subida.
 */
export class UploadDocument {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly storageClient: SupabaseClient,
  ) {}

  async execute(userId: string, buffer: Buffer, originalName: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
    }

    if (!buffer || buffer.length === 0) {
      throw new AppError('El archivo PDF está vacío', 400, 'EMPTY_FILE');
    }

    const path = `${userId}.pdf`;

    const { error: uploadError } = await this.storageClient
      .storage
      .from('documents')
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new AppError(
        `No se pudo subir el documento: ${uploadError.message ?? 'Desconocido'}`,
        500,
        'DOCUMENT_UPLOAD_FAILED',
      );
    }

    const updatedUser = await this.userRepository.update(userId, {
      documentVerified: true,
    });

    return updatedUser.toPublic();
  }
}
