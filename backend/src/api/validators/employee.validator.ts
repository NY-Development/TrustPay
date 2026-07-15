import { z } from 'zod';
import { ROLES } from '../../constants';

const EMPLOYEE_ROLES = [
  ROLES.MANAGER,
  ROLES.CASHIER,
  ROLES.VERIFIER,
  ROLES.RECEPTIONIST,
  ROLES.OTHER
];

export const inviteEmployeeSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(EMPLOYEE_ROLES as [string, ...string[]], {
      errorMap: () => ({ message: 'Invalid employee role' }),
    }),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID format'),
  }),
};

export const updateEmployeeSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    role: z.enum(EMPLOYEE_ROLES as [string, ...string[]]).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

export const moveBranchSchema = {
  body: z.object({
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID format'),
  }),
};
