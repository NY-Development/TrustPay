import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { setupSecurityMiddleware } from './middleware/security';
import { csrfProtection } from './middleware/csrf';
import { setupRoutes } from './api/routes';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

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

/**
 * Default export: a ready-to-serve Express app, for serverless platforms
 * (e.g. Vercel) that import this module directly as the request handler —
 * Express apps are callable as `(req, res)`, which is what those runtimes
 * expect a function's default export to be. Local dev (`server.ts`) and
 * tests (`tests/helpers.ts`) use the named `createApp` export instead and
 * never touch this, so this only matters for serverless deployment.
 *
 * mongoose queues operations issued before a connection finishes (buffered
 * commands, on by default), so it's safe to kick off the connection here
 * without awaiting it — the first request or two may wait briefly on a cold
 * start, exactly like a normal Express app would if you connected on boot.
 *
 * Gated on `process.env.VERCEL` (set automatically by Vercel's runtime) —
 * NOT on NODE_ENV. server.ts also imports this module (for `createApp`),
 * and NODE_ENV=production is a legitimate thing to set locally (e.g. to
 * test production cookie behavior) without actually running under Vercel.
 * Tying this to NODE_ENV instead of VERCEL would race server.ts's own
 * `connectDatabase()` call against this one, and if the DB happened to be
 * briefly unreachable, `connectDatabase()`'s `process.exit(1)` would kill
 * the whole local server out from under an already-listening app.
 */
if (process.env.VERCEL && mongoose.connection.readyState === 0) {
  connectDatabase().catch((err) => {
    logger.error('Serverless entry: database connection failed:', err);
  });
}

export default createApp();
