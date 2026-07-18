import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { Role, ACCESS_TOKEN_COOKIE } from '../constants';
import { JwtAccessPayload } from '../types';

/**
 * Middleware to authenticate requests using JWT access token from cookies or Authorization header
 */
export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Prefer the Authorization header — an explicit, deliberate credential
  //    from a Bearer client (mobile). Checking it first avoids a stray/stale
  //    platform-level cookie (mobile's HTTP client also sends
  //    withCredentials: true) shadowing a freshly-refreshed Bearer token.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to the httpOnly cookie (web).
  else if (req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
    token = req.cookies[ACCESS_TOKEN_COOKIE];
  }

  if (!token) {
    throw new UnauthorizedError('Not authenticated. Please login.');
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;

    // 4. Check if user/employee still exists and is active
    const actorType = decoded.actorType || 'owner';

    if (actorType === 'owner') {
      const user = await User.findById(decoded.userId).select('+isActive');
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User no longer exists or is inactive.');
      }

      // 5. Attach user info to request
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        actorType: 'owner',
        branchId: decoded.branchId, // Selected branch context from token
      };
    } else {
      const employee = await Employee.findById(decoded.userId).select('+isActive');
      if (!employee || !employee.isActive) {
        throw new UnauthorizedError('Employee no longer exists or is inactive.');
      }

      // 5. Attach employee info to request
      req.user = {
        userId: employee._id.toString(),
        email: employee.email,
        role: employee.role,
        actorType: 'employee',
        branchId: employee.branchId.toString(),
        ownerId: employee.ownerId.toString(),
      };
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired. Please refresh.');
    }
    throw new UnauthorizedError('Invalid token. Please login again.');
  }
});

/**
 * Middleware to authorize requests based on user roles
 */
export const authorize = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    next();
  };
};
