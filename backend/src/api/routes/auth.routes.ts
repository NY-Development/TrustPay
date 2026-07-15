import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema
} from '../validators/auth.validator';

const router = Router();

/* =========================================================
   AUTH CORE
========================================================= */
router.post('/register', validate(registerSchema), authController.register);
router.post('/login/owner', validate(loginSchema), authController.loginOwner);
router.post('/login/employee', validate(loginSchema), authController.loginEmployee);
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
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
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