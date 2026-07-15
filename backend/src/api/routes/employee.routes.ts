import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller';
import { authenticate } from '../../middleware/auth';
import { requireOwner } from '../../middleware/accessControl';
import { validate } from '../../middleware/validate';
import {
  inviteEmployeeSchema,
  updateEmployeeSchema,
  resetPasswordSchema,
  moveBranchSchema
} from '../validators/employee.validator';

const router = Router();

// Apply authentication universally to employee endpoints
router.use(authenticate);

// List/Detail (Shared or restricted inside controller check)
router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);

// Owner-Only Operations
router.post(
  '/invite',
  requireOwner,
  validate(inviteEmployeeSchema),
  employeeController.inviteEmployee
);

router.put(
  '/:id',
  requireOwner,
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

router.put('/:id/deactivate', requireOwner, employeeController.deactivateEmployee);
router.put('/:id/activate', requireOwner, employeeController.activateEmployee);
router.delete('/:id', requireOwner, employeeController.deleteEmployee);

router.put(
  '/:id/reset-password',
  requireOwner,
  validate(resetPasswordSchema),
  employeeController.resetEmployeePassword
);

router.put(
  '/:id/move-branch',
  requireOwner,
  validate(moveBranchSchema),
  employeeController.moveEmployee
);

export default router;
