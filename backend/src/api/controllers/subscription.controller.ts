import { Request, Response } from 'express';
import { SubscriptionService } from '../../services/subscription.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/AppError';
import { AuditLog } from '../../models/AuditLog';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';

/**
 * @desc    Get subscription status of the authenticated user
 * @route   GET /api/v1/subscriptions/status
 * @access  Private
 */
export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new BadRequestError('User ID missing from Request.');
  }

  const sub = await SubscriptionService.checkActiveSubscription(userId);

  // If there's a partial_payment subscription, include remaining amount info
  const isActive = !!sub && sub.status === 'active' && sub.fullyPaid;
  const isPartialPayment = !!sub && sub.status === 'partial_payment';

  res.status(200).json({
    success: true,
    data: {
      active: isActive,
      isPartialPayment,
      subscription: sub,
      remainingAmount: isPartialPayment && sub ? sub.requiredAmount - sub.paidAmount : 0,
    },
  });
});

/**
 * @desc    Verify and activate subscription
 * @route   POST /api/v1/subscriptions/verify
 * @access  Private
 */
export const verifySubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { reference, plan } = req.body;

  if (!userId) {
    throw new BadRequestError('User ID missing from Request.');
  }

  if (!reference || !plan || !['monthly', 'yearly'].includes(plan)) {
    throw new BadRequestError('Validation Error: Reference and plan ("monthly" or "yearly") are required.');
  }

  try {
    const result = await SubscriptionService.verifySubscriptionPayment(userId, reference, plan);

    // Save success audit log
    await AuditLog.create({
      action: AUDIT_ACTIONS.VERIFY_SUBSCRIPTION,
      actor: userId,
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
    logger.warn(`Subscription verification failure for user ${userId}:`, error.message);

    // Save failure audit log
    await AuditLog.create({
      action: AUDIT_ACTIONS.VERIFY_SUBSCRIPTION_FAILED,
      actor: userId,
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
 * @desc    Top-up a partial payment subscription
 * @route   POST /api/v1/subscriptions/top-up
 * @access  Private
 */
export const topUpSubscription = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { reference } = req.body;

  if (!userId) {
    throw new BadRequestError('User ID missing from Request.');
  }

  if (!reference) {
    throw new BadRequestError('Validation Error: Transaction reference is required.');
  }

  try {
    const result = await SubscriptionService.topUpSubscriptionPayment(userId, reference);

    await AuditLog.create({
      action: AUDIT_ACTIONS.TOP_UP_SUBSCRIPTION,
      actor: userId,
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
    logger.warn(`Subscription top-up failure for user ${userId}:`, error.message);

    await AuditLog.create({
      action: AUDIT_ACTIONS.TOP_UP_SUBSCRIPTION_FAILED,
      actor: userId,
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
