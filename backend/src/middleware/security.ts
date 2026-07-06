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

  // Parse comma-separated origins into an array, removing any accidental whitespace
  const allowedOrigins = env.CORS_ORIGIN 
    ? env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : [];

  // Enable CORS
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Data sanitization against NoSQL query injection
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.body) mongoSanitize.sanitize(req.body, {});
    if (req.params) mongoSanitize.sanitize(req.params, {});
    if (req.headers) mongoSanitize.sanitize(req.headers, {});
    
    if (req.query) {
      try {
        mongoSanitize.sanitize(req.query, {});
      } catch (err) {
        logger.error('Query sanitization error:', err);
      }
    }
    next();
  });

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Compress responses
  app.use(compression());

  // Global rate limit
  if (env.NODE_ENV === 'production') {
    app.use('/api', globalRateLimiter);
  }
};