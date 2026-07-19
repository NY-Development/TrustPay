import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/security';

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema
} from '../validators/auth.validator';

const router = Router();

router.get('/csrf-token', authController.getCsrfToken);

/* =========================================================
   AUTH CORE
========================================================= */
router.post('/register', validate(registerSchema), authController.register);
router.post('/login/owner', authRateLimiter, validate(loginSchema), authController.loginOwner);
router.post('/login/employee', authRateLimiter, validate(loginSchema), authController.loginEmployee);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

/* =========================================================
   USER PROFILE
========================================================= */
router.get('/me', authenticate, authController.getMe);
router.patch('/profile', authenticate, authController.updateProfile);

/* =========================================================
   PASSWORD MANAGEMENT
========================================================= */
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);

/* =========================================================
   PUSH NOTIFICATIONS
========================================================= */
router.patch('/push-token', authenticate, authController.updatePushToken);

/* =========================================================
   BANK ACCOUNTS (CRUD)
========================================================= */
router.get('/accounts', authenticate, authController.getAccounts);
router.post('/account', authenticate, authController.addAccount);
router.patch('/account', authenticate, authController.updateAccount);
router.delete('/account', authenticate, authController.removeAccount);

export default router;