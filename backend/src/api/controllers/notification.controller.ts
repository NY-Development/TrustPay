import { Request, Response, NextFunction } from 'express';
import Notification from '../../models/Notification';
import { User } from '../../models/User';
import { NotificationService } from '../../services/notifications/notification.service';
import { sendEmail } from '../../utils/email';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { logger } from '../../config/logger';

/**
 * Fetch all notifications belonging to the logged-in user
 */
export const getMyNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) return next(new AppError('Unauthorized account context', 401));

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  }
);

/**
 * Triggered internally by backend services (e.g., Verification, Auth, Subscriptions)
 * Creates the DB notification, fires Expo Push SDK, and delivers email templates.
 */
export const createAndDispatchNotification = async (params: {
  userId: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  auditLogId?: string;
  emailTemplate?: { subject: string; html: string };
}) => {
  try {
    const { userId, title, body, type, auditLogId, emailTemplate } = params;

    // 1. Fetch user to target delivery systems
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`Failed dispatch: Target user ${userId} non-existent.`);
      return null;
    }

    // 2. Persist notification to Database
    const notification = await Notification.create({
      userId,
      businessId: user.businessId,
      auditLogId,
      title,
      body,
      type,
    });

    // 3. Dispatch Mobile Push via Expo-Server-SDK using fixed method name
    if (user.pushToken) {
      NotificationService.sendPushNotification(user.pushToken, title, body, {
        notificationId: notification._id,
        type,
      }).catch((err) => logger.error(`Expo Push processing failure:`, err));
    }

    // 4. Dispatch Email Notification if custom template context exists
    if (emailTemplate) {
      sendEmail(user.email, emailTemplate.subject, emailTemplate.html)
        .catch((err) => logger.error(`Email transport handling failure:`, err));
    }

    return notification;
  } catch (error) {
    logger.error('Critical notification delivery exception:', error);
    return null;
  }
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found or access denied', 404));
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  }
);

/**
 * Bulk clear all notifications for the active user session
 */
export const clearAllNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    await Notification.updateMany({ userId }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  }
);