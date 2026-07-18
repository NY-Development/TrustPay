import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import jwt from 'jsonwebtoken';
import { generateTokens } from '../../src/utils/auth';
import { env } from '../../src/config/env';

describe('generateTokens', () => {
  const mockOwner = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    email: 'owner@test.trustpay.dev',
    role: 'OWNER',
    tokenVersion: 3,
  };

  it('signs an access token with the expected claims', () => {
    const { accessToken } = generateTokens(mockOwner as any, 'owner', '507f1f77bcf86cd799439099');
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as any;

    expect(decoded.userId).toBe('507f1f77bcf86cd799439011');
    expect(decoded.email).toBe('owner@test.trustpay.dev');
    expect(decoded.role).toBe('OWNER');
    expect(decoded.actorType).toBe('owner');
    expect(decoded.branchId).toBe('507f1f77bcf86cd799439099');
  });

  it('signs a refresh token carrying tokenVersion for session invalidation', () => {
    const { refreshToken } = generateTokens(mockOwner as any, 'owner');
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

    expect(decoded.userId).toBe('507f1f77bcf86cd799439011');
    expect(decoded.tokenVersion).toBe(3);
  });

  it('infers actorType from role when not explicitly provided', () => {
    const employeeLike = {
      _id: { toString: () => '507f1f77bcf86cd799439022' },
      email: 'cashier@test.trustpay.dev',
      role: 'CASHIER',
      tokenVersion: 0,
      branchId: { toString: () => '507f1f77bcf86cd799439099' },
    };

    const { accessToken } = generateTokens(employeeLike as any);
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as any;

    expect(decoded.actorType).toBe('employee');
    expect(decoded.branchId).toBe('507f1f77bcf86cd799439099');
  });

  it('rejects an access token verified against the wrong secret', () => {
    const { accessToken } = generateTokens(mockOwner as any, 'owner');
    expect(() => jwt.verify(accessToken, 'not-the-real-secret')).toThrow();
  });
});
