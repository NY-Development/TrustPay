import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/AppError';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, CSRF_HEADER } from '../constants';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return next();
  }

  const hasSessionCookie = Boolean(
    req.cookies?.[ACCESS_TOKEN_COOKIE] || req.cookies?.[REFRESH_TOKEN_COOKIE]
  );

  if (!hasSessionCookie) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  // Debugging: View these in your backend console
  console.log("CSRF Debug - Cookie:", cookieToken, "Header:", headerToken);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenError('Invalid or missing CSRF token.');
  }

  next();
};