import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Global rate limiting
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

// Specific rate limiting for verification endpoints
export const verificationRateLimiter = rateLimit({
  windowMs: env.VERIFY_RATE_LIMIT_WINDOW_MS,
  max: env.VERIFY_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many verification attempts, please try again after a minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const setupSecurityMiddleware = (app: any) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Compress responses
  app.use(compression());

  // Global rate limit
  if (env.NODE_ENV === 'production') {
    app.use('/api', globalRateLimiter);
  }
};
