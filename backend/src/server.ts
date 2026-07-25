import createApp from './app';
import { env } from './shared/config/env';

/**
 * Punto de entrada del servidor.
 *
 * Crea la app Express y la pone a escuchar.
 * Las variables de entorno ya están validadas en env.ts antes de llegar aquí.
 */
const app = createApp();
const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Banco Digital API running`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/health`);
  console.log(`   API:         http://localhost:${PORT}/api/v1\n`);
});

// Manejo de errores inesperados del proceso
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  server.close(() => process.exit(1));
});

export default server;
