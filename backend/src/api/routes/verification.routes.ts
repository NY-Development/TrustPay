import { Router } from 'express';
import * as verificationController from '../controllers/verification.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { 
  verifyManualSchema, 
  verifyUniversalSchema, 
  verifyOcrSchema 
} from '../validators/verification.validator';
import { verificationRateLimiter } from '../../middleware/security';

const router = Router();

router.use(authenticate);

router.post(
  '/verify', 
  verificationRateLimiter,
  validate(verifyManualSchema), 
  verificationController.verifyManual
);

router.post(
  '/verify-universal', 
  verificationRateLimiter,
  validate(verifyUniversalSchema), 
  verificationController.verifyUniversal
);

router.post(
  '/verify-ocr', 
  verificationRateLimiter,
  validate(verifyOcrSchema), 
  verificationController.verifyOcr
);

router.get('/', verificationController.getVerifications);
router.get('/:id', verificationController.getVerificationById);

export default router;
