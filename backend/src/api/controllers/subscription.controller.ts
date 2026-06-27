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

  const activeSub = await SubscriptionService.checkActiveSubscription(userId);

  res.status(200).json({
    success: true,
    data: {
      active: !!activeSub,
      subscription: activeSub,
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
    const subscription = await SubscriptionService.verifySubscriptionPayment(userId, reference, plan);

    // Save success audit log
    await AuditLog.create({
      action: AUDIT_ACTIONS.VERIFY_SUBSCRIPTION,
      actor: userId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata: { reference, plan, subscriptionId: subscription._id },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription payment verified and activated successfully.',
      data: subscription,
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
