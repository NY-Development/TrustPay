import { Router } from 'express';
import { getSubscriptionStatus, verifySubscription } from '../controllers/subscription.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Retrieve subscription status
router.get('/status', authenticate, getSubscriptionStatus);

// Submits subscription verification
router.post('/verify', authenticate, verifySubscription);

export default router;
