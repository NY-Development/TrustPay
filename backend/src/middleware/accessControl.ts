import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { ForbiddenError, NotFoundError } from '../utils/AppError';

/**
 * Global Access Control Middleware
 *
 * Allows access if:
 *  • User is currently within their free trial
 *  • OR user has an active fully-paid subscription
 *
 * Blocks access otherwise.
 */
export const requireActiveAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ForbiddenError('Unauthorized request');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    /* ======================================================
       Refresh remaining trial days every request
    ====================================================== */

    user.daysLeft = user.trialEndDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(user.trialEndDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    // Persist only if the value changed
    if (user.isModified('daysLeft')) {
      await user.save();
    }

    /* ======================================================
       Trial Check
    ====================================================== */

    const inTrial =
      !!user.trialEndDate &&
      new Date() < new Date(user.trialEndDate);

    if (inTrial) {
      req.access = {
        allowed: true,
        source: 'trial',
        daysLeft: user.daysLeft,
      };

      return next();
    }

    /* ======================================================
       Active Subscription Check
    ====================================================== */

    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      fullyPaid: true,
    });

    if (subscription) {
      req.access = {
        allowed: true,
        source: 'subscription',
        subscription,
      };

      return next();
    }

    /* ======================================================
       No Access
    ====================================================== */

    throw new ForbiddenError(
      'Access denied. Your free trial has expired and you do not have an active subscription.'
    );
  } catch (error) {
    next(error);
  }
};