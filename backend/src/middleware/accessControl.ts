import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { ForbiddenError, NotFoundError } from '../utils/AppError';

/**
 * Global Access Control Middleware
 *
 * Allows access if:
 *  • The Owner is currently within their free trial
 *  • OR the branch corresponding to the request context has an active fully-paid subscription
 *
 * Blocks access otherwise.
 */
export const requireActiveAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const { userId, actorType, branchId, ownerId } = req.user || {};

    if (!userId || !actorType) {
      throw new ForbiddenError('Unauthorized request');
    }

    // 1. Resolve Owner ID to check free trial status
    const targetOwnerId = actorType === 'owner' ? userId : ownerId;

    if (!targetOwnerId) {
      throw new ForbiddenError('Company context not established');
    }

    const owner = await User.findById(targetOwnerId);
    if (!owner) {
      throw new NotFoundError('Company owner not found');
    }

    /* ======================================================
       Refresh remaining trial days
    ====================================================== */
    owner.daysLeft = owner.trialEndDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(owner.trialEndDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    if (owner.isModified('daysLeft')) {
      await owner.save();
    }

    /* ======================================================
       Trial Check (Applies to all branches of Owner)
    ====================================================== */
    const inTrial =
      !!owner.trialEndDate &&
      new Date() < new Date(owner.trialEndDate);

    if (inTrial) {
      req.access = {
        allowed: true,
        source: 'trial',
        daysLeft: owner.daysLeft,
      };
      return next();
    }

    /* ======================================================
       Active Subscription Check (Per-Branch)
    ====================================================== */
    const targetBranchId = req.params.branchId || req.query.branchId || req.body.branchId || branchId;

    if (!targetBranchId) {
      throw new ForbiddenError('Branch context required to verify active subscription.');
    }

    const subscription = await Subscription.findOne({
      branchId: targetBranchId,
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
      'Access denied. Your branch subscription is inactive and the company free trial has expired.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Access control check to restrict endpoint purely to Owners
 */
export const requireOwner = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (req.user?.actorType !== 'owner') {
      throw new ForbiddenError('Access denied. Owners only.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Access control check to verify actor has access to a specific branch
 */
export const requireBranchAccess = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { actorType, userId, branchId } = req.user || {};

    if (!actorType || !userId) {
      throw new ForbiddenError('Unauthorized request');
    }

    const targetBranchId = req.params.branchId || req.query.branchId || req.body.branchId || branchId;

    if (!targetBranchId) {
      throw new ForbiddenError('Branch context required');
    }

    if (actorType === 'owner') {
      // Owner must check if the target branch is in their branches list
      const owner = await User.findById(userId);
      if (!owner) {
        throw new NotFoundError('Owner not found');
      }

      const hasAccess = owner.branches.some(
        (bId) => bId.toString() === targetBranchId.toString()
      );

      if (!hasAccess) {
        throw new ForbiddenError('Access denied: You do not own this branch');
      }
    } else {
      // Employee is restricted contextually to their own single branchId
      if (branchId?.toString() !== targetBranchId.toString()) {
        throw new ForbiddenError('Access denied: You are not assigned to this branch');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};