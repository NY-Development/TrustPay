import { z } from 'zod';
import { ALL_PROVIDERS } from '../../constants';

export const createBranchSchema = {
  body: z.object({
    branchName: z.string().min(1, 'Branch name is required'),
    country: z.string().min(1, 'Country is required').default('Ethiopia'),
    region: z.string().min(1, 'Region is required'),
    city: z.string().min(1, 'City is required'),
    subCity: z.string().optional(),
    wereda: z.string().optional(),
    kebele: z.string().optional(),
    address: z.string().min(1, 'Address description is required'),
    phone: z.string().min(1, 'Contact phone is required'),
    email: z.string().email('Invalid email address'),
    accounts: z.array(
      z.object({
        accountNumber: z.string().min(1, 'Account number is required'),
        accountProvider: z.enum(ALL_PROVIDERS as [string, ...string[]], {
          errorMap: () => ({ message: 'Invalid bank provider' }),
        }),
      })
    ).optional(),
  }),
};

export const updateBranchSchema = {
  body: z.object({
    branchName: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    subCity: z.string().optional(),
    wereda: z.string().optional(),
    kebele: z.string().optional(),
    address: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
};

export const switchBranchSchema = {
  body: z.object({
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID format'),
  }),
};

export const branchAccountSchema = {
  body: z.object({
    accountNumber: z.string().min(1, 'Account number is required'),
    accountProvider: z.enum(ALL_PROVIDERS as [string, ...string[]], {
      errorMap: () => ({ message: 'Invalid bank provider' }),
    }),
  }),
};
