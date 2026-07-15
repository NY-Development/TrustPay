import { Router } from 'express';
import * as branchController from '../controllers/branch.controller';
import { authenticate } from '../../middleware/auth';
import { requireOwner, requireActiveAccess } from '../../middleware/accessControl';
import { validate } from '../../middleware/validate';
import {
  createBranchSchema,
  updateBranchSchema,
  switchBranchSchema,
  branchAccountSchema
} from '../validators/branch.validator';

const router = Router();

// Apply authentication universally to branch endpoints
router.use(authenticate);

// Switch branch context (Owner-Only) - doesn't require active branch subscription to switch TO a branch
router.post(
  '/switch',
  requireOwner,
  validate(switchBranchSchema),
  branchController.switchBranch
);

// Apply requireActiveAccess for standard operations
router.get('/', requireActiveAccess, branchController.getBranches);
router.get('/:id', requireActiveAccess, branchController.getBranchDetail);

// Owner-Only CRUD operations
router.post(
  '/',
  requireOwner,
  validate(createBranchSchema),
  branchController.createBranch
);

router.put(
  '/:id',
  requireOwner,
  validate(updateBranchSchema),
  branchController.updateBranch
);

router.put('/:id/deactivate', requireOwner, branchController.deactivateBranch);

// Owner-Only Branch Account Management
router.post(
  '/:id/accounts',
  requireOwner,
  validate(branchAccountSchema),
  branchController.addBranchAccount
);

router.put(
  '/:id/accounts/:accountId',
  requireOwner,
  validate(branchAccountSchema),
  branchController.updateBranchAccount
);

router.delete(
  '/:id/accounts/:accountId',
  requireOwner,
  branchController.deleteBranchAccount
);

export default router;
