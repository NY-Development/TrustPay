import { Router } from 'express';
import * as communicationController from '../controllers/communication.controller';
import { authenticate } from '../../middleware/auth';
import { requireOwner } from '../../middleware/accessControl';
import { validate } from '../../middleware/validate';
import { sendMessageSchema } from '../validators/communication.validator';

const router = Router();

// Apply authentication universally to all communication endpoints
router.use(authenticate);

// Get messages list and get unread count
router.get('/', communicationController.listMessages);
router.get('/unread-count', communicationController.getUnreadCount);

// Get specific message detail
router.get('/:id', communicationController.getMessageDetail);

// Mark specific message as read
router.put('/:id/read', communicationController.markAsRead);

// Owner-Only operations
router.post(
  '/',
  requireOwner,
  validate(sendMessageSchema),
  communicationController.sendMessage
);

export default router;
