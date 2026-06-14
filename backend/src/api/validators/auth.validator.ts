import { z } from 'zod';
import { ALL_ROLES } from '../../constants';

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(ALL_ROLES as [string, ...string[]]).optional(),
    businessId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Business ID').optional(),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID').optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshTokenSchema = {
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
};
