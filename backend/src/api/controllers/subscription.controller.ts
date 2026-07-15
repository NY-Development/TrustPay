import { Request, Response } from 'express';
import { SubscriptionService } from '../../services/subscription.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/AppError';
import { AuditLog } from '../../models/AuditLog';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';

import { getBranchAccessStatus } from '../../utils/subscriptionAccess';
import { User } from '../../models/User';

/**
 * @desc    Get subscription status of the active branch context
 * @route   GET /api/v1/subscriptions/status
 * @access  Private
 */
export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  const ownerId = req.user?.actorType === 'owner' ? req.user.userId : req.user?.ownerId;

  if (!branchId) {
    throw new BadRequestError('Branch context missing from request.');
  }

  const sub = await SubscriptionService.checkActiveSubscription(branchId);

  // If there's a partial_payment subscription, include remaining amount info
  const isActive = !!sub && sub.status === 'active' && sub.fullyPaid;
  const isPartialPayment = !!sub && sub.status === 'partial_payment';

  const owner = await User.findById(ownerId);
  if (!owner) throw new BadRequestError('Owner account not found.');

  const now = new Date();

  // If still in trial → block unnecessary payment
  if (owner.trialEndDate && now < owner.trialEndDate) {
    throw new BadRequestError('You are still in the free trial period.');
  }

  const access = await getBranchAccessStatus(branchId);

  res.status(200).json({
    success: true,
    data: {
      active: isActive,
      isPartialPayment,
      subscription: sub,
      remainingAmount: isPartialPayment && sub ? sub.requiredAmount - sub.paidAmount : 0,
      isSubsAccessAllowed: access.allowed,
      subsAccessSource: access.source,
      subsAccessSubscription: access.subscription || null,
      subsAccessTrialExpiresAt: access.expiresAt || null,
    },
  });
});

/**
 * @desc    Verify and activate subscription for the branch context
 * @route   POST /api/v1/subscriptions/verify
 * @access  Private
 */
export const verifySubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const branchId = req.user?.branchId;
  const { reference, plan } = req.body;

  if (!userId || !branchId) {
    throw new BadRequestError('User ID or active Branch ID is missing from Request.');
  }

  if (!reference || !plan || !['monthly', 'yearly'].includes(plan)) {
    throw new BadRequestError('Validation Error: Reference and plan ("monthly" or "yearly") are required.');
  }

  try {
    const result = await SubscriptionService.verifySubscriptionPayment(branchId, reference, plan);

    // Save success audit log
    await AuditLog.create({
      action: AUDIT_ACTIONS.VERIFY_SUBSCRIPTION,
      actor: userId,
      branchId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata: { reference, plan, subscriptionId: result.subscription._id, fullyPaid: result.fullyPaid },
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.subscription,
      fullyPaid: result.fullyPaid,
      remainingAmount: result.remainingAmount,
    });
  } catch (error: any) {
    logger.warn(`Subscription verification failure for user ${userId} / branch ${branchId}:`, error.message);

    // Save failure audit log
    await AuditLog.create({
      action: AUDIT_ACTIONS.VERIFY_SUBSCRIPTION_FAILED,
      actor: userId,
      branchId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata: { reference, plan, error: error.message },
    });

    res.status(400).json({
      success: false,
      message: error.message || 'Verification of subscription transaction failed.',
    });
  }
});

/**
 * @desc    Top-up a partial payment subscription for the branch context
 * @route   POST /api/v1/subscriptions/top-up
 * @access  Private
 */
export const topUpSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const branchId = req.user?.branchId;
  const { reference } = req.body;

  if (!userId || !branchId) {
    throw new BadRequestError('User ID or active Branch ID is missing from Request.');
  }

  if (!reference) {
    throw new BadRequestError('Validation Error: Transaction reference is required.');
  }

  try {
    const result = await SubscriptionService.topUpSubscriptionPayment(branchId, reference);

    await AuditLog.create({
      action: AUDIT_ACTIONS.TOP_UP_SUBSCRIPTION,
      actor: userId,
      branchId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata: { reference, subscriptionId: result.subscription._id, fullyPaid: result.fullyPaid },
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.subscription,
      fullyPaid: result.fullyPaid,
      remainingAmount: result.remainingAmount,
    });
  } catch (error: any) {
    logger.warn(`Subscription top-up failure for user ${userId} / branch ${branchId}:`, error.message);

    await AuditLog.create({
      action: AUDIT_ACTIONS.TOP_UP_SUBSCRIPTION_FAILED,
      actor: userId,
      branchId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata: { reference, error: error.message },
    });

    res.status(400).json({
      success: false,
      message: error.message || 'Top-up payment verification failed.',
    });
  }
});
