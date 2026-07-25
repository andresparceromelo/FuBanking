import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './shared/config/env';
import apiRoutes from './presentation/routes/index';
import { errorHandler } from './presentation/middlewares/errorHandler';

/**
 * Configura y retorna la aplicación Express.
 *
 * Separado de server.ts para permitir importar la app en tests
 * sin levantar el servidor HTTP.
 */
function createApp(): Application {
  const app = express();

  // ── Seguridad ───────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // ── Parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Health check ────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // ── API Routes ──────────────────────────────────────────────────────────
  app.use('/api/v1', apiRoutes);

  // ── 404 handler ─────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada',
      },
    });
  });

  // ── Error handler (debe ser el último middleware) ────────────────────────
  app.use(errorHandler);

  return app;
}

export default createApp;
