import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/AppError';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, CSRF_HEADER } from '../constants';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Every pre-session auth endpoint (register/login/refresh/logout/password
// reset) is reachable — and, in practice, routinely reached — by a browser
// that's still carrying a *stale* httpOnly session cookie from some earlier
// visit (a previous login, an expired session, a different account on the
// same browser, etc). None of these clients ever send an Authorization
// Bearer header on these calls (that's the whole point of them), so the
// `hasSessionCookie` check below would otherwise fire on the mere presence
// of that leftover cookie and demand a CSRF header no client sends here —
// blocking fresh logins/registrations outright, not just refresh. CSRF
// protection is meant to guard state-changing actions performed using an
// *active* authenticated session; none of these endpoints are that (their
// own credential — password, refresh token, OTP, reset token — is what
// actually authorizes them), so they're exempted wholesale. Kept in sync
// with the frontend's own `isAuthRoute` list in api/client.ts.
const CSRF_EXEMPT_PATHS = [
  '/auth/register',
  '/auth/login/owner',
  '/auth/login/employee',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
];

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  if (CSRF_EXEMPT_PATHS.some((path) => req.path.includes(path))) {
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

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenError('Invalid or missing CSRF token.');
  }

  next();
};