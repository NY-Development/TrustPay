import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { createApp } from './app';

const startServer = async () => {
  // 1. Connect to Database
  await connectDatabase();

  // 2. Build the app (middleware + routes + error handler)
  const app = createApp();

  // 3. Listen
  const port = env.PORT;
  const HOST = '0.0.0.0';
  const server = app.listen(port, HOST, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Process terminated!');
    });
  });
};

startServer();
