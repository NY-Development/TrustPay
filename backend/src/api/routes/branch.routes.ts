import { Router } from 'express';
import * as branchController from '../controllers/branch.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createBranchSchema, updateBranchSchema } from '../validators/business.validator';
import { ROLES } from '../../constants';
import { requireActiveAccess } from '../../middleware/accessControl';

const router = Router();

router.use(authenticate, requireActiveAccess);

router.get('/', branchController.getBranches);

router.post(
  '/', 
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]), 
  validate(createBranchSchema), 
  branchController.createBranch
);

router.patch(
  '/:id', 
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]), 
  validate(updateBranchSchema), 
  branchController.updateBranch
);

export default router;
