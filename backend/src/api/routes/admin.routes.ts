import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Apply administrative protections globally to this routing file
router.use(authenticate, authorize(['SUPER_ADMIN']));

// Users Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Verifications Management
router.get('/verifications', adminController.getVerifications);
router.get('/verifications/:id', adminController.getVerificationById);

// Subscriptions Management
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/subscriptions/:id', adminController.getSubscriptionById);
router.patch('/subscriptions/:id', adminController.updateSubscription);

// Audit Trails
router.get('/audit-logs', adminController.getAuditLogs);

// Global system metrics
router.get('/stats', adminController.getSystemStats);

export default router;
