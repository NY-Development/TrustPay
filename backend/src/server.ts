import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { setupSecurityMiddleware } from './middleware/security';
import { setupRoutes } from './api/routes';
import { errorHandler } from './middleware/errorHandler';

const startServer = async () => {
  const app = express();

  // 1. Connect to Database
  await connectDatabase();

  // 2. Standard Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  if (env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  // 3. Security Middleware
  setupSecurityMiddleware(app);

  // 4. Routes
  setupRoutes(app);

  // 5. Error Handler (Should be last)
  app.use(errorHandler);

  // 6. Listen
  const port = env.PORT;
  const server = app.listen(port, () => {
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
