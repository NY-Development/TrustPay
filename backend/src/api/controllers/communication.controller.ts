import { Request, Response } from 'express';
import { Message } from '../../models/Message';
import { Employee } from '../../models/Employee';
import { Branch } from '../../models/Branch';
import Notification from '../../models/Notification';
import { asyncHandler } from '../../utils/asyncHandler';
import { NotificationService } from '../../services/notification.service';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError
} from '../../utils/AppError';

/**
 * Send Message (Owner Only)
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { recipientType, messageType, title, body, branchId, recipientIds } = req.body;
  const ownerId = req.user?.userId;

  // 1. Validate conditional structure based on recipientType
  if (recipientType === 'BRANCH' && !branchId) {
    throw new BadRequestError('branchId is required for BRANCH recipient type');
  }
  if (recipientType === 'INDIVIDUAL' && (!recipientIds || recipientIds.length === 0)) {
    throw new BadRequestError('recipientIds array is required and must not be empty for INDIVIDUAL recipient type');
  }

  // 2. Establish recipient employees based on selection type
  let targetEmployees: any[] = [];

  if (recipientType === 'COMPANY') {
    targetEmployees = await Employee.find({ ownerId, status: 'ACTIVE' });
  } else if (recipientType === 'BRANCH') {
    // Verify owner owns this branch
    const branch = await Branch.findById(branchId);
    if (!branch || branch.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('Access Denied: You do not own this branch.');
    }
    targetEmployees = await Employee.find({ branchId, status: 'ACTIVE' });
  } else if (recipientType === 'INDIVIDUAL') {
    targetEmployees = await Employee.find({
      _id: { $in: recipientIds },
      ownerId,
      status: 'ACTIVE',
    });
    if (targetEmployees.length === 0) {
      throw new BadRequestError('No active employees found matching the provided IDs.');
    }
  }

  // 2. Create the Message record
  const message = new Message({
    senderId: ownerId,
    branchId: recipientType === 'BRANCH' ? branchId : undefined,
    recipientIds: targetEmployees.map((emp) => emp._id),
    recipientType,
    messageType,
    title,
    body,
    readBy: [],
  });

  await message.save();

  // 3. Dispatch Notifications asynchronously to avoid blocking the client response
  const notificationsPromise = targetEmployees.map(async (emp) => {
    try {
      // Create Database Notification record
      await Notification.create({
        recipientId: emp._id,
        recipientType: 'employee',
        category: 'ANNOUNCEMENT',
        title: title,
        body: body,
        channels: ['push', 'in_app'],
        branchId: emp.branchId,
        metadata: {
          messageId: message._id.toString(),
          messageType,
        },
      });

      // Send push notification if they have registered a push token
      if (emp.pushToken) {
        await NotificationService.sendNotification(
          emp.pushToken,
          title,
          body,
          {
            type: 'ANNOUNCEMENT',
            messageId: message._id.toString(),
          }
        );
      }
    } catch (err) {
      console.error(`Failed to dispatch notification to employee ${emp._id}:`, err);
    }
  });

  // Execute notifications concurrently
  Promise.all(notificationsPromise).catch((err) => {
    console.error('Error dispatching notifications:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Message dispatched and notification broadcasts initiated.',
    data: message,
  });
});

/**
 * List messages based on caller's identity
 */
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const { actorType, userId, branchId } = req.user || {};

  if (actorType === 'owner') {
    // Owner sees all messages they sent
    const messages = await Message.find({ senderId: userId })
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: messages,
    });
  } else {
    // Employee sees messages targeting their individual ID, their branch, or the entire company
    const messages = await Message.find({
      recipientIds: userId,
      $or: [
        { recipientType: 'COMPANY' },
        { recipientType: 'BRANCH', branchId },
        { recipientType: 'INDIVIDUAL' },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  }
});

/**
 * Get detailed message info
 */
export const getMessageDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actorType, userId, branchId } = req.user || {};

  const message = await Message.findById(id);
  if (!message) {
    throw new NotFoundError('Message not found.');
  }

  // Authorization checking
  if (actorType === 'owner') {
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenError('Access Denied: You did not send this message.');
    }
  } else {
    const isRecipient = message.recipientIds?.some((rId) => rId.toString() === userId);
    if (!isRecipient) {
      throw new ForbiddenError('Access Denied: You are not a recipeint of this message.');
    }
  }

  res.status(200).json({
    success: true,
    data: message,
  });
});

/**
 * Mark message as read (Employee Only)
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const employeeId = req.user?.userId;

  const message = await Message.findById(id);
  if (!message) {
    throw new NotFoundError('Message not found.');
  }

  const isRecipient = message.recipientIds?.some((rId) => rId.toString() === employeeId);
  if (!isRecipient) {
    throw new ForbiddenError('Access Denied: You are not a recipient of this message.');
  }

  // Add employee ID to readBy array if not already present
  if (!message.readBy.some((rId) => rId.toString() === employeeId)) {
    message.readBy.push(employeeId as any);
    await message.save();
  }

  res.status(200).json({
    success: true,
    message: 'Message marked as read successfully.',
    data: message,
  });
});

/**
 * Get unread messages count (Employee Only)
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const { userId, branchId } = req.user || {};

  const unreadMessagesCount = await Message.countDocuments({
    recipientIds: userId,
    readBy: { $ne: userId as any },
    $or: [
      { recipientType: 'COMPANY' },
      { recipientType: 'BRANCH', branchId },
      { recipientType: 'INDIVIDUAL' },
    ],
  });

  res.status(200).json({
    success: true,
    data: {
      unreadCount: unreadMessagesCount,
    },
  });
});
