import { z } from 'zod';

export const createBusinessSchema = {
  body: z.object({
    name: z.string().min(2, 'Business name must be at least 2 characters'),
    industry: z.enum(['restaurant', 'cafe', 'supermarket', 'pharmacy', 'retail', 'other']),
    logo: z.string().optional(),
  }),
};

export const updateBusinessSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    industry: z.enum(['restaurant', 'cafe', 'supermarket', 'pharmacy', 'retail', 'other']).optional(),
    logo: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createBranchSchema = {
  body: z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    city: z.string().optional(),
    businessId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Business ID').optional(),
  }),
};

export const updateBranchSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    city: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};
