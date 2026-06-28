import { Router } from 'express';
import { getSubscriptionStatus, verifySubscription, topUpSubscription } from '../controllers/subscription.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Retrieve subscription status
router.get('/status', authenticate, getSubscriptionStatus);

// Submits subscription verification
router.post('/verify', authenticate, verifySubscription);

// Top-up a partial payment subscription
router.post('/top-up', authenticate, topUpSubscription);

export default router;
