import { Request, Response } from 'express';
import { ContactService } from '../../services/contact.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/AppError';
import { AuditLog } from '../../models/AuditLog';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';

/**
 * @desc    Submit a contact request (refund, support, feedback, other)
 * @route   POST /api/v1/contact
 * @access  Private
 */
export const submitContactRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { subject, message, category } = req.body;

  if (!userId) {
    throw new BadRequestError('User ID missing from Request.');
  }

  if (!subject?.trim() || !message?.trim()) {
    throw new BadRequestError('Subject and message are required.');
  }

  const validCategories = ['refund', 'support', 'feedback', 'other'];
  if (!category || !validCategories.includes(category)) {
    throw new BadRequestError('Category must be one of: refund, support, feedback, other.');
  }

  try {
    await ContactService.submitContactRequest(userId, {
      subject: subject.trim(),
      message: message.trim(),
      category,
    });

    await AuditLog.create({
      action: AUDIT_ACTIONS.CONTACT_SUBMIT,
      actor: userId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata: { subject, category },
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We will review it and get back to you via email.',
    });
  } catch (error: any) {
    logger.warn(`Contact request failed for user ${userId}:`, error.message);

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit contact request.',
    });
  }
});
