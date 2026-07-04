import { Router } from 'express';
import * as businessController from '../controllers/business.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createBusinessSchema, updateBusinessSchema } from '../validators/business.validator';
import { ROLES } from '../../constants';
import { requireActiveAccess } from '../../middleware/accessControl';

const router = Router();

router.use(authenticate, requireActiveAccess);

router.get('/', authorize([ROLES.SUPER_ADMIN]), businessController.getBusinesses);
router.get('/:id', businessController.getBusiness);

router.post(
  '/', 
  authorize([ROLES.SUPER_ADMIN]), 
  validate(createBusinessSchema), 
  businessController.createBusiness
);

router.patch(
  '/:id', 
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN]), 
  validate(updateBusinessSchema), 
  businessController.updateBusiness
);

export default router;
