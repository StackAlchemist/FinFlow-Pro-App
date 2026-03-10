import 'dotenv/config';
import createApp from './app';
import connectDB, { disconnectDB } from './config/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 FinFlow Pro running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`📋 Health: http://localhost:${PORT}/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    shutdown('unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    shutdown('uncaughtException');
  });
};

start();