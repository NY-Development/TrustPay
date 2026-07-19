import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { env } from '../../src/config/env';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  COOKIE_OPTIONS
} from '../../src/constants';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';

/**
 * Build the shared cookie option base for a given request.
 *
 * Production deploys the frontend and API on different registrable domains
 * (separate *.vercel.app sites) by default, so SameSite=Strict/Lax cookies
 * would never be sent cross-site. SameSite=None (paired with Secure, which
 * browsers mandate) works regardless of domain topology, at the cost of no
 * longer getting CSRF protection "for free" from SameSite — that's why the
 * CSRF double-submit middleware exists alongside this.
 *
 * `secure` defaults to `isProduction` but always defers to an explicit
 * COOKIE_SECURE — needed to test NODE_ENV=production locally over plain
 * HTTP, where a `Secure` cookie would otherwise be silently dropped by the
 * browser (real deployments should leave COOKIE_SECURE unset and get the
 * safe production default instead). `sameSite: 'none'` requires `Secure`,
 * so it's only used when both conditions hold.
 */
const buildCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';
  const secure = env.COOKIE_SECURE ?? isProduction;

  return {
    ...COOKIE_OPTIONS,
    secure,
    sameSite: secure && isProduction ? ('none' as const) : ('lax' as const),
    // Only scope to a domain when explicitly configured (shared parent domain
    // setups). Omitting it defaults the cookie to the exact request host.
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
};

/**
 * Generate Access and Refresh tokens
 */
export const generateTokens = (
  user: any,
  actorTypeParam?: 'owner' | 'employee',
  branchIdParam?: string
) => {
  const actorType =
    actorTypeParam ||
    (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
      ? 'owner'
      : 'employee');

  const accessPayload: JwtAccessPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    actorType,
    branchId: branchIdParam || user.branchId?.toString(),
  };

  const refreshPayload: JwtRefreshPayload = {
    userId: user._id.toString(),
    tokenVersion: user.tokenVersion || 0,
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });

  return { accessToken, refreshToken };
};

/**
 * Set auth cookies on response, plus a companion CSRF token cookie for the
 * double-submit pattern (non-httpOnly by design — the frontend reads it and
 * echoes it back as the X-CSRF-Token header on mutating requests).
 */
export const sendAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const options = buildCookieOptions();

  // Set access token cookie (short lived)
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000, // 15 minutes matching JWT
  });

  // Set refresh token cookie (long lived)
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...options,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days matching JWT
  });

  // Set CSRF cookie (readable by JS, matches refresh cookie lifetime)
  res.cookie(CSRF_TOKEN_COOKIE, crypto.randomBytes(32).toString('hex'), {
    ...options,
    httpOnly: false,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

/**
 * Clear auth cookies (and the CSRF cookie)
 */
export const clearAuthCookies = (res: Response) => {
  const options = buildCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
  res.clearCookie(CSRF_TOKEN_COOKIE, { ...options, httpOnly: false });
};
