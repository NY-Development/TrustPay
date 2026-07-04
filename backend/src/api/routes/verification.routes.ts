import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  verifyManualSchema,
  verifyOcrSchema
} from '../validators/verification.validator';
import { verificationRateLimiter } from '../../middleware/security';
import { requireActiveAccess } from '../../middleware/accessControl';

const router = Router();

router.use(authenticate, requireActiveAccess);

router.post(
  '/verify',
  verificationRateLimiter,
  validate(verifyManualSchema),
  verificationController.verifyManual
);

router.post(
  '/verify-ocr',
  verificationRateLimiter,
  validate(verifyOcrSchema),
  verificationController.verifyOcr
);

router.get('/business-history', verificationController.getBusinessVerifications);
router.get('/my-history', verificationController.getMyVerifications);
router.get('/:id', verificationController.getVerificationById);

export default router;
