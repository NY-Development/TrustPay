import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/AppError';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, CSRF_HEADER } from '../constants';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Double-submit CSRF protection for cookie-authenticated requests.
 *
 * Mobile clients always send `Authorization: Bearer <token>` and never rely on
 * cookies, so they're exempt (a Bearer header isn't something a browser
 * auto-attaches cross-site, which is what CSRF exploits). Web clients rely
 * solely on the httpOnly auth cookies, so for those, mutating requests must
 * echo the (non-httpOnly) csrf_token cookie value back as a header — a value
 * only same-origin JS could have read.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  // Bearer-authenticated (mobile) requests are not cookie-driven — exempt.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return next();
  }

  const hasSessionCookie = Boolean(
    req.cookies?.[ACCESS_TOKEN_COOKIE] || req.cookies?.[REFRESH_TOKEN_COOKIE]
  );

  // No session cookie at all (e.g. login/register before any auth exists) —
  // nothing to protect yet.
  if (!hasSessionCookie) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenError('Invalid or missing CSRF token.');
  }

  next();
};
