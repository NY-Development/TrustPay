import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { setupSecurityMiddleware } from './middleware/security';
import { csrfProtection } from './middleware/csrf';
import { setupRoutes } from './api/routes';
import { errorHandler } from './middleware/errorHandler';

/**
 * Builds and returns the Express app WITHOUT connecting to the database or
 * starting a listener — kept separate from server.ts so tests (Supertest)
 * can exercise real routes/middleware against a test database without
 * booting a live server.
 */
export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  setupSecurityMiddleware(app);
  app.use(csrfProtection);

  setupRoutes(app);

  app.use(errorHandler);

  return app;
};
