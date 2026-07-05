import { Router } from 'express';
import { 
  getMyNotifications, 
  markAsRead, 
  clearAllNotifications 
} from '../controllers/notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Secure entire router sub-tree
router.use(authenticate);

router.route('/')
  .get(getMyNotifications)
  .delete(clearAllNotifications);

router.route('/:id/read')
  .patch(markAsRead);

export default router;