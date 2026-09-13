import multer from 'multer';
import { AppError } from '../../shared/errors/AppError';

/**
 * Middleware de subida de archivos.
 *
 * Solo acepta PDFs (verificación de documento) con un tamaño máximo de 2MB.
 * El archivo queda en memoria (memoryStorage) y lo consume el caso de uso
 * de subida de documento, que lo persiste en Supabase Storage.
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new AppError('Solo se permiten archivos PDF', 400, 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

export const uploadDocumentMiddleware = upload.single('document');
