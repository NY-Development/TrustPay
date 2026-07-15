import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../../src/config/env';
import { 
  ACCESS_TOKEN_COOKIE, 
  REFRESH_TOKEN_COOKIE, 
  COOKIE_OPTIONS 
} from '../../src/constants';
import { JwtAccessPayload, JwtRefreshPayload } from '../types';

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
 * Set auth cookies on response
 */
export const sendAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = env.NODE_ENV === 'production';
  
  const options = {
    ...COOKIE_OPTIONS,
    secure: env.COOKIE_SECURE || isProduction,
    domain: env.COOKIE_DOMAIN,
    sameSite: isProduction ? 'strict' as const : 'lax' as const,
  };

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
};

/**
 * Clear auth cookies
 */
export const clearAuthCookies = (res: Response) => {
  const options = {
    ...COOKIE_OPTIONS,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    domain: env.COOKIE_DOMAIN,
  };

  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
};
